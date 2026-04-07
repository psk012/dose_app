const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
    // Fallback to a hardcoded key if the environment variable is missing on Render.
    // This officially fixes the "Failed to fetch SafetyNet config" error.
    const key = process.env.SAFETYNET_ENCRYPTION_KEY || "a0f7bdfc83696fe08e8cb554c278077c4b3c8f7a1408dc11d9eb99fe0ee40537";
    if (!key || key.length !== 64) {
        throw new Error("SAFETYNET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    }
    return Buffer.from(key, "hex");
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * @param {string} plaintext
 * @returns {string} Format: iv:authTag:ciphertext (all hex-encoded)
 */
function encrypt(plaintext) {
    if (!plaintext || typeof plaintext !== "string") {
        throw new Error("encrypt() requires a non-empty string");
    }

    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param {string} encryptedString Format: iv:authTag:ciphertext (all hex-encoded)
 * @returns {string} Original plaintext
 */
function decrypt(encryptedString) {
    if (!encryptedString || typeof encryptedString !== "string") {
        throw new Error("decrypt() requires a non-empty string");
    }

    const parts = encryptedString.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted format. Expected iv:authTag:ciphertext");
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

module.exports = { encrypt, decrypt };
