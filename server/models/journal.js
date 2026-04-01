const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, "Journal text is required"],
        trim: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    }
});

module.exports = mongoose.model("Journal", journalSchema);