const MoodEntry = require("../models/moodEntry");
const logger = require("../logger");

exports.logMood = async (req, res) => {
    try {
        const { state } = req.body;
        if (!state) {
            return res.status(400).json({ message: "Mood state is required" });
        }

        const validStates = ["calm", "heavy", "anxious", "overwhelmed", "numb"];
        if (!validStates.includes(state)) {
            return res.status(400).json({ message: "Invalid mood state" });
        }

        const entry = new MoodEntry({
            userId: req.user ? req.user.id : req.userId,
            state: state
        });
        
        await entry.save();
        
        logger.info(`Mood logged for user ${req.user ? req.user.id : req.userId}: ${state}`);
        res.status(201).json({ message: "Mood logged successfully", entry });
    } catch (error) {
        logger.error(`Error logging mood: ${error.message}`);
        res.status(500).json({ message: "Failed to log mood" });
    }
};

exports.getInsights = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;
        
        // Fetch recent moods to aggregate insights
        const recentMoods = await MoodEntry.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30);
            
        // Calculate basic statistics for the dashboard
        let feelingSummary = "You haven't logged enough moods yet.";
        if (recentMoods.length > 0) {
            const counts = recentMoods.reduce((acc, mood) => {
                acc[mood.state] = (acc[mood.state] || 0) + 1;
                return acc;
            }, {});
            
            const mostFrequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
            feelingSummary = `Recently, you've been feeling mostly ${mostFrequent}.`;
        }
        
        const User = require("../models/user");
        const user = await User.findById(userId);

        res.status(200).json({
            summary: feelingSummary,
            totalLogs: recentMoods.length,
            streak: {
                current: user?.currentJournalStreak || 0,
                highest: user?.highestJournalStreak || 0
            }
        });
    } catch (error) {
        logger.error(`Error fetching insights: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch insights" });
    }
};
