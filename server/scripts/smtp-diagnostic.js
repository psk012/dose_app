/**
 * SMTP Diagnostic Script
 * Tests the entire email pipeline independently of Express.
 * Run: node scripts/smtp-diagnostic.js
 */
require("dotenv").config();
const nodemailer = require("nodemailer");

const CHECKS = [];
function check(name, pass, detail) {
    CHECKS.push({ name, pass, detail });
    console.log(`${pass ? "✅" : "❌"} ${name}: ${detail}`);
}

async function runDiagnostics() {
    console.log("\n══════════════════════════════════════════");
    console.log("  SMTP DIAGNOSTIC — Manas OTP Pipeline");
    console.log("══════════════════════════════════════════\n");

    // ─── 1. Environment Variables ────────────────────────
    console.log("── 1. Environment Variables ──────────────\n");
    
    const vars = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS,
    };

    for (const [k, v] of Object.entries(vars)) {
        if (!v) {
            check(k, false, "MISSING — this will prevent emails from sending");
        } else if (k === "EMAIL_PASS") {
            check(k, true, `Set (${v.length} chars, starts with "${v.substring(0, 3)}...")`);
        } else {
            check(k, true, v);
        }
    }

    if (!vars.EMAIL_USER || !vars.EMAIL_PASS) {
        console.log("\n🛑 FATAL: Cannot proceed without SMTP credentials.\n");
        return;
    }

    // ─── 2. Gmail App Password Validation ────────────────
    console.log("\n── 2. Gmail App Password Format ──────────\n");
    
    const pass = vars.EMAIL_PASS;
    const isAppPassword = /^[a-z]{16}$/.test(pass.replace(/\s/g, ""));
    check(
        "App Password Format",
        isAppPassword,
        isAppPassword
            ? `Looks correct (16 lowercase letters: ${pass.substring(0, 4)}...)`
            : `WARNING: "${pass}" does NOT look like a Gmail App Password. ` +
              `App passwords are exactly 16 lowercase letters (no spaces). ` +
              `If 2FA is on, you MUST use an App Password, not your real password.`
    );

    // ─── 3. SMTP Connection Test ─────────────────────────
    console.log("\n── 3. SMTP Connection Test ──────────────\n");

    const transportConfig = {
        host: vars.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(vars.SMTP_PORT || "587"),
        secure: parseInt(vars.SMTP_PORT || "587") === 465,
        auth: {
            user: vars.EMAIL_USER,
            pass: vars.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        logger: true,
        debug: true,
    };

    console.log(`   Host: ${transportConfig.host}`);
    console.log(`   Port: ${transportConfig.port}`);
    console.log(`   Secure (TLS): ${transportConfig.secure}`);
    console.log(`   User: ${transportConfig.auth.user}\n`);

    const transporter = nodemailer.createTransport(transportConfig);

    try {
        console.log("   Attempting transporter.verify()...\n");
        const startVerify = Date.now();
        await transporter.verify();
        const verifyMs = Date.now() - startVerify;
        check("SMTP verify()", true, `Connection verified in ${verifyMs}ms`);
    } catch (err) {
        check("SMTP verify()", false, `FAILED: ${err.message}`);
        
        // Diagnose specific errors
        if (err.message.includes("Invalid login") || err.code === "EAUTH") {
            console.log("\n   🔑 AUTH ERROR — Common causes:");
            console.log("      1. 2-Step Verification is ON but you're using your real password");
            console.log("         → Go to https://myaccount.google.com/apppasswords");
            console.log("         → Generate a new App Password for 'Mail'");
            console.log("         → Put the 16-char password in EMAIL_PASS (no spaces)");
            console.log("      2. 'Less secure apps' is OFF (Google removed this in 2022)");
            console.log("      3. The email/password combo is simply wrong");
        }
        if (err.message.includes("ETIMEDOUT") || err.message.includes("ECONNREFUSED")) {
            console.log("\n   🌐 NETWORK ERROR — Common causes:");
            console.log("      1. Firewall blocking port 587/465");
            console.log("      2. Render free tier may block outbound SMTP");
            console.log("      3. DNS resolution failure");
        }
        
        console.log("\n🛑 Cannot send test email — SMTP connection failed.\n");
        printSummary();
        transporter.close();
        return;
    }

    // ─── 4. Send Test Email ──────────────────────────────
    console.log("\n── 4. Send Test Email ───────────────────\n");

    const testOtp = "1234";
    const recipient = vars.EMAIL_USER; // Send to self
    
    console.log(`   Sending test OTP email to: ${recipient}`);

    try {
        const startSend = Date.now();
        const info = await transporter.sendMail({
            from: `"Manas Diagnostic" <${vars.EMAIL_USER}>`,
            to: recipient,
            subject: "🔧 SMTP Diagnostic Test — Manas",
            html: `<div style="padding:20px; font-family:Arial;">
                <h2>SMTP Diagnostic Test</h2>
                <p>If you see this, your SMTP configuration is <strong>working correctly</strong>.</p>
                <p>Test OTP: <strong style="font-size:24px; color:#6c5ce7;">${testOtp}</strong></p>
                <p>Sent at: ${new Date().toISOString()}</p>
            </div>`,
            text: `SMTP Diagnostic Test. If you see this, SMTP works. Test OTP: ${testOtp}`,
        });
        const sendMs = Date.now() - startSend;
        
        check("Send Email", true, `Delivered in ${sendMs}ms`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log(`   Accepted: ${JSON.stringify(info.accepted)}`);
        console.log(`   Rejected: ${JSON.stringify(info.rejected)}`);
        
        if (info.rejected && info.rejected.length > 0) {
            check("Recipient Accepted", false, `Rejected recipients: ${info.rejected.join(", ")}`);
        } else {
            check("Recipient Accepted", true, `All recipients accepted`);
        }
    } catch (err) {
        check("Send Email", false, `FAILED: ${err.message}`);
        console.log(`\n   Full error:\n   ${JSON.stringify(err, null, 2)}`);
    }

    transporter.close();
    printSummary();
}

function printSummary() {
    console.log("\n══════════════════════════════════════════");
    console.log("  SUMMARY");
    console.log("══════════════════════════════════════════\n");
    
    const failed = CHECKS.filter(c => !c.pass);
    if (failed.length === 0) {
        console.log("🎉 All checks passed! SMTP is working correctly.");
        console.log("   If OTPs still aren't arriving, check:");
        console.log("   1. Spam/Junk folder in recipient's inbox");
        console.log("   2. Gmail daily send limit (500/day for free accounts)");
        console.log("   3. Render environment variables match local .env");
    } else {
        console.log(`⚠️  ${failed.length} check(s) failed:\n`);
        for (const f of failed) {
            console.log(`   ❌ ${f.name}: ${f.detail}`);
        }
    }
    console.log("");
}

runDiagnostics().catch(console.error);
