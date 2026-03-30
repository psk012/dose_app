const express = require("express");
const router = express.Router();
const focusController = require("../controllers/focus.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, focusController.logSession);
router.get("/stats", auth, focusController.getStats);

module.exports = router;
