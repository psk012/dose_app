const logger = require("../logger");
const { maskPhone } = require("./contactValidation");

const TWILIO_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 1_500;

// ─── Twilio error code → user-facing message ──────────────────────
const TWILIO_ERROR_MAP = {
    // Invalid destination
    21211: "Invalid phone number. Please check the number and try again.",
    21214: "Invalid phone number. Please check the number and try again.",
    21217: "Phone number is not valid for SMS delivery.",
    // Trial / verification restrictions
    21608: "Twilio trial accounts can only send to verified numbers. Verify this number at twilio.com/console.",
    21614: "This number cannot receive SMS (likely a landline or unsupported type).",
    // Geo permissions / region
    21408: "SMS delivery to this region is not enabled in your Twilio account. Enable it under Messaging > Geo Permissions.",
    21612: "This phone number is not reachable by SMS in its current region.",
    // Opt-out / filtering
    21610: "This number has opted out of receiving SMS. They must reply START to re-enable.",
    30004: "Message blocked by carrier filtering. This is common for Indian numbers without DLT registration.",
    30005: "Unknown destination number. The carrier cannot route to this number.",
    30006: "Landline or unreachable number. SMS cannot be delivered.",
    30007: "Message filtered by carrier. For Indian numbers, ensure Twilio DLT entity and template are registered.",
    30008: "Unknown error from carrier. The message may have been silently dropped.",
    // Account / auth
    20003: "Twilio authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
    20404: "Twilio resource not found. Check TWILIO_PHONE_NUMBER is a valid Twilio number.",
};

// Transient errors worth retrying
const RETRYABLE_CODES = new Set([20429, 30001, 30002, 30009, 30010, 52001]);

// Region-specific errors where fallback is appropriate
const REGION_BLOCKED_CODES = new Set([21408, 21608, 21612, 30004, 30007]);

let twilioClient = null;

function getTwilioClient() {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set.");
        }
        const twilio = require("twilio");
        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
}

// ─── Timeout wrapper ──────────────────────────────────────────────
function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`SMS request timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── Single Twilio attempt ────────────────────────────────────────
async function twilioSend(to, message, from) {
    const client = getTwilioClient();
    return withTimeout(
        client.messages.create({ body: message, from, to }),
        TWILIO_TIMEOUT_MS,
    );
}

// ─── Classify a Twilio error ──────────────────────────────────────
function classifyTwilioError(err) {
    const code = err.code || err.status;
    return {
        code,
        retryable: RETRYABLE_CODES.has(code) || err.message?.includes("timed out"),
        regionBlocked: REGION_BLOCKED_CODES.has(code),
        userMessage: TWILIO_ERROR_MAP[code] || "Failed to send SMS. Please try again.",
    };
}

// ─── Core Twilio provider (retry once for transient errors) ───────
async function sendViaTwilio(to, message) {
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) {
        throw new Error("TWILIO_PHONE_NUMBER must be set.");
    }

    const masked = maskPhone(to);
    logger.info("Twilio SMS attempt", { to: masked, from: maskPhone(from) });

    let lastError;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const result = await twilioSend(to, message, from);

            logger.info("Twilio SMS accepted", {
                to: masked,
                sid: result.sid,
                status: result.status,
                attempt,
            });

            return {
                provider: "twilio",
                delivered: true,
                sid: result.sid,
                status: result.status,
            };
        } catch (err) {
            lastError = err;
            const classified = classifyTwilioError(err);

            logger.error("Twilio SMS failed", {
                to: masked,
                from: maskPhone(from),
                attempt,
                twilioCode: classified.code,
                retryable: classified.retryable,
                regionBlocked: classified.regionBlocked,
                errorMessage: err.message,
                moreInfo: err.moreInfo || null,
            });

            // Only retry on transient errors, and only once
            if (attempt < 2 && classified.retryable) {
                logger.info("Retrying Twilio SMS after transient failure", { to: masked, delay: RETRY_DELAY_MS });
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
                continue;
            }

            // Non-retryable: break immediately
            break;
        }
    }

    // Attach classification to the error so callers can inspect it
    const classified = classifyTwilioError(lastError);
    const enriched = new Error(classified.userMessage);
    enriched.twilioCode = classified.code;
    enriched.regionBlocked = classified.regionBlocked;
    throw enriched;
}

// ─── Mock provider ────────────────────────────────────────────────
function sendViaMock(to, message, context) {
    const masked = maskPhone(to);

    if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_SMS_IN_PRODUCTION !== "true") {
        throw new Error("SMS provider is not configured for production.");
    }

    logger.warn("Mock SMS provider used", {
        context,
        to: masked,
        message: process.env.NODE_ENV === "production" ? "[redacted]" : message,
    });

    return { provider: "mock", delivered: true, warning: "SMS sent via mock provider (not actually delivered)." };
}

// ─── Main entry point ─────────────────────────────────────────────
async function sendSms(to, message) {
    const provider = process.env.SMS_PROVIDER || "mock";
    const fallbackEnabled = process.env.SMS_FALLBACK_TO_MOCK === "true";
    const isIndian = to.startsWith("+91");

    // ── Provider: mock ────────────────────────────────────────────
    if (provider === "mock") {
        return sendViaMock(to, message, "primary-provider");
    }

    // ── Provider: twilio ──────────────────────────────────────────
    if (provider === "twilio") {
        try {
            return await sendViaTwilio(to, message);
        } catch (err) {
            // If fallback is enabled, don't let Twilio failure kill the flow
            if (fallbackEnabled) {
                logger.warn("Twilio failed, falling back to mock", {
                    to: maskPhone(to),
                    twilioCode: err.twilioCode,
                    regionBlocked: err.regionBlocked,
                    error: err.message,
                });

                const result = sendViaMock(to, message, "twilio-fallback");
                result.warning = isIndian && err.regionBlocked
                    ? "SMS delivery to Indian numbers requires Twilio DLT registration. OTP was generated — use mock for testing."
                    : `SMS delivery failed (${err.message}). OTP was generated — use mock for testing.`;
                return result;
            }

            // No fallback — surface India-specific guidance
            if (isIndian && err.regionBlocked) {
                throw new Error(
                    "SMS to Indian numbers requires DLT registration with TRAI through Twilio. " +
                    "Check Twilio docs for India SMS compliance. " +
                    "Set SMS_FALLBACK_TO_MOCK=true in .env to bypass for testing."
                );
            }

            throw err;
        }
    }

    throw new Error(`Unsupported SMS provider: ${provider}`);
}

module.exports = sendSms;
