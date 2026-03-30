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
const taskRoutes = require("./routes/task.routes");

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

// ─── AI GENERATION (PLACEHOLDER) ─────────────────────
app.post("/api/generate", auth, aiLimiter, async (req, res) => {
    // Placeholder for AI feature (e.g., using OpenAI or Gemini)
    res.status(501).json({ message: "AI generation is not yet implemented." });
});

// ─── MODULAR ROUTES ────────────────────────────────────
app.use("/api", authRoutes); 
app.use("/api/journal", journalRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/tasks", taskRoutes);

// ─── START SERVER ────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});