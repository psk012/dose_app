require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const logger = require("./logger");
const connectDB = require("./config/db");
const { apiLimiter, aiLimiter } = require("./middleware/rateLimit.middleware");
const auth = require("./middleware/auth.middleware");

// Routes
const authRoutes = require("./routes/auth.routes");
const journalRoutes = require("./routes/journal.routes");
const focusRoutes = require("./routes/focus.routes");
const insightsRoutes = require("./routes/insights.routes");
const promptRoutes = require("./routes/prompt.routes");
const reflectionRoutes = require("./routes/reflection.routes");
const safetynetRoutes = require("./routes/safetynet.routes");

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

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
    process.exit(1);
}

// Connect to Database
connectDB();

// ─── HTTPS ENFORCEMENT ────────────────────────────────
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect("https://" + req.hostname + req.url);
        }
    }
    next();
});

// Middleware
app.use(morgan("combined", { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(mongoSanitize());

// General API rate limiter for all /api endpoints
app.use("/api", apiLimiter);

// ─── TEST ROUTE ─────────────────────────────────────────
app.get("/", (req, res) => {
    res.send("DOSE Backend Running 🚀");
});

// ─── HEALTH CHECK (diagnose SMTP on production) ──────
app.get("/api/health", async (req, res) => {
    const nodemailer = require("nodemailer");
    const health = {
        server: "ok",
        timestamp: new Date().toISOString(),
        smtp: { status: "unknown" },
        env: {
            EMAIL_USER: process.env.EMAIL_USER ? `set` : "MISSING",
        }
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Test port 465 (SMTPS) because Render often blocks 587
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                connectionTimeout: 8000,
            });
            const start = Date.now();
            await transporter.verify();
            transporter.close();
            health.smtp = { status: "connected_on_465", latency: `${Date.now() - start}ms` };
        } catch (err465) {
            health.smtp = { status: "FAILED_465", error: err465.message };
        }
    } else {
        health.smtp = { status: "FAILED", error: "SMTP credentials not configured" };
    }

    const httpStatus = health.smtp.status === "connected_on_465" ? 200 : 503;
    res.status(httpStatus).json(health);
});

// ─── AI GENERATION (PLACEHOLDER) ─────────────────────
app.post("/api/generate", auth, aiLimiter, async (req, res) => {
    // Placeholder for AI feature (e.g., using OpenAI or Gemini)
    res.status(501).json({ message: "AI generation is not yet implemented." });
});

// ─── MODULAR ROUTES ────────────────────────────────────
app.use("/api", authRoutes); 
app.use("/api/journal", journalRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/reflections", reflectionRoutes);
app.use("/api/safetynet", safetynetRoutes);

// ─── START SERVER ────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});