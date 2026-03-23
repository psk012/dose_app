const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    workMinutes: {
        type: Number,
        required: true,
        default: 25,
    },
    breakMinutes: {
        type: Number,
        required: true,
        default: 5,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("FocusSession", focusSessionSchema);
