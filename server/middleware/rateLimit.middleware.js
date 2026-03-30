const rateLimit = require("express-rate-limit");
const logger = require("../logger");

// Bypass rate limiting for localhost during testing
const skipLocalhost = (req) => {
    return req.ip === "127.0.0.1" || req.ip === "::1" || req.ip === "::ffff:127.0.0.1";
};

const authLimiter = rateLimit({
    skip: skipLocalhost,
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
    skip: skipLocalhost,
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
    skip: skipLocalhost,
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
    skip: skipLocalhost,
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

module.exports = {
    authLimiter,
    signupLimiter,
    apiLimiter,
    aiLimiter
};
