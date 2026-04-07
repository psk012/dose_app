const nodemailer = require("nodemailer");
const logger = require("../logger");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Keep the connection alive so subsequent emails don't re-handshake
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
});

// Pre-warm: verify SMTP credentials on startup so the connection is ready
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter.verify()
        .then(() => console.log("✅ SMTP connection verified and ready"))
        .catch((err) => console.error("❌ SMTP connection failed:", err.message));
}

async function sendEmail(to, subject, html) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ SMTP credentials missing in .env! Email not sent.");
        throw new Error("SMTP credentials missing on server. Check Environment Variables.");
    }
    
    try {
        const start = Date.now();
        const info = await transporter.sendMail({
            from: `"Manas" <${process.env.EMAIL_USER}>`,
            to, subject, html
        });
        console.log(`📧 Email sent to ${to} in ${Date.now() - start}ms (ID: ${info.messageId})`);
    } catch (error) {
        logger.error("Failed to send email", { error });
        console.error("Failed to send email:", error);
        throw new Error(`SMTP Error: ${error.message}`);
    }
}

module.exports = sendEmail;
