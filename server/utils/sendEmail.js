const nodemailer = require("nodemailer");
const logger = require("../logger");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, subject, html) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ SMTP credentials missing in .env! Email not sent.");
        throw new Error("SMTP credentials missing on server. Check Environment Variables.");
    }
    
    try {
        const info = await transporter.sendMail({
            from: `"Manas" <${process.env.EMAIL_USER}>`,
            to, subject, html
        });
        console.log(`Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    } catch (error) {
        logger.error("Failed to send email", { error });
        console.error("Failed to send email:", error);
        throw new Error(`SMTP Error: ${error.message}`);
    }
}

module.exports = sendEmail;
