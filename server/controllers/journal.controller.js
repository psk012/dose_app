const Journal = require("../models/journal");
const validator = require("validator");

exports.createEntry = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== "string" || text.trim() === "") {
            return res.status(400).json({ message: "Journal entry must be a valid string" });
        }
        const newEntry = new Journal({
            text: validator.escape(text.trim()),
            userId: req.userId,
        });
        await newEntry.save();
        res.status(201).json({ message: "Entry saved" });
    } catch (err) {
        console.error("Journal save error:", err);
        res.status(500).json({ message: "Failed to save entry. Please try again." });
    }
};

exports.getEntries = async (req, res) => {
    try {
        const entries = await Journal.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(entries.map((e) => e.text));
    } catch (err) {
        console.error("Journal fetch error:", err);
        res.status(500).json({ message: "Failed to load entries. Please try again." });
    }
};
