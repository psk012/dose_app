const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    response: {
        type: String,
        required: true,
    },
    mood: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        default: "",
    },
    date: {
        type: String, // Stored as YYYY-MM-DD for easy querying
        required: true,
    },
}, { timestamps: true });

// Index for faster date-based lookups
reflectionSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("Reflection", reflectionSchema);
