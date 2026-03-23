require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const helmet = require("helmet");
const validator = require("validator");
const morgan = require("morgan");

const nodemailer = require("nodemailer");
const logger = require("./logger");

// Custom Mongo Sanitize to handle Express 5 req.query getter crash
const mongoSanitize = () => (req, res, next) => {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
        for (const key of Object.keys(obj)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        }
    };
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    next();
};
const User = require("./models/user");
const Journal = require("./models/journal");

// Mock Email Service
let transporter;
nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
    });
}).catch(console.error);

async function sendEmail(to, subject, html) {
    if (!transporter) return;
    const info = await transporter.sendMail({
        from: '"The Living Journal" <noreply@livingjournal.com>',
        to, subject, html
    });
    console.log(`Preview URL: %s`, nodemailer.getTestMessageUrl(info));
}

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res, next, options) => {
        logger.warn(`Auth rate limit exceeded by IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    },
    message: { message: "Too many login attempts from this IP, please try again after 15 minutes." },
    standardHeaders: false,
    legacyHeaders: false
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    handler: (req, res, next, options) => {
        logger.warn(`Account creation limit exceeded by IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    },
    message: { message: "Too many accounts created from this IP, please try again after an hour." },
    standardHeaders: false,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    handler: (req, res, next, options) => {
        logger.warn(`Global API rate limit exceeded by IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    },
    message: { message: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: false,
    legacyHeaders: false
});

const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    handler: (req, res, next, options) => {
        logger.warn(`AI generation quota exceeded by IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    },
    message: { message: "AI generation quota exceeded. Please try again later." },
    standardHeaders: false,
    legacyHeaders: false
});
const FocusSession = require("./models/focusSession");
const Task = require("./models/task");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/doseDB";

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// ─── HTTPS ENFORCEMENT ────────────────────────────────
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect("https://" + req.hostname + req.url);
        }
    }
    next();
});

// ─── LOGGING MIDDLEWARE ───────────────────────────────
app.use(morgan("combined", { stream: { write: message => logger.info(message.trim()) } }));

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(mongoSanitize());

// General API rate limiter for all /api endpoints
app.use("/api", apiLimiter);

// MongoDB connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

// ─── AUTH MIDDLEWARE ──────────────────────────────────

function auth(req, res, next) {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}

// (Removed custom isValidEmail in favor of validator.isEmail)

// ─── TEST ROUTE ──────────────────────────────────────

app.get("/", (req, res) => {
    res.send("DOSE Backend Running 🚀");
});

// ─── SIGNUP ──────────────────────────────────────────

app.post("/api/signup", signupLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ Input validation
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // ✅ Check for duplicate user
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

        const user = new User({ 
            email, 
            password: hashedPassword,
            verificationToken,
            verificationTokenExpires
        });
        await user.save();

        const verifyUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
        await sendEmail(email, "Verify Your Email", `<p>Please click this link to verify your account: <a href="${verifyUrl}">${verifyUrl}</a></p>`);

        logger.info(`New account created: ${email} from IP: ${req.ip}`);
        res.status(201).json({ message: "Account created. Please check your system console for the simulated email verification link." });
    } catch (err) {
        logger.error(`Signup error: ${err.message}`, { error: err });
        console.error("Signup error:", err);
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
});

// ─── VERIFY EMAIL ────────────────────────────────────

app.get("/api/verify-email", async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: "Token missing" });

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.json({ message: "Email successfully verified! You can now log in." });
    } catch (err) {
        console.error("Verification error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─── LOGIN ───────────────────────────────────────────

app.post("/api/login", authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ Input validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            logger.warn(`Failed login attempt: Account not found for ${email} from IP: ${req.ip}`);
            return res.status(400).json({ message: "No account found with this email" });
        }

        if (!user.isVerified) {
            logger.warn(`Failed login attempt: Unverified email for ${email} from IP: ${req.ip}`);
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn(`Failed login attempt: Incorrect password for ${email} from IP: ${req.ip}`);
            return res.status(400).json({ message: "Incorrect password" });
        }

        logger.info(`Successful login for user: ${email} from IP: ${req.ip}`);
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ token });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
});

// ─── FORGOT & RESET PASSWORD ─────────────────────────

app.post("/api/forgot-password", authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (typeof email !== "string" || !validator.isEmail(email)) {
            return res.status(400).json({ message: "Valid email required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ message: "No account found" });

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
        await sendEmail(user.email, "Password Reset Request", `<p>You requested a password reset. Click here to reset it: <a href="${resetUrl}">${resetUrl}</a></p>`);

        res.json({ message: "Reset link generated. Check system console for details." });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/reset-password", authLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (typeof token !== "string" || typeof newPassword !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }
        if (!token || !newPassword) return res.status(400).json({ message: "Token and new password required" });
        if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password has been successfully reset" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ─── JOURNAL (PROTECTED) ────────────────────────────

app.post("/api/journal", auth, async (req, res) => {
    try {
        const { text } = req.body;

        // ✅ Input validation
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
});

app.get("/api/journal", auth, async (req, res) => {
    try {
        const entries = await Journal.find({ userId: req.userId }).sort({ createdAt: -1 });

        res.json(entries.map((e) => e.text));
    } catch (err) {
        console.error("Journal fetch error:", err);
        res.status(500).json({ message: "Failed to load entries. Please try again." });
    }
});

// ─── FOCUS SESSIONS (PROTECTED) ─────────────────────

app.post("/api/focus", auth, async (req, res) => {
    try {
        let { workMinutes = 25, breakMinutes = 5 } = req.body;
        workMinutes = parseInt(workMinutes, 10);
        breakMinutes = parseInt(breakMinutes, 10);

        if (isNaN(workMinutes) || isNaN(breakMinutes) || workMinutes < 1 || workMinutes > 240 || breakMinutes < 1 || breakMinutes > 60) {
            return res.status(400).json({ message: "Invalid session duration" });
        }

        const session = new FocusSession({
            userId: req.userId,
            workMinutes,
            breakMinutes,
        });

        await session.save();

        res.status(201).json({ message: "Focus session logged" });
    } catch (err) {
        console.error("Focus log error:", err);
        res.status(500).json({ message: "Failed to log focus session" });
    }
});

app.get("/api/focus/stats", auth, async (req, res) => {
    try {
        const total = await FocusSession.countDocuments({ userId: req.userId });

        // Today's sessions
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayCount = await FocusSession.countDocuments({
            userId: req.userId,
            completedAt: { $gte: todayStart },
        });

        // Total focus minutes
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
});

// ─── TASKS (PROTECTED) ──────────────────────────────

app.post("/api/tasks", auth, async (req, res) => {
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
});

app.get("/api/tasks", auth, async (req, res) => {
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
});

app.patch("/api/tasks/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Task ID format" });
        }
        const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.completed = !task.completed;
        await task.save();

        res.json(task);
    } catch (err) {
        console.error("Task toggle error:", err);
        res.status(500).json({ message: "Failed to update task" });
    }
});

app.delete("/api/tasks/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Task ID format" });
        }
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error("Task delete error:", err);
        res.status(500).json({ message: "Failed to delete task" });
    }
});

app.get("/api/tasks/wrapped", auth, async (req, res) => {
    try {
        // Get all tasks for this user, grouped by date
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
            return res.json({
                totalDays: 0,
                bestDay: null,
                worstDay: null,
                averageWinPercent: 0,
            });
        }

        // Calculate win % for each day
        const days = dailyStats.map((d) => ({
            date: d._id,
            total: d.total,
            completed: d.completed,
            winPercent: Math.round((d.completed / d.total) * 100),
        }));

        // Find best and worst days
        const bestDay = days.reduce((a, b) => (a.winPercent >= b.winPercent ? a : b));
        const worstDay = days.reduce((a, b) => (a.winPercent <= b.winPercent ? a : b));

        // Average win %
        const averageWinPercent = Math.round(
            days.reduce((sum, d) => sum + d.winPercent, 0) / days.length
        );

        res.json({
            totalDays: days.length,
            bestDay,
            worstDay,
            averageWinPercent,
        });
    } catch (err) {
        console.error("Wrapped error:", err);
        res.status(500).json({ message: "Failed to generate wrapped stats" });
    }
});

// ─── AI GENERATION (PLACEHOLDER) ─────────────────────

app.post("/api/generate", auth, aiLimiter, async (req, res) => {
    // Placeholder for AI feature (e.g., using OpenAI or Gemini)
    res.status(501).json({ message: "AI generation is not yet implemented." });
});

// ─── START SERVER ────────────────────────────────────

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});