const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const comfortZone = require("../controllers/safetynet.controller");
const { contactOtpLimiter } = require("../middleware/rateLimit.middleware");

// Public consent links, protected by high-entropy one-time tokens.
router.get("/contacts/consent/:token", comfortZone.showConsentPage);
router.post("/contacts/consent/:token/accept", comfortZone.acceptContact);

// Owner routes.
router.get("/config", auth, comfortZone.getConfig);
router.put("/config", auth, comfortZone.updateConfig);
router.post("/contacts/otp/email", auth, contactOtpLimiter, comfortZone.requestEmailOtp);
router.post("/contacts/otp/phone", auth, contactOtpLimiter, comfortZone.requestPhoneOtp);
router.post("/contacts/verify/email", auth, contactOtpLimiter, comfortZone.verifyEmailOtp);
router.post("/contacts/verify/phone", auth, contactOtpLimiter, comfortZone.verifyPhoneOtp);
router.post("/contacts", auth, comfortZone.addVerifiedContact);
router.delete("/contacts/:contactId", auth, comfortZone.deleteContact);
router.get("/status", auth, comfortZone.getStatus);
router.post("/pause", auth, comfortZone.pauseAlerts);
router.post("/resume", auth, comfortZone.resumeAlerts);
router.get("/audit-log", auth, comfortZone.getAuditLog);
router.post("/setup", auth, comfortZone.setupDuringSignup);

module.exports = router;
