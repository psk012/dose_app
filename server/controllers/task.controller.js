const Task = require("../models/task");
const mongoose = require("mongoose");
const validator = require("validator");

exports.createTask = async (req, res) => {
    try {
        const { text, date } = req.body;
        if (!text || typeof text !== "string" || text.trim() === "") {
            return res.status(400).json({ message: "Task text must be a valid string" });
        }
        if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: "Valid date (YYYY-MM-DD) is required" });
        }
        const task = new Task({
            userId: req.userId,
            text: validator.escape(text.trim()),
            date,
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        console.error("Task create error:", err);
        res.status(500).json({ message: "Failed to create task" });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: "Valid date (YYYY-MM-DD) query param required" });
        }
        const tasks = await Task.find({ userId: req.userId, date }).sort({ createdAt: 1 });
        res.json(tasks);
    } catch (err) {
        console.error("Task fetch error:", err);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
};

exports.toggleTask = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Task ID format" });
        }
        const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.completed = !task.completed;
        await task.save();
        res.json(task);
    } catch (err) {
        console.error("Task toggle error:", err);
        res.status(500).json({ message: "Failed to update task" });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Task ID format" });
        }
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!task) return res.status(404).json({ message: "Task not found" });
        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error("Task delete error:", err);
        res.status(500).json({ message: "Failed to delete task" });
    }
};

exports.getWrapped = async (req, res) => {
    try {
        const dailyStats = await Task.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            {
                $group: {
                    _id: "$date",
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: ["$completed", 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        if (dailyStats.length === 0) {
            return res.json({ totalDays: 0, bestDay: null, worstDay: null, averageWinPercent: 0 });
        }

        const days = dailyStats.map((d) => ({
            date: d._id,
            total: d.total,
            completed: d.completed,
            winPercent: Math.round((d.completed / d.total) * 100),
        }));

        const bestDay = days.reduce((a, b) => (a.winPercent >= b.winPercent ? a : b));
        const worstDay = days.reduce((a, b) => (a.winPercent <= b.winPercent ? a : b));
        const averageWinPercent = Math.round(days.reduce((sum, d) => sum + d.winPercent, 0) / days.length);

        res.json({ totalDays: days.length, bestDay, worstDay, averageWinPercent });
    } catch (err) {
        console.error("Wrapped error:", err);
        res.status(500).json({ message: "Failed to generate wrapped stats" });
    }
};
