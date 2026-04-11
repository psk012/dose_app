require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const logger = require("./logger");
const connectDB = require("./config/db");
const { apiLimiter, aiLimiter } = require("./middleware/rateLimit.middleware");
const auth = require("./middleware/auth.middleware");

const authRoutes = require("./routes/auth.routes");
const journalRoutes = require("./routes/journal.routes");
const focusRoutes = require("./routes/focus.routes");
const insightsRoutes = require("./routes/insights.routes");
const promptRoutes = require("./routes/prompt.routes");
const reflectionRoutes = require("./routes/reflection.routes");
const safetynetRoutes = require("./routes/safetynet.routes");

const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
    process.exit(1);
}

if (!process.env.SAFETYNET_ENCRYPTION_KEY) {
    console.error("FATAL ERROR: SAFETYNET_ENCRYPTION_KEY environment variable is missing.");
    process.exit(1);
}

connectDB();

const mongoSanitize = () => (req, res, next) => {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
        for (const key of Object.keys(obj)) {
            if (key.startsWith("$") || key.includes(".")) {
                delete obj[key];
            } else if (typeof obj[key] === "object") {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    next();
};

app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
        return res.redirect(`https://${req.hostname}${req.url}`);
    }
    next();
});

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(morgan("combined", { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || process.env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
}));
app.use(express.json({ limit: "256kb" }));
app.use(helmet());
app.use(mongoSanitize());
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
    res.send("DOSE Backend Running");
});

app.get("/api/health", async (req, res) => {
    const health = {
        server: "ok",
        timestamp: new Date().toISOString(),
        emailProvider: process.env.RESEND_API_KEY ? "configured" : "missing",
        smsProvider: process.env.SMS_PROVIDER || "mock",
    };

    const httpStatus = process.env.RESEND_API_KEY ? 200 : 503;
    res.status(httpStatus).json(health);
});

app.post("/api/generate", auth, aiLimiter, async (req, res) => {
    res.status(501).json({ message: "AI generation is not yet implemented." });
});

app.use("/api", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/reflections", reflectionRoutes);
app.use("/api/comfort-zone", safetynetRoutes);
app.use("/api/safetynet", safetynetRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
