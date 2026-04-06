const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const safetynet = require("../controllers/safetynet.controller");

// All routes require authentication
router.get("/config", auth, safetynet.getConfig);
router.put("/config", auth, safetynet.updateConfig);
router.put("/contacts", auth, safetynet.updateContacts);
router.get("/status", auth, safetynet.getStatus);
router.post("/pause", auth, safetynet.pauseAlerts);
router.post("/resume", auth, safetynet.resumeAlerts);
router.get("/audit-log", auth, safetynet.getAuditLog);

// Signup setup — uses signupToken auth in controller, not JWT
router.post("/setup", auth, safetynet.setupDuringSignup);

module.exports = router;
