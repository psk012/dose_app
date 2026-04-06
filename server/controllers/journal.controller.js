const Journal = require("../models/journal");
const User = require("../models/user");
const MoodEntry = require("../models/moodEntry");
const validator = require("validator");
const logger = require("../logger");
const { analyzeUserEmotionalPattern } = require("../services/safetynet.service");

exports.createEntry = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== "string" || text.trim() === "") {
            return res.status(400).json({ message: "Journal entry must be a valid string" });
        }
        
        const newEntry = new Journal({
            text: validator.escape(text.trim()),
            userId: req.user ? req.user.id : req.userId,
        });
        await newEntry.save();

        // Update streak logic
        const user = await User.findById(newEntry.userId);
        if (user) {
            const now = new Date();
            const lastDate = user.lastJournalDate;
            if (lastDate) {
                const diffTime = Math.abs(now - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) {
                    user.currentJournalStreak = (user.currentJournalStreak || 0) + 1;
                } else if (diffDays > 1) {
                    user.currentJournalStreak = 1;
                }
            } else {
                user.currentJournalStreak = 1;
            }
            user.highestJournalStreak = Math.max(user.highestJournalStreak || 0, user.currentJournalStreak);
            user.lastJournalDate = now;
            await user.save();
        }

        // Fire-and-forget SafetyNet analysis (non-blocking)
        analyzeUserEmotionalPattern(newEntry.userId).catch(err => {
            logger.error("SafetyNet analysis failed (non-blocking)", { error: err.message });
        });

        res.status(201).json({ message: "Entry saved", entry: newEntry });
    } catch (err) {
        console.error("Journal save error:", err);
        res.status(500).json({ message: "Failed to save entry. Please try again." });
    }
};

exports.getEntries = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;
        const entries = await Journal.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (err) {
        console.error("Journal fetch error:", err);
        res.status(500).json({ message: "Failed to load entries. Please try again." });
    }
};

exports.getDeletedEntries = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;
        const entries = await Journal.find({ userId, isDeleted: true }).sort({ deletedAt: -1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: "Failed to load recycle bin." });
    }
};

exports.softDeleteEntry = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;
        const entry = await Journal.findOneAndUpdate(
            { _id: req.params.id, userId },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!entry) return res.status(404).json({ message: "Entry not found" });
        res.json({ message: "Moved to recycle bin" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete entry." });
    }
};

exports.restoreEntry = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;
        const entry = await Journal.findOneAndUpdate(
            { _id: req.params.id, userId },
            { isDeleted: false, $unset: { deletedAt: 1 } },
            { new: true }
        );
        if (!entry) return res.status(404).json({ message: "Entry not found" });
        res.json({ message: "Entry restored" });
    } catch (err) {
        res.status(500).json({ message: "Failed to restore entry." });
    }
};

exports.permanentDeleteEntry = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;
        const entry = await Journal.findOneAndDelete({ _id: req.params.id, userId });
        if (!entry) return res.status(404).json({ message: "Entry not found" });
        
        // Hard delete associated mood data around the same time window (e.g. 5 minutes)
        if (entry.createdAt) {
            const start = new Date(new Date(entry.createdAt).getTime() - 5 * 60000);
            const end = new Date(new Date(entry.createdAt).getTime() + 5 * 60000);
            await MoodEntry.deleteMany({
                userId,
                createdAt: { $gte: start, $lte: end }
            });
        }
        
        res.json({ message: "Permanently deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to permanently delete entry." });
    }
};
