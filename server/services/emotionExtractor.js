/**
 * Emotion Extractor — Local keyword-based sentiment analysis.
 * Extracts emotional keywords from text locally (never sends raw text externally).
 * This is the privacy layer between journal content and AI analysis.
 */

// ─── EMOTIONAL LEXICONS ──────────────────────────────
const INTENSE_NEGATIVE = new Set([
    "hopeless", "worthless", "empty", "exhausted", "trapped", "broken",
    "alone", "terrified", "panic", "despair", "numb", "disconnected",
    "suffering", "suffocating", "helpless", "devastated", "shattered",
    "drowning", "darkness", "void", "pointless", "unbearable", "agony",
    "defeated", "abandoned", "invisible", "hollowed", "paralyzed",
    "crushed", "tormented", "dead", "dying", "ending", "finished",
    "useless", "failure", "burden", "unwanted", "unlovable",
]);

const MODERATE_NEGATIVE = new Set([
    "sad", "tired", "anxious", "worried", "stressed", "frustrated",
    "angry", "guilty", "ashamed", "confused", "lonely", "overwhelmed",
    "irritated", "restless", "uncertain", "insecure", "doubtful",
    "drained", "struggling", "uneasy", "tense", "melancholy",
    "regret", "disappointed", "hurt", "bothered", "tearful",
    "gloomy", "pessimistic", "unmotivated", "distracted", "scattered",
]);

const POSITIVE = new Set([
    "happy", "grateful", "hopeful", "calm", "peaceful", "energized",
    "confident", "loved", "joyful", "content", "excited", "proud",
    "accomplished", "motivated", "inspired", "relaxed", "fulfilled",
    "strong", "clarity", "thankful", "relieved", "optimistic",
    "cheerful", "comfortable", "balanced", "centered", "connected",
    "growing", "healing", "improving", "better", "lighter",
]);

/**
 * Extracts emotional keywords from journal text.
 * Strips all identifiable content — only returns emotional descriptors.
 * 
 * @param {string} text - Raw journal text
 * @returns {{ keywords: string[], intensity: number, negativeRatio: number, positiveRatio: number, category: string }}
 */
function extractEmotions(text) {
    if (!text || typeof text !== "string") {
        return { keywords: [], intensity: 0, negativeRatio: 0, positiveRatio: 0, category: "neutral" };
    }

    // Normalize: lowercase, strip punctuation, split into words
    const words = text
        .toLowerCase()
        .replace(/[^a-z\s'-]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2);

    const foundKeywords = [];
    let intenseNegCount = 0;
    let moderateNegCount = 0;
    let positiveCount = 0;

    const seen = new Set();

    for (const word of words) {
        // Avoid duplicate keywords
        if (seen.has(word)) continue;

        if (INTENSE_NEGATIVE.has(word)) {
            foundKeywords.push(word);
            intenseNegCount++;
            seen.add(word);
        } else if (MODERATE_NEGATIVE.has(word)) {
            foundKeywords.push(word);
            moderateNegCount++;
            seen.add(word);
        } else if (POSITIVE.has(word)) {
            foundKeywords.push(word);
            positiveCount++;
            seen.add(word);
        }
    }

    const totalEmotional = intenseNegCount + moderateNegCount + positiveCount;

    // Intensity: 0–1 scale. Intense negative words weigh 2x.
    const rawIntensity = totalEmotional > 0
        ? (intenseNegCount * 2 + moderateNegCount) / (totalEmotional * 2)
        : 0;
    const intensity = Math.min(1, rawIntensity);

    const negativeCount = intenseNegCount + moderateNegCount;
    const negativeRatio = totalEmotional > 0 ? negativeCount / totalEmotional : 0;
    const positiveRatio = totalEmotional > 0 ? positiveCount / totalEmotional : 0;

    let category = "neutral";
    if (negativeRatio > 0.7 && intensity > 0.5) category = "distressed";
    else if (negativeRatio > 0.5) category = "negative";
    else if (positiveRatio > 0.7) category = "positive";
    else if (totalEmotional > 0) category = "mixed";

    return {
        keywords: foundKeywords,
        intensity: Math.round(intensity * 100) / 100,
        negativeRatio: Math.round(negativeRatio * 100) / 100,
        positiveRatio: Math.round(positiveRatio * 100) / 100,
        category,
    };
}

/**
 * Aggregates emotion extraction across multiple journal entries.
 * Used to build the anonymized summary sent to AI.
 * 
 * @param {Array<{ text: string, createdAt: Date }>} entries - Journal entries
 * @returns {{ aggregatedKeywords: string[], avgIntensity: number, avgNegativeRatio: number, dominantCategory: string, entryCount: number }}
 */
function aggregateEmotions(entries) {
    if (!entries || entries.length === 0) {
        return {
            aggregatedKeywords: [],
            avgIntensity: 0,
            avgNegativeRatio: 0,
            avgPositiveRatio: 0,
            dominantCategory: "neutral",
            entryCount: 0,
        };
    }

    const keywordFrequency = {};
    let totalIntensity = 0;
    let totalNegRatio = 0;
    let totalPosRatio = 0;
    const categoryCounts = {};

    for (const entry of entries) {
        const result = extractEmotions(entry.text);

        for (const kw of result.keywords) {
            keywordFrequency[kw] = (keywordFrequency[kw] || 0) + 1;
        }

        totalIntensity += result.intensity;
        totalNegRatio += result.negativeRatio;
        totalPosRatio += result.positiveRatio;
        categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;
    }

    const count = entries.length;

    // Get top keywords by frequency (max 20)
    const aggregatedKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([kw]) => kw);

    // Dominant category
    const dominantCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

    return {
        aggregatedKeywords,
        avgIntensity: Math.round((totalIntensity / count) * 100) / 100,
        avgNegativeRatio: Math.round((totalNegRatio / count) * 100) / 100,
        avgPositiveRatio: Math.round((totalPosRatio / count) * 100) / 100,
        dominantCategory,
        entryCount: count,
    };
}

module.exports = { extractEmotions, aggregateEmotions };
