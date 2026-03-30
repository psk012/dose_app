const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authLimiter, signupLimiter } = require("../middleware/rateLimit.middleware");

router.post("/send-otp", signupLimiter, authController.sendOtp);
router.post("/verify-otp", signupLimiter, authController.verifyOtp);
router.post("/signup", signupLimiter, authController.signup);
router.post("/login", authLimiter, authController.login);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

module.exports = router;
