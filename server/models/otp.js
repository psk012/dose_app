const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
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
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '5m', // Automatically delete document after 5 minutes
    }
});

module.exports = mongoose.model("Otp", otpSchema);
