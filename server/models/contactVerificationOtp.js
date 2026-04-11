const mongoose = require("mongoose");

const contactVerificationOtpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    channel: {
        type: String,
        enum: ["email", "phone"],
        required: true,
    },
    targetHash: {
        type: String,
        required: true,
        index: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5,
    },
    verifiedAt: {
        type: Date,
    },
    verificationTokenHash: {
        type: String,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
}, { timestamps: true });

contactVerificationOtpSchema.index({ userId: 1, channel: 1, targetHash: 1 });

module.exports = mongoose.model("ContactVerificationOtp", contactVerificationOtpSchema);
