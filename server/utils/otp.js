const crypto = require("crypto");

function getOtpSecret() {
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("OTP_SECRET or JWT_SECRET must be configured");
    }
    return secret;
}

function generateNumericOtp(length = 6) {
    const min = 10 ** (length - 1);
    const max = 10 ** length;
    return crypto.randomInt(min, max).toString();
}

function hashValue(value, context = "default") {
    return crypto
        .createHmac("sha256", getOtpSecret())
        .update(`${context}:${value}`)
        .digest("hex");
}

function timingSafeEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function createSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("hex");
}

module.exports = {
    createSecureToken,
    generateNumericOtp,
    hashValue,
    timingSafeEqual,
};
