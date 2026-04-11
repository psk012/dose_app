const logger = require("../logger");
const { maskPhone } = require("./contactValidation");

async function sendSms(to, message) {
    const provider = process.env.SMS_PROVIDER || "mock";
    const maskedPhone = maskPhone(to);

    if (provider === "mock") {
        if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_SMS_IN_PRODUCTION !== "true") {
            throw new Error("SMS provider is not configured for production.");
        }

        logger.warn("Mock SMS provider used", {
            to: maskedPhone,
            message: process.env.NODE_ENV === "production" ? "[redacted]" : message,
        });
        return { provider: "mock", delivered: true };
    }

    throw new Error(`Unsupported SMS provider: ${provider}`);
}

module.exports = sendSms;
