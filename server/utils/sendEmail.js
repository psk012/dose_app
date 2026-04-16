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
        // ALWAYS use onboarding@resend.dev in test mode
        const fromEmail = "Manas <onboarding@resend.dev>";

        // FORCE redirect all emails to your personal verified email in test mode
        const testEmail = "pskedhar@gmail.com"; // Replace with your actual Resend account email!

        console.log(`📧 Attempting to send email via Resend...`);
        console.log(`   From: ${fromEmail}`);
        console.log(`   To: ${testEmail} (Redirected from: ${to})`);
        console.log("HTML preview:", html);

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: testEmail,
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
