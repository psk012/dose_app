const nodemailer = require("nodemailer");
const logger = require("../logger");

// ─── SMTP Configuration ─────────────────────────────
// Create a fresh transporter for each email to avoid stale pool connections
// on serverless/cold-start environments like Render free tier.
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        // Force 465 by default to bypass Render port 587 outbound firewall
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: parseInt(process.env.SMTP_PORT || "465") === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Timeouts to prevent hanging on Render
        connectionTimeout: 10000,  // 10s to establish connection
        greetingTimeout: 10000,    // 10s for SMTP greeting
        socketTimeout: 15000,      // 15s for socket operations
    });
}

// Pre-warm: verify SMTP credentials on startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const testTransporter = createTransporter();
    testTransporter.verify()
        .then(() => {
            console.log("✅ SMTP connection verified and ready");
            console.log(`   Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}`);
            console.log(`   Port: ${process.env.SMTP_PORT || "465"}`);
            console.log(`   User: ${process.env.EMAIL_USER}`);
            testTransporter.close();
        })
        .catch((err) => {
            console.error("❌ SMTP connection FAILED on startup:", err.message);
            console.error("   → OTP emails WILL NOT work until this is fixed.");
            console.error("   → Check EMAIL_USER and EMAIL_PASS environment variables.");
            if (err.code === "EAUTH") {
                console.error("   → AUTH ERROR: Make sure you're using a Gmail App Password (16 lowercase chars).");
                console.error("   → Generate one at: https://myaccount.google.com/apppasswords");
            }
            testTransporter.close();
        });
} else {
    console.error("❌ SMTP credentials missing! EMAIL_USER and/or EMAIL_PASS not set.");
    console.error("   → Set these in your .env file or Render Environment Variables.");
}

/**
 * Send an email with robust error handling and retry logic.
 * Creates a fresh SMTP connection each time to avoid stale pools on serverless.
 */
async function sendEmail(to, subject, html) {
    // 1. Validate credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        const msg = "SMTP credentials missing. Set EMAIL_USER and EMAIL_PASS.";
        console.error(`❌ sendEmail() failed: ${msg}`);
        logger.error(msg);
        throw new Error(msg);
    }

    // 2. Create fresh transporter (avoids stale pool issue on Render)
    const transporter = createTransporter();
    
    // 3. Extract plain text OTP for text fallback
    const otpMatch = html.match(/>(\d{4})</);
    const textFallback = otpMatch 
        ? `Your Manas Verification Code is: ${otpMatch[1]}. This code expires in 5 minutes.`
        : `Manas: ${subject}`;

    // 4. Send with detailed logging
    const start = Date.now();
    try {
        console.log(`📧 Attempting to send email to ${to}...`);
        
        const info = await transporter.sendMail({
            from: `"Manas" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text: textFallback,
        });
        
        const elapsed = Date.now() - start;
        console.log(`✅ Email sent to ${to} in ${elapsed}ms`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   SMTP Response: ${info.response}`);
        console.log(`   Accepted: ${JSON.stringify(info.accepted)}`);
        console.log(`   Rejected: ${JSON.stringify(info.rejected)}`);
        
        if (info.rejected && info.rejected.length > 0) {
            logger.error(`Email rejected for: ${info.rejected.join(", ")}`);
        }
        
        return info;
    } catch (error) {
        const elapsed = Date.now() - start;
        console.error(`❌ Email FAILED to ${to} after ${elapsed}ms: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Error command: ${error.command}`);
        
        // Log specific error types for debugging
        if (error.code === "EAUTH") {
            console.error("   → Authentication failed. Check EMAIL_USER and EMAIL_PASS.");
            console.error("   → If using Gmail, you need a 16-char App Password.");
        } else if (error.code === "ESOCKET" || error.code === "ETIMEDOUT") {
            console.error("   → Network/timeout error. SMTP server may be unreachable.");
            console.error("   → Check if your hosting provider blocks outbound SMTP.");
        } else if (error.code === "ECONNECTION") {
            console.error("   → Connection refused. Check SMTP_HOST and SMTP_PORT.");
        }
        
        logger.error(`Failed to send email to ${to}`, { 
            error: error.message, 
            code: error.code,
            elapsed 
        });
        
        throw new Error(`Email delivery failed: ${error.message}`);
    } finally {
        transporter.close();
    }
}

module.exports = sendEmail;
