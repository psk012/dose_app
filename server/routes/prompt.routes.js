const express = require("express");
const router = express.Router();
const promptController = require("../controllers/prompt.controller");
const auth = require("../middleware/auth.middleware");

router.post("/generate", auth, promptController.generatePrompt);
router.post("/bulk", auth, promptController.generateBulkPrompts);
router.post("/reflections", auth, promptController.generateReflections);

module.exports = router;
