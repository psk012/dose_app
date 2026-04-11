const validator = require("validator");
const disposableDomains = require("disposable-email-domains");

function normalizeEmail(email) {
    if (typeof email !== "string") return "";
    return email.trim().toLowerCase();
}

function validateEmail(email) {
    const normalized = normalizeEmail(email);
    if (!validator.isEmail(normalized)) {
        return { ok: false, message: "Enter a valid email address." };
    }

    const domain = normalized.split("@")[1];
    if (disposableDomains.includes(domain)) {
        return { ok: false, message: "Disposable email addresses are not allowed." };
    }

    return { ok: true, value: normalized };
}

function normalizePhone(phone) {
    if (typeof phone !== "string") return "";
    return phone.trim().replace(/[\s().-]/g, "");
}

function validatePhone(phone) {
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
        return { ok: false, message: "Enter a valid phone number in international format, for example +919876543210." };
    }

    return { ok: true, value: normalized };
}

function validateContactName(name) {
    if (typeof name !== "string") {
        return { ok: false, message: "Contact name is required." };
    }

    const normalized = validator.trim(name);
    if (!validator.isLength(normalized, { min: 1, max: 80 })) {
        return { ok: false, message: "Contact name must be between 1 and 80 characters." };
    }

    return { ok: true, value: normalized };
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function maskEmail(email) {
    const [local, domain] = normalizeEmail(email).split("@");
    if (!local || !domain) return "email";
    return `${local.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
    const normalized = normalizePhone(phone);
    if (normalized.length < 5) return "phone";
    return `${normalized.slice(0, 3)}***${normalized.slice(-2)}`;
}

module.exports = {
    escapeHtml,
    maskEmail,
    maskPhone,
    normalizeEmail,
    normalizePhone,
    validateContactName,
    validateEmail,
    validatePhone,
};
