const { Resend } = require("resend");
const logger = require("../logger");


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
    const otpMatch = html.match(/>(\d{4,8})</);
    const textFallback = otpMatch
        ? `Your Manas Verification Code is: ${otpMatch[1]}. This code expires in 5 minutes.`
        : `Manas: ${subject}`;

    const start = Date.now();
    try {
        const isProduction = process.env.NODE_ENV === "production";
        const fromEmail = process.env.EMAIL_FROM || "Manas <onboarding@resend.dev>";
        
        // Only redirect emails if we are NOT in production AND a test email is provided
        const testEmail = process.env.TEST_EMAIL_REDIRECT;
        const recipient = (!isProduction && testEmail) ? testEmail : to;

        if (!isProduction) {
            console.log(`📧 [Dev Mode] Sending email via Resend...`);
            console.log(`   From: ${fromEmail}`);
            console.log(`   To: ${recipient}${recipient !== to ? ` (Redirected from: ${to})` : ""}`);
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: recipient,
            subject: subject,
            html: html,
            text: textFallback,
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            throw error;
        }

        const elapsed = Date.now() - start;
        console.log(`✅ Email sent via Resend to ${testEmail} in ${elapsed}ms (ID: ${data.id})`);
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
