const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authLimiter, signupLimiter } = require("../middleware/rateLimit.middleware");

router.post("/send-otp", signupLimiter, authController.sendOtp);
router.post("/verify-otp", signupLimiter, authController.verifyOtp);
router.post("/signup", signupLimiter, authController.signup);
router.post("/login", authLimiter, authController.login);
router.post("/forgot-password/send-otp", authLimiter, authController.sendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", authLimiter, authController.verifyForgotPasswordOtp);
router.post("/forgot-password/reset", authLimiter, authController.resetPasswordWithOtp);

module.exports = router;
