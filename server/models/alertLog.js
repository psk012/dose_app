const mongoose = require("mongoose");

const alertLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        required: true,
    },
    riskScore: {
        type: Number,
        required: true,
    },
    alertType: {
        type: String,
        enum: ["email"],
        default: "email",
    },
    recipientCount: {
        type: Number, // Never stores who, just how many
        required: true,
    },
    deliveryStatus: {
        type: String,
        enum: ["sent", "failed", "partial"],
        required: true,
    },
    triggeredAt: {
        type: Date,
        default: Date.now,
    },
    cooldownExpiresAt: {
        type: Date,
        required: true,
    },
});

// Index for cooldown lookups
alertLogSchema.index({ userId: 1, triggeredAt: -1 });

module.exports = mongoose.model("AlertLog", alertLogSchema);
