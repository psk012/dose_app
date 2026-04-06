const mongoose = require("mongoose");

const riskAssessmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    sentimentScore: {
        type: Number, // -1.0 to 1.0
        required: true,
    },
    riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        required: true,
    },
    riskScore: {
        type: Number, // 0–100 composite
        required: true,
        min: 0,
        max: 100,
    },
    patternFlags: {
        type: [String],
        default: [],
    },
    moodTrend: {
        dominantMood: { type: String },
        negativeDays: { type: Number, default: 0 },
        totalDaysAnalyzed: { type: Number, default: 0 },
    },
    source: {
        type: String,
        enum: ["ai", "local", "combined"],
        default: "combined",
    },
    confidence: {
        type: Number, // 0.0 to 1.0
        default: 0.5,
        min: 0,
        max: 1,
    },
    alertTriggered: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for efficient historical queries
riskAssessmentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("RiskAssessment", riskAssessmentSchema);
