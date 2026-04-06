/**
 * SafetyNet Service — Core analysis and alert orchestration.
 * 
 * PRIVACY GUARANTEES:
 * - Raw journal text is NEVER sent to AI — only extracted emotional keywords
 * - AI responses are stored as numerical scores only
 * - Alert messages contain ZERO user content
 * - No sensitive data is logged
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../logger");
const SafetyNetConfig = require("../models/safetyNetConfig");
const RiskAssessment = require("../models/riskAssessment");
const AlertLog = require("../models/alertLog");
const Journal = require("../models/journal");
const MoodEntry = require("../models/moodEntry");
const { aggregateEmotions } = require("./emotionExtractor");
const { decrypt } = require("../utils/encryption");
const sendEmail = require("../utils/sendEmail");

const NEGATIVE_MOODS = new Set(["heavy", "anxious", "overwhelmed", "numb"]);
const ANALYSIS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ALERT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;    // 7 days
const MIN_DATA_DAYS = 14;
const LOOKBACK_DAYS = 21;

// ─── MAIN ENTRY POINT ────────────────────────────────

/**
 * Analyzes a user's emotional patterns. Called after journal save.
 * Non-blocking — should be fired-and-forgotten.
 */
async function analyzeUserEmotionalPattern(userId) {
    try {
        // 1. Check if SafetyNet is enabled and not paused
        const config = await SafetyNetConfig.findOne({ userId });
        if (!config || !config.enabled) return;

        config.checkPauseExpiry();
        if (config.isPaused) return;

        // 2. Check analysis cooldown
        if (config.lastAnalysisAt) {
            const elapsed = Date.now() - config.lastAnalysisAt.getTime();
            if (elapsed < ANALYSIS_COOLDOWN_MS) return;
        }

        // 3. Check if enough data exists
        const cutoffDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
        const journals = await Journal.find({
            userId,
            isDeleted: false,
            createdAt: { $gte: cutoffDate },
        }).sort({ createdAt: -1 }).lean();

        if (journals.length < 3) return; // Need at least 3 entries

        const firstEntry = journals[journals.length - 1];
        const daySpan = Math.ceil((Date.now() - new Date(firstEntry.createdAt).getTime()) / (24 * 60 * 60 * 1000));
        if (daySpan < MIN_DATA_DAYS) return;

        // 4. Extract emotional keywords (PRIVACY LAYER — no raw text leaves here)
        const emotionSummary = aggregateEmotions(journals);

        // 5. Get mood entries for the same period
        const moodEntries = await MoodEntry.find({
            userId,
            createdAt: { $gte: cutoffDate },
        }).lean();

        const moodAnalysis = analyzeMoodPattern(moodEntries, daySpan);

        // 6. Run AI analysis (with fallback)
        let aiResult = null;
        try {
            aiResult = await runAIAnalysis(emotionSummary, moodAnalysis, daySpan);
        } catch (aiErr) {
            logger.error("SafetyNet AI analysis failed, using local fallback", { error: aiErr.message });
        }

        // 7. Compute composite risk score
        const assessment = computeCompositeRisk(aiResult, moodAnalysis, emotionSummary, daySpan);

        // 8. Save risk assessment
        const riskRecord = new RiskAssessment({
            userId,
            sentimentScore: assessment.sentimentScore,
            riskLevel: assessment.riskLevel,
            riskScore: assessment.riskScore,
            patternFlags: assessment.patternFlags,
            moodTrend: {
                dominantMood: moodAnalysis.dominantMood,
                negativeDays: moodAnalysis.negativeDays,
                totalDaysAnalyzed: daySpan,
            },
            source: aiResult ? "combined" : "local",
            confidence: assessment.confidence,
        });
        await riskRecord.save();

        // 9. Update last analysis time
        config.lastAnalysisAt = new Date();
        await config.save();

        // 10. Check if alert should be triggered
        if (await shouldTriggerAlert(userId, assessment)) {
            await triggerAlert(userId, config, assessment);
            riskRecord.alertTriggered = true;
            await riskRecord.save();
        }

    } catch (err) {
        // Never expose internal errors — just log safely
        logger.error("SafetyNet analysis error", { userId: String(userId), error: err.message });
    }
}

// ─── MOOD PATTERN ANALYSIS ───────────────────────────

function analyzeMoodPattern(moodEntries, totalDays) {
    if (!moodEntries || moodEntries.length === 0) {
        return {
            dominantMood: "unknown",
            negativeDays: 0,
            negativeRatio: 0,
            moodPattern: [],
            consecutiveNegDays: 0,
        };
    }

    const moodCounts = {};
    const dayMoods = {};

    for (const entry of moodEntries) {
        const mood = entry.state;
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;

        const dayKey = new Date(entry.createdAt).toISOString().split("T")[0];
        if (!dayMoods[dayKey]) dayMoods[dayKey] = [];
        dayMoods[dayKey].push(mood);
    }

    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

    // Count days with predominantly negative moods
    let negativeDays = 0;
    for (const [, moods] of Object.entries(dayMoods)) {
        const negCount = moods.filter(m => NEGATIVE_MOODS.has(m)).length;
        if (negCount > moods.length / 2) negativeDays++;
    }

    // Calculate consecutive negative days
    const sortedDays = Object.keys(dayMoods).sort();
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const day of sortedDays) {
        const moods = dayMoods[day];
        const negCount = moods.filter(m => NEGATIVE_MOODS.has(m)).length;
        if (negCount > moods.length / 2) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
            currentConsecutive = 0;
        }
    }

    const moodPattern = moodEntries
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-10)
        .map(e => e.state);

    return {
        dominantMood,
        negativeDays,
        negativeRatio: totalDays > 0 ? Math.round((negativeDays / totalDays) * 100) / 100 : 0,
        moodPattern,
        consecutiveNegDays: maxConsecutive,
    };
}

// ─── AI ANALYSIS (GEMINI) ────────────────────────────

async function runAIAnalysis(emotionSummary, moodAnalysis, durationDays) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // ANONYMIZED INPUT — Only emotional keywords and mood patterns, NEVER raw text
    const prompt = `You are a mental wellness sentiment analysis system. Analyze the following anonymized emotional data and return a JSON assessment. This data comes from a mental wellness app — no personal details are included.

Emotional keywords detected over the past ${durationDays} days: [${emotionSummary.aggregatedKeywords.join(", ")}]
Keyword intensity score: ${emotionSummary.avgIntensity} (0-1 scale, 1 = very intense)
Negative keyword ratio: ${emotionSummary.avgNegativeRatio} (0-1 scale)
Recent mood states: [${moodAnalysis.moodPattern.join(", ")}]
Days with predominantly negative moods: ${moodAnalysis.negativeDays} out of ${durationDays}
Number of journal entries analyzed: ${emotionSummary.entryCount}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "sentimentScore": <number between -1.0 and 1.0, where -1 is extremely negative>,
  "riskFlags": [<array of applicable flags from: "prolonged_negative", "emotional_repetition", "high_intensity", "declining_trend", "isolation_indicators", "emotional_volatility">],
  "suggestedRiskLevel": "<one of: low, medium, high, critical>",
  "confidence": <number between 0.0 and 1.0>
}`;

    // Retry logic: attempt up to 3 times with exponential backoff
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();

            // Parse JSON from response (handle potential markdown wrapping)
            let jsonStr = responseText;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) jsonStr = jsonMatch[0];

            const parsed = JSON.parse(jsonStr);

            // Validate response shape
            if (typeof parsed.sentimentScore !== "number" ||
                !Array.isArray(parsed.riskFlags) ||
                typeof parsed.suggestedRiskLevel !== "string" ||
                typeof parsed.confidence !== "number") {
                throw new Error("Invalid AI response shape");
            }

            // Clamp values
            parsed.sentimentScore = Math.max(-1, Math.min(1, parsed.sentimentScore));
            parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

            return parsed;
        } catch (err) {
            lastError = err;
            if (attempt < 2) {
                await new Promise(r => setTimeout(r, (attempt + 1) * 1000)); // Backoff
            }
        }
    }

    throw lastError || new Error("AI analysis failed after retries");
}

// ─── COMPOSITE RISK SCORING ─────────────────────────

function computeCompositeRisk(aiResult, moodAnalysis, emotionSummary, durationDays) {
    const patternFlags = [];

    // AI Sentiment Component (40% weight) — 0 to 100 scale
    let aiSentimentScore;
    let confidence;

    if (aiResult && aiResult.confidence >= 0.5) {
        // Convert -1..1 to 0..100 where higher = more concerning
        aiSentimentScore = ((1 - aiResult.sentimentScore) / 2) * 100;
        confidence = aiResult.confidence;
        patternFlags.push(...aiResult.riskFlags);
    } else {
        // Fallback: use local emotion data only
        aiSentimentScore = emotionSummary.avgNegativeRatio * 100;
        confidence = 0.4; // Lower confidence for local-only
    }

    // Mood Negativity Component (30% weight) — 0 to 100
    const moodNegScore = moodAnalysis.negativeRatio * 100;
    if (moodAnalysis.negativeRatio > 0.6) patternFlags.push("prolonged_negative");

    // Duration Factor (20% weight) — 0 to 100
    const durationFactor = Math.min(moodAnalysis.consecutiveNegDays / 21, 1) * 100;
    if (moodAnalysis.consecutiveNegDays >= 14) patternFlags.push("sustained_distress");

    // Emotional Repetition Factor (10% weight) — 0 to 100
    const uniqueKeywords = new Set(emotionSummary.aggregatedKeywords).size;
    const totalKeywords = emotionSummary.aggregatedKeywords.length;
    const repetitionFactor = totalKeywords > 0
        ? ((1 - uniqueKeywords / Math.max(totalKeywords, 1)) * 100)
        : 0;
    if (repetitionFactor > 60) patternFlags.push("emotional_repetition");

    // Composite score
    const riskScore = Math.round(
        aiSentimentScore * 0.40 +
        moodNegScore * 0.30 +
        durationFactor * 0.20 +
        repetitionFactor * 0.10
    );
    const clampedScore = Math.max(0, Math.min(100, riskScore));

    // Map to risk level
    let riskLevel;
    if (clampedScore <= 25) riskLevel = "low";
    else if (clampedScore <= 50) riskLevel = "medium";
    else if (clampedScore <= 75) riskLevel = "high";
    else riskLevel = "critical";

    // Sentiment score for storage (-1 to 1 scale)
    const sentimentScore = aiResult ? aiResult.sentimentScore : (1 - 2 * emotionSummary.avgNegativeRatio);

    // Deduplicate flags
    const uniqueFlags = [...new Set(patternFlags)];

    return {
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        riskLevel,
        riskScore: clampedScore,
        patternFlags: uniqueFlags,
        confidence: Math.round(confidence * 100) / 100,
    };
}

// ─── ALERT TRIGGER LOGIC ────────────────────────────

async function shouldTriggerAlert(userId, currentAssessment) {
    // Must be critical
    if (currentAssessment.riskLevel !== "critical") return false;

    // Check recent assessments — need 3 of last 4 to be high or critical
    const recentAssessments = await RiskAssessment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();

    const highOrCritical = recentAssessments.filter(
        a => a.riskLevel === "high" || a.riskLevel === "critical"
    );
    if (highOrCritical.length < 3) return false;

    // Check alert cooldown — no repeat within 7 days
    const lastAlert = await AlertLog.findOne({ userId })
        .sort({ triggeredAt: -1 })
        .lean();

    if (lastAlert) {
        const elapsed = Date.now() - new Date(lastAlert.triggeredAt).getTime();
        if (elapsed < ALERT_COOLDOWN_MS) return false;
    }

    return true;
}

// ─── ALERT DISPATCH ─────────────────────────────────

async function triggerAlert(userId, config, assessment) {
    if (!config.trustedContacts || config.trustedContacts.length === 0) return;

    const cooldownExpires = new Date(Date.now() + ALERT_COOLDOWN_MS);
    let sentCount = 0;
    let failCount = 0;

    for (const contact of config.trustedContacts) {
        try {
            const contactEmail = decrypt(contact.emailEncrypted);
            const contactName = decrypt(contact.nameEncrypted);

            await sendEmail(
                contactEmail,
                "A Gentle Check-In Reminder 💜",
                buildAlertEmailHTML(contactName)
            );

            sentCount++;
        } catch (emailErr) {
            failCount++;
            logger.error("SafetyNet alert email failed", { error: emailErr.message });
        }
    }

    // Log the alert (no PII, no content)
    const alertLog = new AlertLog({
        userId,
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        alertType: "email",
        recipientCount: config.trustedContacts.length,
        deliveryStatus: failCount === 0 ? "sent" : sentCount === 0 ? "failed" : "partial",
        cooldownExpiresAt: cooldownExpires,
    });
    await alertLog.save();

    logger.info("SafetyNet alert processed", {
        userId: String(userId),
        riskLevel: assessment.riskLevel,
        recipientCount: config.trustedContacts.length,
        deliveryStatus: alertLog.deliveryStatus,
    });
}

function buildAlertEmailHTML(contactName) {
    return `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9ff;">
        <div style="background: linear-gradient(135deg, #945d65, #c4888f); padding: 32px 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">manas</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">your mind, your space</p>
        </div>
        <div style="padding: 32px 28px;">
            <p style="color: #4a4458; font-size: 16px; margin: 0 0 6px; font-weight: 500;">Hi ${contactName},</p>
            <p style="color: #7c7291; font-size: 14px; margin: 16px 0; line-height: 1.8;">
                Someone close to you may be going through a difficult emotional phase. If you are available, consider checking in with them. Sometimes a simple <strong>"How are you?"</strong> can mean the world.
            </p>
            <div style="background: #f3f0ff; border-radius: 12px; padding: 16px; margin: 24px 0; border-left: 4px solid #945d65;">
                <p style="color: #7c7291; font-size: 12px; margin: 0; line-height: 1.6;">
                    🔒 <strong>Privacy note:</strong> This is an automated message from Manas, a mental wellness app. No personal details, journal entries, or private content have been shared in this message. The person who added you chose to have this safety net in place.
                </p>
            </div>
            <p style="color: #a099b0; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">With care,<br><strong>The Manas Team</strong></p>
        </div>
        <div style="background: #f3f0ff; padding: 16px 28px; text-align: center; border-top: 1px solid #ede9ff;">
            <p style="color: #b0a8c9; font-size: 11px; margin: 0;">made with care · manas</p>
        </div>
    </div>`;
}

module.exports = { analyzeUserEmotionalPattern };
