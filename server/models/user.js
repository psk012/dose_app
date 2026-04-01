const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    lastJournalDate: { type: Date },
    currentJournalStreak: { type: Number, default: 0 },
    highestJournalStreak: { type: Number, default: 0 },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);