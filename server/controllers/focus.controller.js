const FocusSession = require("../models/focusSession");
const mongoose = require("mongoose");

exports.logSession = async (req, res) => {
    try {
        let { workMinutes = 25, breakMinutes = 5 } = req.body;
        workMinutes = parseInt(workMinutes, 10);
        breakMinutes = parseInt(breakMinutes, 10);

        if (isNaN(workMinutes) || isNaN(breakMinutes) || workMinutes < 1 || workMinutes > 240 || breakMinutes < 1 || breakMinutes > 60) {
            return res.status(400).json({ message: "Invalid session duration" });
        }
        const session = new FocusSession({ userId: req.userId, workMinutes, breakMinutes });
        await session.save();
        res.status(201).json({ message: "Focus session logged" });
    } catch (err) {
        console.error("Focus log error:", err);
        res.status(500).json({ message: "Failed to log focus session" });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await FocusSession.countDocuments({ userId: req.userId });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayCount = await FocusSession.countDocuments({
            userId: req.userId,
            completedAt: { $gte: todayStart },
        });

        const totalMinutes = await FocusSession.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            { $group: { _id: null, total: { $sum: "$workMinutes" } } },
        ]);

        res.json({
            totalSessions: total,
            todaySessions: todayCount,
            totalMinutes: totalMinutes[0]?.total || 0,
        });
    } catch (err) {
        console.error("Focus stats error:", err);
        res.status(500).json({ message: "Failed to fetch focus stats" });
    }
};
