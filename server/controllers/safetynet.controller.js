const SafetyNetConfig = require("../models/safetyNetConfig");
const RiskAssessment = require("../models/riskAssessment");
const AlertLog = require("../models/alertLog");
const { encrypt, decrypt } = require("../utils/encryption");
const validator = require("validator");
const logger = require("../logger");

// ─── GET CONFIG ──────────────────────────────────────
exports.getConfig = async (req, res) => {
    try {
        const config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config) {
            return res.json({
                enabled: false,
                trustedContacts: [],
                isPaused: false,
                consentGivenAt: null,
            });
        }

        // Decrypt contacts for display
        const decryptedContacts = config.trustedContacts.map(c => ({
            id: c._id,
            name: decrypt(c.nameEncrypted),
            email: decrypt(c.emailEncrypted),
            addedAt: c.addedAt,
        }));

        config.checkPauseExpiry();

        res.json({
            enabled: config.enabled,
            trustedContacts: decryptedContacts,
            isPaused: config.isPaused,
            pausedUntil: config.pausedUntil,
            consentGivenAt: config.consentGivenAt,
            lastAnalysisAt: config.lastAnalysisAt,
        });
    } catch (err) {
        logger.error("SafetyNet getConfig error", { error: err.message });
        res.status(500).json({ message: "Failed to load SafetyNet settings." });
    }
};

// ─── UPDATE CONFIG (Enable/Disable) ─────────────────
exports.updateConfig = async (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== "boolean") {
            return res.status(400).json({ message: "Invalid configuration" });
        }

        let config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config) {
            config = new SafetyNetConfig({
                userId: req.userId,
                enabled,
                consentGivenAt: enabled ? new Date() : undefined,
            });
        } else {
            config.enabled = enabled;
            if (enabled && !config.consentGivenAt) {
                config.consentGivenAt = new Date();
            }
        }

        // If disabling, also clean up risk assessments
        if (!enabled) {
            await RiskAssessment.deleteMany({ userId: req.userId });
            config.isPaused = false;
            config.pausedAt = undefined;
            config.pausedUntil = undefined;
            config.lastAnalysisAt = undefined;
        }

        await config.save();

        logger.info("SafetyNet config updated", { userId: String(req.userId), enabled });
        res.json({ message: enabled ? "SafetyNet enabled" : "SafetyNet disabled", enabled });
    } catch (err) {
        logger.error("SafetyNet updateConfig error", { error: err.message });
        res.status(500).json({ message: "Failed to update SafetyNet settings." });
    }
};

// ─── UPDATE CONTACTS ────────────────────────────────
exports.updateContacts = async (req, res) => {
    try {
        const { contacts } = req.body;

        if (!Array.isArray(contacts) || contacts.length > 2) {
            return res.status(400).json({ message: "Provide 1-2 contacts" });
        }

        // Validate each contact
        for (const contact of contacts) {
            if (!contact.name || typeof contact.name !== "string" || contact.name.trim().length < 1) {
                return res.status(400).json({ message: "Each contact must have a valid name" });
            }
            if (!contact.email || !validator.isEmail(contact.email)) {
                return res.status(400).json({ message: `Invalid email: ${contact.email}` });
            }
        }

        let config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config) {
            config = new SafetyNetConfig({
                userId: req.userId,
                enabled: true,
                consentGivenAt: new Date(),
            });
        }

        // Encrypt and store contacts
        config.trustedContacts = contacts.map(c => ({
            nameEncrypted: encrypt(c.name.trim()),
            emailEncrypted: encrypt(c.email.trim().toLowerCase()),
            addedAt: new Date(),
        }));

        await config.save();

        res.json({
            message: "Contacts updated",
            contactCount: contacts.length,
        });
    } catch (err) {
        logger.error("SafetyNet updateContacts error", { error: err.message });
        res.status(500).json({ message: "Failed to update contacts." });
    }
};

// ─── GET STATUS ─────────────────────────────────────
exports.getStatus = async (req, res) => {
    try {
        const config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config || !config.enabled) {
            return res.json({
                status: "disabled",
                lastAnalysis: null,
                lastAlert: null,
                currentRisk: null,
            });
        }

        config.checkPauseExpiry();

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
        });
    } catch (err) {
        logger.error("SafetyNet getStatus error", { error: err.message });
        res.status(500).json({ message: "Failed to load status." });
    }
};

// ─── PAUSE ALERTS ───────────────────────────────────
exports.pauseAlerts = async (req, res) => {
    try {
        const { days } = req.body; // null = indefinite
        const config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config) {
            return res.status(404).json({ message: "SafetyNet not configured" });
        }

        config.isPaused = true;
        config.pausedAt = new Date();
        config.pausedUntil = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : undefined;
        await config.save();

        logger.info("SafetyNet paused", { userId: String(req.userId), days: days || "indefinite" });
        res.json({ message: days ? `Alerts paused for ${days} days` : "Alerts paused indefinitely" });
    } catch (err) {
        logger.error("SafetyNet pauseAlerts error", { error: err.message });
        res.status(500).json({ message: "Failed to pause alerts." });
    }
};

// ─── RESUME ALERTS ──────────────────────────────────
exports.resumeAlerts = async (req, res) => {
    try {
        const config = await SafetyNetConfig.findOne({ userId: req.userId });

        if (!config) {
            return res.status(404).json({ message: "SafetyNet not configured" });
        }

        config.isPaused = false;
        config.pausedAt = undefined;
        config.pausedUntil = undefined;
        await config.save();

        logger.info("SafetyNet resumed", { userId: String(req.userId) });
        res.json({ message: "Alerts resumed" });
    } catch (err) {
        logger.error("SafetyNet resumeAlerts error", { error: err.message });
        res.status(500).json({ message: "Failed to resume alerts." });
    }
};

// ─── AUDIT LOG ──────────────────────────────────────
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
        logger.error("SafetyNet getAuditLog error", { error: err.message });
        res.status(500).json({ message: "Failed to load audit log." });
    }
};

// ─── SETUP DURING SIGNUP ────────────────────────────
exports.setupDuringSignup = async (req, res) => {
    try {
        const { contacts } = req.body;
        const userId = req.userId; // From JWT auth middleware

        if (!userId || !Array.isArray(contacts) || contacts.length === 0 || contacts.length > 2) {
            return res.status(400).json({ message: "Provide 1-2 contacts" });
        }

        // Validate each contact
        for (const contact of contacts) {
            if (!contact.name || typeof contact.name !== "string" || contact.name.trim().length < 1) {
                return res.status(400).json({ message: "Each contact must have a valid name" });
            }
            if (!contact.email || !validator.isEmail(contact.email)) {
                return res.status(400).json({ message: `Invalid email: ${contact.email}` });
            }
        }

        const config = new SafetyNetConfig({
            userId,
            enabled: true,
            consentGivenAt: new Date(),
            trustedContacts: contacts.map(c => ({
                nameEncrypted: encrypt(c.name.trim()),
                emailEncrypted: encrypt(c.email.trim().toLowerCase()),
                addedAt: new Date(),
            })),
        });

        await config.save();

        res.status(201).json({ message: "SafetyNet configured", contactCount: contacts.length });
    } catch (err) {
        logger.error("SafetyNet signup setup error", { error: err.message });
        res.status(500).json({ message: "Failed to set up SafetyNet." });
    }
};
