const User = require("../models/user");
const Otp = require("../models/otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validator = require("validator");
const logger = require("../logger");
const sendEmail = require("../utils/sendEmail");
const disposableDomains = require("disposable-email-domains");

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (typeof email !== "string" || !validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
            return res.status(400).json({ message: "Disposable email addresses are not allowed." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        // Generate a 4-digit numeric OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Clear existing Otps for this email
        await Otp.deleteMany({ email: email.toLowerCase() });
        const newOtp = new Otp({ email: email.toLowerCase(), otp: otpCode });
        await newOtp.save();

        // AWAIT the email — if SMTP fails, the user must know immediately
        try {
            await sendEmail(
                email, 
                "Your Manas Verification Code 💜", 
                `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9ff;">
                    <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 32px 24px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">manas</h1>
                        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">your mind, your space</p>
                    </div>
                    <div style="padding: 32px 28px; text-align: center;">
                        <p style="color: #4a4458; font-size: 16px; margin: 0 0 6px; font-weight: 500;">hey, welcome to manas 💜</p>
                        <p style="color: #7c7291; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">thank you for choosing us. here's your verification code; you're just one step away!</p>
                        <div style="background: #fff; border: 2px solid #e4dfff; border-radius: 12px; padding: 20px; display: inline-block; margin: 0 0 24px;">
                            <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #6c5ce7;">${otpCode}</span>
                        </div>
                        <p style="color: #a099b0; font-size: 12px; margin: 0;">this code expires in 5 minutes ✨</p>
                    </div>
                    <div style="background: #f3f0ff; padding: 16px 28px; text-align: center; border-top: 1px solid #ede9ff;">
                        <p style="color: #b0a8c9; font-size: 11px; margin: 0;">made with care · manas</p>
                    </div>
                </div>`
            );
            logger.info(`OTP email delivered to ${email}`);
            res.status(200).json({ message: "OTP sent successfully" });
        } catch (emailErr) {
            // Email failed — tell the user so they can retry
            logger.error(`OTP email FAILED for ${email}: ${emailErr.message}`);
            // Clean up the OTP since we couldn't deliver it
            await Otp.deleteMany({ email: email.toLowerCase() });
            res.status(502).json({ message: "Failed to send OTP email. Please try again in a moment." });
        }
    } catch (err) {
        logger.error(`Send OTP error: ${err.message}`);
        res.status(500).json({ message: err.message || "Something went wrong sending OTP." });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (typeof email !== "string" || typeof otp !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: "Invalid OTP format" });
        }
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

        const record = await Otp.findOne({ email: email.toLowerCase(), otp: { $eq: otp } });
        if (!record) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const signupToken = jwt.sign({ email: email.toLowerCase() }, process.env.JWT_SECRET, { expiresIn: "15m" });
        
        await Otp.deleteMany({ email: email.toLowerCase() });

        res.status(200).json({ message: "OTP verified", signupToken });
    } catch (err) {
        logger.error(`Verify OTP error: ${err.message}`);
        res.status(500).json({ message: "Something went wrong verifying OTP." });
    }
};

exports.signup = async (req, res) => {
    try {
        const { email, password, signupToken } = req.body;
        if (typeof email !== "string" || typeof password !== "string" || typeof signupToken !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }
        if (!email || !password || !signupToken) {
            return res.status(400).json({ message: "Email, password, and signup token are required." });
        }

        let decoded;
        try {
            decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(400).json({ message: "Invalid or expired signup session. Please verify your email again." });
        }
        
        if (decoded.email !== email.toLowerCase()) {
            return res.status(400).json({ message: "Email mismatch" });
        }

        // Password Policy check
        if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
        if (!/[0-9]/.test(password)) return res.status(400).json({ message: "Password must contain at least one digit" });
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return res.status(400).json({ message: "Password must contain at least one special character" });

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: "Account already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({ 
            email: email.toLowerCase(), 
            password: hashedPassword,
            isVerified: true
        });
        await user.save();

        logger.info(`New account created via OTP flow: ${email} from IP: ${req.ip}`);
        res.status(201).json({ message: "Account created successfully" });
    } catch (err) {
        logger.error(`Signup error: ${err.message}`);
        res.status(500).json({ message: "Something went wrong finalizing your account." });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }
        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "No account found with this email" });
        if (!user.isVerified) return res.status(403).json({ message: "Please verify your email before logging in." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (typeof email !== "string" || !validator.isEmail(email)) return res.status(400).json({ message: "Valid email required" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ message: "No account found" });

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;
        await sendEmail(user.email, "Reset Your Manas Password 🔑", 
            `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9ff;">
                <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">manas</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">your mind, your space</p>
                </div>
                <div style="padding: 32px 28px; text-align: center;">
                    <p style="color: #4a4458; font-size: 16px; margin: 0 0 6px; font-weight: 500;">hey, no worries! 🤗</p>
                    <p style="color: #7c7291; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">we all forget sometimes. tap the button below to set a new password.</p>
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600;">Reset Password</a>
                    <p style="color: #a099b0; font-size: 12px; margin: 20px 0 0;">this link expires in 1 hour ✨</p>
                </div>
                <div style="background: #f3f0ff; padding: 16px 28px; text-align: center; border-top: 1px solid #ede9ff;">
                    <p style="color: #b0a8c9; font-size: 11px; margin: 0;">made with care · manas</p>
                </div>
            </div>`);

        res.json({ message: "Reset link generated. Check your email." });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (typeof token !== "string" || typeof newPassword !== "string") return res.status(400).json({ message: "Invalid input types" });
        if (!token || !newPassword) return res.status(400).json({ message: "Token and new password required" });
        if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password has been successfully reset" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
