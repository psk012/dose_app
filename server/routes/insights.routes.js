const express = require("express");
const router = express.Router();
const insightsController = require("../controllers/insights.controller");
const auth = require("../middleware/auth.middleware");

// Routes
router.post("/mood", auth, insightsController.logMood);
router.get("/dashboard", auth, insightsController.getInsights);

module.exports = router;
