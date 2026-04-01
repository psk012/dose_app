const Reflection = require("../models/reflection");
const logger = require("../logger");

/**
 * Save user reflection response.
 */
exports.saveReflection = async (req, res) => {
    try {
        const { prompt, response, mood, location, date } = req.body;
        const userId = req.user ? req.user.id : req.userId;

        if (!prompt || !response || !mood || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newReflection = new Reflection({
            userId,
            prompt,
            response,
            mood,
            location,
            date,
        });

        await newReflection.save();
        res.status(201).json({ message: "Reflection saved successfully", reflection: newReflection });
    } catch (error) {
        logger.error(`Error saving reflection: ${error.message}`);
        res.status(500).json({ message: "Failed to save reflection" });
    }
};

/**
 * Fetch reflections for a specific user on a specific date (YYYY-MM-DD).
 */
exports.getReflectionsByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user ? req.user.id : req.userId;

        const reflections = await Reflection.find({ userId, date })
            .sort({ createdAt: -1 });

        res.status(200).json(reflections);
    } catch (error) {
        logger.error(`Error fetching reflections: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch reflections" });
    }
};

/**
 * Fetch all reflection dates that have content for a user (for calendar dots).
 */
exports.getActivityDates = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;
        const dates = await Reflection.distinct("date", { userId });
        res.status(200).json(dates);
    } catch (error) {
        logger.error(`Error fetching activity dates: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch activity dates" });
    }
};

/**
 * Delete a specific reflection.
 */
exports.deleteReflection = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : req.userId;

        const reflection = await Reflection.findOne({ _id: id, userId });
        if (!reflection) {
            return res.status(404).json({ message: "Reflection not found" });
        }

        await Reflection.deleteOne({ _id: id });
        res.status(200).json({ message: "Reflection deleted successfully" });
    } catch (error) {
        logger.error(`Error deleting reflection: ${error.message}`);
        res.status(500).json({ message: "Failed to delete reflection" });
    }
};
