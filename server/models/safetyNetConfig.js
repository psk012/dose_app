const mongoose = require("mongoose");

const trustedContactSchema = new mongoose.Schema({
    emailEncrypted: {
        type: String,
        required: true,
    },
    nameEncrypted: {
        type: String,
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });

const safetyNetConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    enabled: {
        type: Boolean,
        default: false,
    },
    consentGivenAt: {
        type: Date,
    },
    consentVersion: {
        type: String,
        default: "1.0",
    },
    trustedContacts: {
        type: [trustedContactSchema],
        validate: {
            validator: function (contacts) {
                return contacts.length <= 2;
            },
            message: "Maximum 2 trusted contacts allowed",
        },
    },
    isPaused: {
        type: Boolean,
        default: false,
    },
    pausedAt: {
        type: Date,
    },
    pausedUntil: {
        type: Date,
    },
    lastAnalysisAt: {
        type: Date,
    },
    analysisFrequencyHours: {
        type: Number,
        default: 168, // 7 days
        min: 24,
    },
}, { timestamps: true });

// Auto-resume from pause if pausedUntil has passed
safetyNetConfigSchema.methods.checkPauseExpiry = function () {
    if (this.isPaused && this.pausedUntil && new Date() > this.pausedUntil) {
        this.isPaused = false;
        this.pausedAt = undefined;
        this.pausedUntil = undefined;
    }
    return this;
};

module.exports = mongoose.model("SafetyNetConfig", safetyNetConfigSchema);
