const SafetyNetConfig = require("../models/safetyNetConfig");
const RiskAssessment = require("../models/riskAssessment");
const AlertLog = require("../models/alertLog");
const ContactVerificationOtp = require("../models/contactVerificationOtp");
const User = require("../models/user");
const { encrypt, decrypt } = require("../utils/encryption");
const { createSecureToken, generateNumericOtp, hashValue, timingSafeEqual } = require("../utils/otp");
const {
    escapeHtml,
    maskEmail,
    maskPhone,
    validateContactName,
    validateEmail,
    validatePhone,
} = require("../utils/contactValidation");
const sendEmail = require("../utils/sendEmail");
const sendSms = require("../utils/sendSms");
const logger = require("../logger");

const MAX_CONTACTS = 2;
const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000;
const CONSENT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function targetHash(channel, value) {
    return hashValue(value, `comfort-zone-target:${channel}`);
}

function otpHash(channel, target, otp) {
    return hashValue(`${targetHash(channel, target)}:${otp}`, `comfort-zone-otp:${channel}`);
}

function verificationTokenHash(channel, target, token) {
    return hashValue(`${targetHash(channel, target)}:${token}`, `comfort-zone-verification:${channel}`);
}

function consentTokenHash(token) {
    return hashValue(token, "comfort-zone-consent");
}

function getPublicApiBase(req) {
    return process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
}

function decryptContact(contact) {
    const email = contact.emailEncrypted ? decrypt(contact.emailEncrypted) : "";
    const phone = contact.phoneEncrypted ? decrypt(contact.phoneEncrypted) : "";

    return {
        id: contact._id,
        name: contact.nameEncrypted ? decrypt(contact.nameEncrypted) : "",
        email,
        phone,
        isEmailVerified: Boolean(contact.isEmailVerified),
        isPhoneVerified: Boolean(contact.isPhoneVerified),
        isAccepted: Boolean(contact.isAccepted),
        isActive: Boolean(contact.isEmailVerified && contact.isPhoneVerified && contact.isAccepted),
        addedAt: contact.addedAt,
        acceptedAt: contact.acceptedAt,
        acceptanceRequestedAt: contact.acceptanceRequestedAt,
    };
}

function activeContacts(config) {
    return (config.trustedContacts || []).filter(
        (contact) => contact.isEmailVerified && contact.isPhoneVerified && contact.isAccepted
    );
}

async function findOrCreateConfig(userId, enabled = true) {
    let config = await SafetyNetConfig.findOne({ userId });
    if (!config) {
        config = new SafetyNetConfig({
            userId,
            enabled,
            consentGivenAt: enabled ? new Date() : undefined,
        });
    }
    return config;
}

function hasDuplicateContact(config, emailHash, phoneHash) {
    return (config.trustedContacts || []).some((contact) => (
        contact.emailHash === emailHash || contact.phoneHash === phoneHash
    ));
}

function buildContactOtpEmail(otpCode) {
    return `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9ff;">
        <div style="background: #945d65; padding: 28px 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Manas</h1>
        </div>
        <div style="padding: 32px 28px; text-align: center;">
            <p style="color: #4a4458; font-size: 16px; margin: 0 0 8px; font-weight: 600;">Verify this contact email</p>
            <p style="color: #7c7291; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">Use this code to add the email to My Comfort Zone.</p>
            <div style="background: #fff; border: 2px solid #e4dfff; border-radius: 12px; padding: 20px; display: inline-block; margin: 0 0 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #945d65;">${escapeHtml(otpCode)}</span>
            </div>
            <p style="color: #a099b0; font-size: 12px; margin: 0;">This code expires in 10 minutes.</p>
        </div>
    </div>`;
}

function buildConsentEmail({ contactName, ownerEmail, acceptUrl }) {
    return `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9ff;">
        <div style="background: #945d65; padding: 28px 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">My Comfort Zone</h1>
        </div>
        <div style="padding: 32px 28px;">
            <p style="color: #4a4458; font-size: 16px; margin: 0 0 12px; font-weight: 600;">Hi ${escapeHtml(contactName)},</p>
            <p style="color: #7c7291; font-size: 14px; margin: 0 0 16px; line-height: 1.8;">
                ${escapeHtml(ownerEmail)} added you to My Comfort Zone in Manas.
            </p>
            <p style="color: #4a4458; font-size: 15px; margin: 0 0 24px; line-height: 1.7;">
                You've been added as a trusted contact. Accept?
            </p>
            <a href="${escapeHtml(acceptUrl)}" style="display: inline-block; background: #945d65; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 600;">Accept</a>
            <div style="background: #f3f0ff; border-radius: 12px; padding: 16px; margin: 28px 0 0; border-left: 4px solid #945d65;">
                <p style="color: #7c7291; font-size: 12px; margin: 0; line-height: 1.6;">
                    Privacy note: Manas never shares journal entries, emotional content, AI summaries, or personal thoughts with contacts.
                </p>
            </div>
        </div>
    </div>`;
}

function buildConsentPage({ accepted = false, expired = false, token }) {
    const title = accepted ? "You are connected" : expired ? "This invitation has expired" : "Accept My Comfort Zone invitation?";
    const body = accepted
        ? "You have accepted this invitation. If Manas ever sends an alert, it will only be a generic check-in reminder."
        : expired
            ? "Please ask the person who invited you to send a new invitation."
            : "You've been added as a trusted contact. Accept?";

    const action = expired || accepted
        ? ""
        : `<form method="POST" action="/api/comfort-zone/contacts/consent/${escapeHtml(token)}/accept">
            <button style="background:#945d65;color:#fff;border:0;border-radius:10px;padding:14px 28px;font-weight:700;cursor:pointer;">Accept</button>
        </form>`;

    return `<!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${escapeHtml(title)}</title>
            </head>
            <body style="font-family: Arial, sans-serif; background:#fff6f4; color:#221b1b; display:flex; min-height:100vh; align-items:center; justify-content:center; padding:24px;">
                <main style="max-width:460px; background:#fff; border:1px solid #ece0de; border-radius:16px; padding:32px; text-align:center;">
                    <h1 style="margin-top:0;">${escapeHtml(title)}</h1>
                    <p style="line-height:1.7; color:#524344;">${escapeHtml(body)}</p>
                    ${action}
                </main>
            </body>
        </html>`;
}

async function requestOtp({ req, res, channel }) {
    try {
        const validation = channel === "email"
            ? validateEmail(req.body.email)
            : validatePhone(req.body.phone);
        if (!validation.ok) return res.status(400).json({ message: validation.message });

        const target = validation.value;
        const hash = targetHash(channel, target);
        const existing = await ContactVerificationOtp.findOne({
            userId: req.userId,
            channel,
            targetHash: hash,
        }).sort({ createdAt: -1 });

        if (existing && Date.now() - existing.createdAt.getTime() < 60 * 1000) {
            return res.status(429).json({ message: "Please wait before requesting another code." });
        }

        const config = await SafetyNetConfig.findOne({ userId: req.userId });
        if (config?.trustedContacts?.some((contact) => contact.emailHash === hash || contact.phoneHash === hash)) {
            return res.status(409).json({ message: "This contact is already in My Comfort Zone." });
        }

        const otp = generateNumericOtp(6);
        await ContactVerificationOtp.deleteMany({ userId: req.userId, channel, targetHash: hash });
        await ContactVerificationOtp.create({
            userId: req.userId,
            channel,
            targetHash: hash,
            otpHash: otpHash(channel, target, otp),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
        });

        if (channel === "email") {
            await sendEmail(target, "Verify My Comfort Zone contact", buildContactOtpEmail(otp));
            logger.info("Contact email OTP sent", { userId: String(req.userId), email: maskEmail(target) });
        } else {
            await sendSms(target, `Manas My Comfort Zone code: ${otp}. It expires in 10 minutes.`);
            logger.info("Contact phone OTP sent", { userId: String(req.userId), phone: maskPhone(target) });
        }

        res.json({ message: channel === "email" ? "Email verification code sent." : "Phone verification code sent." });
    } catch (err) {
        logger.error("Contact OTP request error", { userId: String(req.userId), channel, error: err.message });
        res.status(500).json({ message: `Failed to send ${channel} verification code.` });
    }
}

async function verifyOtp({ req, res, channel }) {
    try {
        const validation = channel === "email"
            ? validateEmail(req.body.email)
            : validatePhone(req.body.phone);
        const { otp } = req.body;

        if (!validation.ok || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: "Invalid verification code." });
        }

        const target = validation.value;
        const hash = targetHash(channel, target);
        const record = await ContactVerificationOtp.findOne({
            userId: req.userId,
            channel,
            targetHash: hash,
            expiresAt: { $gt: new Date() },
        });

        if (!record) return res.status(400).json({ message: "Invalid or expired verification code." });
        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await ContactVerificationOtp.deleteMany({ userId: req.userId, channel, targetHash: hash });
            return res.status(429).json({ message: "Too many invalid attempts. Request a new code." });
        }

        const expectedHash = otpHash(channel, target, otp);
        if (!timingSafeEqual(record.otpHash, expectedHash)) {
            record.attempts += 1;
            await record.save();
            logger.warn("Invalid contact OTP attempt", {
                userId: String(req.userId),
                channel,
                attempts: record.attempts,
            });
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        const verificationToken = createSecureToken(32);
        record.verifiedAt = new Date();
        record.verificationTokenHash = verificationTokenHash(channel, target, verificationToken);
        record.expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
        await record.save();

        res.json({
            message: `${channel === "email" ? "Email" : "Phone"} verified.`,
            verificationToken,
        });
    } catch (err) {
        logger.error("Contact OTP verify error", { userId: String(req.userId), channel, error: err.message });
        res.status(500).json({ message: "Failed to verify code." });
    }
}

async function consumeVerificationToken({ userId, channel, target, token }) {
    if (typeof token !== "string" || token.length < 32) return false;

    const hash = targetHash(channel, target);
    const record = await ContactVerificationOtp.findOne({
        userId,
        channel,
        targetHash: hash,
        verificationTokenHash: verificationTokenHash(channel, target, token),
        verifiedAt: { $exists: true },
        expiresAt: { $gt: new Date() },
    });

    if (!record) return false;
    await ContactVerificationOtp.deleteMany({ userId, channel, targetHash: hash });
    return true;
}

async function sendConsentMessages({ req, userId, contactName, email, phone, token }) {
    const owner = await User.findById(userId).select("email").lean();
    const ownerEmail = owner?.email || "A Manas user";
    const acceptUrl = `${getPublicApiBase(req)}/api/comfort-zone/contacts/consent/${token}`;

    await sendEmail(
        email,
        "You've been added to My Comfort Zone",
        buildConsentEmail({ contactName, ownerEmail, acceptUrl })
    );
    await sendSms(phone, `You've been added as a trusted contact. Accept? ${acceptUrl}`);
}

exports.getConfig = async (req, res) => {
    try {
        const config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config) {
            return res.json({
                enabled: false,
                trustedContacts: [],
                activeContactCount: 0,
                isPaused: false,
                consentGivenAt: null,
            });
        }

        const wasPaused = config.isPaused;
        config.checkPauseExpiry();
        if (wasPaused !== config.isPaused) await config.save();

        const contacts = config.trustedContacts.map(decryptContact);

        res.json({
            enabled: config.enabled,
            trustedContacts: contacts,
            activeContactCount: contacts.filter((contact) => contact.isActive).length,
            isPaused: config.isPaused,
            pausedUntil: config.pausedUntil,
            consentGivenAt: config.consentGivenAt,
            lastAnalysisAt: config.lastAnalysisAt,
        });
    } catch (err) {
        logger.error("My Comfort Zone getConfig error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to load My Comfort Zone settings." });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== "boolean") {
            return res.status(400).json({ message: "Invalid configuration" });
        }

        const config = await findOrCreateConfig(req.userId, enabled);
        config.enabled = enabled;
        if (enabled && !config.consentGivenAt) config.consentGivenAt = new Date();

        if (!enabled) {
            await RiskAssessment.deleteMany({ userId: req.userId });
            config.isPaused = false;
            config.pausedAt = undefined;
            config.pausedUntil = undefined;
            config.lastAnalysisAt = undefined;
        }

        await config.save();

        logger.info("My Comfort Zone config updated", { userId: String(req.userId), enabled });
        res.json({ message: enabled ? "My Comfort Zone enabled" : "My Comfort Zone disabled", enabled });
    } catch (err) {
        logger.error("My Comfort Zone updateConfig error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to update My Comfort Zone settings." });
    }
};

exports.requestEmailOtp = (req, res) => requestOtp({ req, res, channel: "email" });
exports.requestPhoneOtp = (req, res) => requestOtp({ req, res, channel: "phone" });
exports.verifyEmailOtp = (req, res) => verifyOtp({ req, res, channel: "email" });
exports.verifyPhoneOtp = (req, res) => verifyOtp({ req, res, channel: "phone" });

exports.addVerifiedContact = async (req, res) => {
    try {
        const nameValidation = validateContactName(req.body.name);
        const emailValidation = validateEmail(req.body.email);
        const phoneValidation = validatePhone(req.body.phone);

        if (!nameValidation.ok) return res.status(400).json({ message: nameValidation.message });
        if (!emailValidation.ok) return res.status(400).json({ message: emailValidation.message });
        if (!phoneValidation.ok) return res.status(400).json({ message: phoneValidation.message });

        const { emailVerificationToken, phoneVerificationToken } = req.body;
        const name = nameValidation.value;
        const email = emailValidation.value;
        const phone = phoneValidation.value;
        const emailHash = targetHash("email", email);
        const phoneHash = targetHash("phone", phone);

        const config = await findOrCreateConfig(req.userId, true);
        if (config.trustedContacts.length >= MAX_CONTACTS) {
            return res.status(400).json({ message: `You can add up to ${MAX_CONTACTS} contacts.` });
        }
        if (hasDuplicateContact(config, emailHash, phoneHash)) {
            return res.status(409).json({ message: "This contact is already in My Comfort Zone." });
        }

        const emailVerified = await consumeVerificationToken({
            userId: req.userId,
            channel: "email",
            target: email,
            token: emailVerificationToken,
        });
        const phoneVerified = await consumeVerificationToken({
            userId: req.userId,
            channel: "phone",
            target: phone,
            token: phoneVerificationToken,
        });

        if (!emailVerified || !phoneVerified) {
            return res.status(400).json({ message: "Verify both email and phone before saving this contact." });
        }

        const consentToken = createSecureToken(32);
        const now = new Date();
        config.enabled = true;
        if (!config.consentGivenAt) config.consentGivenAt = now;
        config.trustedContacts.push({
            userId: req.userId,
            nameEncrypted: encrypt(name),
            emailEncrypted: encrypt(email),
            emailHash,
            phoneEncrypted: encrypt(phone),
            phoneHash,
            isEmailVerified: true,
            isPhoneVerified: true,
            isAccepted: false,
            consentTokenHash: consentTokenHash(consentToken),
            consentTokenExpiresAt: new Date(Date.now() + CONSENT_TOKEN_TTL_MS),
            acceptanceRequestedAt: now,
            addedAt: now,
        });

        await sendConsentMessages({ req, userId: req.userId, contactName: name, email, phone, token: consentToken });
        await config.save();

        logger.info("My Comfort Zone contact added pending acceptance", {
            userId: String(req.userId),
            email: maskEmail(email),
            phone: maskPhone(phone),
        });

        res.status(201).json({ message: "Contact verified and invitation sent for acceptance." });
    } catch (err) {
        logger.error("My Comfort Zone add contact error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to add contact." });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const config = await SafetyNetConfig.findOne({ userId: req.userId });
        if (!config) return res.status(404).json({ message: "My Comfort Zone is not configured." });

        const contact = config.trustedContacts.id(req.params.contactId);
        if (!contact) return res.status(404).json({ message: "Contact not found." });

        config.trustedContacts.pull(contact._id);
        await config.save();
        res.json({ message: "Contact removed." });
    } catch (err) {
        logger.error("My Comfort Zone delete contact error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to remove contact." });
    }
};

exports.showConsentPage = async (req, res) => {
    try {
        const token = req.params.token;
        const config = await SafetyNetConfig.findOne({ "trustedContacts.consentTokenHash": consentTokenHash(token) });
        const contact = config?.trustedContacts?.find((item) => item.consentTokenHash === consentTokenHash(token));

        if (!contact || (contact.consentTokenExpiresAt && contact.consentTokenExpiresAt < new Date())) {
            return res.status(410).send(buildConsentPage({ expired: true, token }));
        }

        if (contact.isAccepted) {
            return res.send(buildConsentPage({ accepted: true, token }));
        }

        res.send(buildConsentPage({ token }));
    } catch (err) {
        logger.error("Consent page error", { error: err.message });
        res.status(500).send("Unable to load invitation.");
    }
};

exports.acceptContact = async (req, res) => {
    try {
        const token = req.params.token;
        const tokenHash = consentTokenHash(token);
        const config = await SafetyNetConfig.findOne({ "trustedContacts.consentTokenHash": tokenHash });
        const contact = config?.trustedContacts?.find((item) => item.consentTokenHash === tokenHash);

        if (!contact || (contact.consentTokenExpiresAt && contact.consentTokenExpiresAt < new Date())) {
            return res.status(410).send(buildConsentPage({ expired: true, token }));
        }

        contact.isAccepted = true;
        contact.acceptedAt = new Date();
        contact.consentTokenHash = undefined;
        contact.consentTokenExpiresAt = undefined;
        await config.save();

        logger.info("My Comfort Zone contact accepted", { userId: String(config.userId) });
        res.send(buildConsentPage({ accepted: true, token }));
    } catch (err) {
        logger.error("Consent accept error", { error: err.message });
        res.status(500).send("Unable to accept invitation.");
    }
};

exports.getStatus = async (req, res) => {
    try {
        const config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config || !config.enabled) {
            return res.json({
                status: "disabled",
                lastAnalysis: null,
                lastAlert: null,
                currentRisk: null,
                contactCount: 0,
                activeContactCount: 0,
            });
        }

        const wasPaused = config.isPaused;
        config.checkPauseExpiry();
        if (wasPaused !== config.isPaused) await config.save();

        const latestAssessment = await RiskAssessment.findOne({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();
        const lastAlert = await AlertLog.findOne({ userId: req.userId })
            .sort({ triggeredAt: -1 })
            .lean();

        res.json({
            status: config.isPaused ? "paused" : "active",
            pausedUntil: config.isPaused ? config.pausedUntil : null,
            lastAnalysis: config.lastAnalysisAt,
            currentRisk: latestAssessment ? {
                level: latestAssessment.riskLevel,
                score: latestAssessment.riskScore,
                assessedAt: latestAssessment.createdAt,
            } : null,
            lastAlert: lastAlert ? {
                sentAt: lastAlert.triggeredAt,
                deliveryStatus: lastAlert.deliveryStatus,
                riskLevel: lastAlert.riskLevel,
            } : null,
            contactCount: config.trustedContacts.length,
            activeContactCount: activeContacts(config).length,
        });
    } catch (err) {
        logger.error("My Comfort Zone getStatus error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to load status." });
    }
};

exports.pauseAlerts = async (req, res) => {
    try {
        const { days } = req.body;
        const config = await SafetyNetConfig.findOne({ userId: req.userId });
        if (!config) return res.status(404).json({ message: "My Comfort Zone is not configured." });

        if (days !== null && days !== undefined && (!Number.isInteger(days) || days < 1 || days > 30)) {
            return res.status(400).json({ message: "Pause duration must be between 1 and 30 days." });
        }

        config.isPaused = true;
        config.pausedAt = new Date();
        config.pausedUntil = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : undefined;
        await config.save();

        logger.info("My Comfort Zone alerts paused", { userId: String(req.userId), days: days || "indefinite" });
        res.json({ message: days ? `Alerts paused for ${days} days` : "Alerts paused indefinitely" });
    } catch (err) {
        logger.error("My Comfort Zone pauseAlerts error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to pause alerts." });
    }
};

exports.resumeAlerts = async (req, res) => {
    try {
        const config = await SafetyNetConfig.findOne({ userId: req.userId });
        if (!config) return res.status(404).json({ message: "My Comfort Zone is not configured." });

        config.isPaused = false;
        config.pausedAt = undefined;
        config.pausedUntil = undefined;
        await config.save();

        logger.info("My Comfort Zone alerts resumed", { userId: String(req.userId) });
        res.json({ message: "Alerts resumed" });
    } catch (err) {
        logger.error("My Comfort Zone resumeAlerts error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to resume alerts." });
    }
};

exports.getAuditLog = async (req, res) => {
    try {
        const logs = await AlertLog.find({ userId: req.userId })
            .sort({ triggeredAt: -1 })
            .limit(20)
            .lean();

        res.json(logs.map(log => ({
            id: log._id,
            riskLevel: log.riskLevel,
            riskScore: log.riskScore,
            recipientCount: log.recipientCount,
            deliveryStatus: log.deliveryStatus,
            triggeredAt: log.triggeredAt,
        })));
    } catch (err) {
        logger.error("My Comfort Zone getAuditLog error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to load audit log." });
    }
};

exports.setupDuringSignup = async (req, res) => {
    try {
        const config = await findOrCreateConfig(req.userId, true);
        config.enabled = true;
        if (!config.consentGivenAt) config.consentGivenAt = new Date();
        await config.save();

        res.status(201).json({
            message: "My Comfort Zone enabled. Add verified contacts after setup.",
            contactCount: config.trustedContacts.length,
        });
    } catch (err) {
        logger.error("My Comfort Zone signup setup error", { userId: String(req.userId), error: err.message });
        res.status(500).json({ message: "Failed to set up My Comfort Zone." });
    }
};
