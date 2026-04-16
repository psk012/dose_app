const User = require("../models/user");
const Otp = require("../models/otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const logger = require("../logger");
const sendEmail = require("../utils/sendEmail");
const { createSecureToken, generateNumericOtp, hashValue, timingSafeEqual } = require("../utils/otp");
const { escapeHtml, maskEmail, validateEmail } = require("../utils/contactValidation");

const SIGNUP_OTP_TTL_MINUTES = 5;
const SIGNUP_TOKEN_TTL = "15m";
const ACCESS_TOKEN_TTL = "7d";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function isStrongPassword(password) {
    return (
        typeof password === "string" &&
        password.length >= 8 &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
}

function buildOtpEmail(otpCode) {
    return `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9ff;">
        <div style="background: #945d65; padding: 28px 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Manas</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">your mind, your space</p>
        </div>
        <div style="padding: 32px 28px; text-align: center;">
            <p style="color: #4a4458; font-size: 16px; margin: 0 0 6px; font-weight: 600;">Welcome to Manas</p>
            <p style="color: #7c7291; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">Use this verification code to finish creating your account.</p>
            <div style="background: #fff; border: 2px solid #e4dfff; border-radius: 12px; padding: 20px; display: inline-block; margin: 0 0 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #945d65;">${escapeHtml(otpCode)}</span>
            </div>
            <p style="color: #a099b0; font-size: 12px; margin: 0;">This code expires in ${SIGNUP_OTP_TTL_MINUTES} minutes.</p>
        </div>
    </div>`;
}

function buildResetEmail(resetUrl) {
    return `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9ff;">
        <div style="background: #945d65; padding: 28px 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Manas</h1>
        </div>
        <div style="padding: 32px 28px; text-align: center;">
            <p style="color: #4a4458; font-size: 16px; margin: 0 0 6px; font-weight: 600;">Reset your password</p>
            <p style="color: #7c7291; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">This link expires in 1 hour. If you did not request it, you can ignore this email.</p>
            <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: #945d65; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;">Reset Password</a>
        </div>
    </div>`;
}

exports.sendOtp = async (req, res) => {
    try {
        const validation = validateEmail(req.body.email);
        if (!validation.ok) return res.status(400).json({ message: validation.message });
        const email = validation.value;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const otpCode = generateNumericOtp(4);
        await Otp.deleteMany({ email });
        await Otp.create({
            email,
            otpHash: hashValue(otpCode, `signup:${email}`),
        });

        try {
            await sendEmail(email, "Your Manas verification code", buildOtpEmail(otpCode));
            logger.info("Signup OTP email delivered", { email: maskEmail(email) });
            res.status(200).json({ message: "OTP sent successfully" });
        } catch (emailErr) {
            logger.error("Signup OTP email failed", { email: maskEmail(email), error: emailErr.message });
            await Otp.deleteMany({ email });
            res.status(502).json({ message: "Failed to send OTP email. Please try again in a moment." });
        }
    } catch (err) {
        logger.error("Send OTP error", { error: err.message });
        res.status(500).json({ message: "Something went wrong sending OTP." });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const emailValidation = validateEmail(req.body.email);
        const { otp } = req.body;

        if (!emailValidation.ok || typeof otp !== "string" || !/^\d{4}$/.test(otp)) {
            return res.status(400).json({ message: "Invalid OTP format" });
        }

        const email = emailValidation.value;
        const record = await Otp.findOne({ email });
        if (!record) return res.status(400).json({ message: "Invalid or expired OTP" });

        if (record.attempts >= 5) {
            await Otp.deleteMany({ email });
            return res.status(429).json({ message: "Too many invalid attempts. Please request a new code." });
        }

        const expectedHash = hashValue(otp, `signup:${email}`);
        if (!timingSafeEqual(record.otpHash, expectedHash)) {
            record.attempts += 1;
            await record.save();
            logger.warn("Invalid signup OTP attempt", { email: maskEmail(email), attempts: record.attempts });
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const signupToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: SIGNUP_TOKEN_TTL });
        await Otp.deleteMany({ email });
        res.status(200).json({ message: "OTP verified", signupToken });
    } catch (err) {
        logger.error("Verify OTP error", { error: err.message });
        res.status(500).json({ message: "Something went wrong verifying OTP." });
    }
};

exports.signup = async (req, res) => {
    try {
        const { email, password, signupToken } = req.body;
        if (typeof email !== "string" || typeof password !== "string" || typeof signupToken !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }

        let decoded;
        try {
            decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
        } catch {
            return res.status(400).json({ message: "Invalid or expired signup session. Please verify your email again." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (decoded.email !== normalizedEmail) {
            return res.status(400).json({ message: "Email mismatch" });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters and include a number and special character." });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) return res.status(409).json({ message: "Account already exists" });

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            isVerified: true,
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

        logger.info("New account created via OTP flow", { email: maskEmail(normalizedEmail), ip: req.ip });
        res.status(201).json({ message: "Account created successfully", token });
    } catch (err) {
        logger.error("Signup error", { error: err.message });
        res.status(500).json({ message: "Something went wrong finalizing your account." });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });
        if (!user.isVerified) return res.status(403).json({ message: "Please verify your email before logging in." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn("Failed login attempt", { email: maskEmail(normalizedEmail), ip: req.ip });
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
        res.json({ token });
    } catch (err) {
        logger.error("Login error", { error: err.message });
        res.status(500).json({ message: "Server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (typeof email !== "string" || !validator.isEmail(email)) {
            return res.status(400).json({ message: "Valid email required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const genericMessage = "If an account exists for this email, a reset link has been sent.";
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.json({ message: genericMessage });

        const resetToken = createSecureToken(32);
        user.resetPasswordToken = hashValue(resetToken, "password-reset");
        user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL_MS;
        await user.save();

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
        await sendEmail(user.email, "Reset your Manas password", buildResetEmail(resetUrl));

        logger.info("Password reset requested", { email: maskEmail(normalizedEmail), ip: req.ip });
        res.json({ message: genericMessage });
    } catch (err) {
        logger.error("Forgot password error", { error: err.message });
        res.status(500).json({ message: "Server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (typeof token !== "string" || typeof newPassword !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ message: "Password must be at least 8 characters and include a number and special character." });
        }

        const user = await User.findOne({
            resetPasswordToken: hashValue(token, "password-reset"),
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

        user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password has been successfully reset" });
    } catch (err) {
        logger.error("Reset password error", { error: err.message });
        res.status(500).json({ message: "Server error" });
    }
};
