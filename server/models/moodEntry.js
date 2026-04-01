const mongoose = require("mongoose");

const moodEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    state: {
        type: String,
        enum: ["calm", "heavy", "anxious", "overwhelmed", "numb"],
        required: true,
    },
    // The underlying derived biochemical states
    dopamine: { type: Number, default: 50 },
    oxytocin: { type: Number, default: 50 },
    serotonin: { type: Number, default: 50 },
    endorphin: { type: Number, default: 50 },
    cortisol: { type: Number, default: 50 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to calculate biochemical levels before saving based on simplified emotional state
moodEntrySchema.pre("save", function(next) {
    if (this.isModified("state")) {
        // Reset to baseline
        this.dopamine = 50;
        this.oxytocin = 50;
        this.serotonin = 50;
        this.endorphin = 50;
        this.cortisol = 50;

        switch(this.state) {
            case "calm":
                this.oxytocin += 20;
                this.serotonin += 10;
                this.cortisol -= 20;
                break;
            case "heavy":
                this.serotonin -= 20;
                this.dopamine -= 10;
                this.cortisol += 10;
                break;
            case "anxious":
                this.cortisol += 30;
                this.dopamine += 10; // antsy energy
                this.oxytocin -= 15;
                break;
            case "overwhelmed":
                this.cortisol += 40;
                this.serotonin -= 20;
                this.endorphin -= 10;
                break;
            case "numb":
                this.dopamine -= 30;
                this.serotonin -= 30;
                this.oxytocin -= 30;
                this.endorphin -= 30;
                break;
        }

        // Clamp values between 0 and 100
        ["dopamine", "oxytocin", "serotonin", "endorphin", "cortisol"].forEach(hormone => {
            this[hormone] = Math.max(0, Math.min(100, this[hormone]));
        });
    }
    next();
});

module.exports = mongoose.model("MoodEntry", moodEntrySchema);
