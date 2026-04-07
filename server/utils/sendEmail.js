const { Resend } = require("resend");
const logger = require("../logger");

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");

/**
 * Send an email using Resend API.
 */
async function sendEmail(to, subject, html) {
    if (!process.env.RESEND_API_KEY) {
        const msg = "RESEND_API_KEY missing. Please set it in your .env or Render dashboard.";
        console.error(`❌ sendEmail() failed: ${msg}`);
        logger.error(msg);
        throw new Error(msg);
    }

    // Extract plain text OTP for text fallback
    const otpMatch = html.match(/>(\d{4})</);
    const textFallback = otpMatch 
        ? `Your Manas Verification Code is: ${otpMatch[1]}. This code expires in 5 minutes.`
        : `Manas: ${subject}`;

    const start = Date.now();
    try {
        console.log(`📧 Attempting to send email via Resend to ${to}...`);
        
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || "Manas <onboarding@resend.dev>", // Defaults to onboarding domain
            to: [to],
            subject: subject,
            html: html,
            text: textFallback,
        });

        if (error) {
            throw error;
        }
        
        const elapsed = Date.now() - start;
        console.log(`✅ Email sent via Resend to ${to} in ${elapsed}ms (ID: ${data.id})`);
        return data;

    } catch (error) {
        const elapsed = Date.now() - start;
        console.error(`❌ Email FAILED to ${to} after ${elapsed}ms: ${error.message}`);
        
        logger.error(`Failed to send email to ${to}`, { 
            error: error.message, 
            elapsed 
        });
        
        throw new Error(`Email delivery failed: ${error.message}`);
    }
}

module.exports = sendEmail;
