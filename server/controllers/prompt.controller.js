const { GoogleGenerativeAI } = require("@google/generative-ai");
const Journal = require("../models/journal");
const MoodEntry = require("../models/moodEntry");
const Reflection = require("../models/reflection");
const logger = require("../logger");

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Static prompts fallback
const STATIC_PROMPTS = {
    daily: {
        calm: "What brought peace to your mind today?",
        heavy: "What feels too heavy right now? Write it down to let it go.",
        anxious: "What is your biggest 'what if' right now? How likely is it actually?",
        overwhelmed: "If you could only do one small thing today, what would it be?",
        numb: "What is one simple sensory detail you noticed today? (e.g. the smell of coffee, warmth of the sun)",
        default: "What's on your mind right now?"
    },
    weekly: {
        default: "Looking back at this week, what was the most meaningful lesson?"
    },
    monthly: {
        default: "What is a pattern in your life you'd like to change next month?"
    },
    yearly: {
        default: "What are you most proud of surviving or achieving this year?"
    }
};

exports.generatePrompt = async (req, res) => {
    try {
        const { mood = "default", type = "daily" } = req.body;
        const userId = req.user ? req.user.id : req.userId;

        // Fallback or static selection mechanism
        let fallbackPrompt = STATIC_PROMPTS.default;
        if (STATIC_PROMPTS[type]) {
            fallbackPrompt = STATIC_PROMPTS[type][mood] || STATIC_PROMPTS[type].default || STATIC_PROMPTS.daily.default;
        }

        // If Gemini is not configured, return a static prompt
        if (!genAI) {
            return res.status(200).json({ prompt: fallbackPrompt, isAI: false });
        }

        // Fetch recent journal context (last 2 non-deleted entries)
        const recentEntries = await Journal.find({ userId, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(2)
            .select("text createdAt");

        let contextText = "";
        if (recentEntries.length > 0) {
            contextText = "User's recent journal thoughts (use to provide a gently relevant question, but DO NOT reference the exact text directly in a creepy way):\n";
            recentEntries.reverse().forEach(entry => {
                contextText += `- ${entry.text}\n`;
            });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { temperature: 0.9 }
        });

        const promptTemplate = `
You are a deeply empathetic, non-judgmental journaling companion for a mental wellness app.
Your task is to generate ONE single, highly unique, and unpredictable journaling prompt.

Context: 
- Mood state: ${mood}
- Current time: ${new Date().toISOString()} (Use this to ensure your output is entirely different from previous times)
${contextText}

Guidelines:
1. Provide a COMPLETELY UNIQUE question. NEVER repeat the same question twice.
2. Keep it simple, human, and emotionally intelligent. Ask exactly ONE question.
3. DO NOT sound like a robot, therapist, or use overly flowery language.
4. DO NOT use em dashes. Use commas and semicolons instead.
5. Keep it under 2 sentences.

Output ONLY the prompt string. Do not output JSON.
`;

        const result = await model.generateContent(promptTemplate);
        const generatedPrompt = result.response.text().trim();

        if (!generatedPrompt) {
            throw new Error("Empty response from AI");
        }

        return res.status(200).json({ prompt: generatedPrompt, isAI: true });
    } catch (error) {
        logger.error(`AI Prompt Generation Error: ${error.message}`);
        
        // Ensure graceful fallback
        const { mood = "default", type = "daily" } = req.body;
        let p = STATIC_PROMPTS.daily.default;
        if (STATIC_PROMPTS[type] && STATIC_PROMPTS[type][mood]) {
            p = STATIC_PROMPTS[type][mood];
        } else if (STATIC_PROMPTS[type]) {
            p = STATIC_PROMPTS[type].default;
        }

        return res.status(200).json({ prompt: p, isAI: false });
    }
};
const STATIC_REFLECTIONS = {
    calm: {
        tip: "How about a 5-minute slow walk to maintain this peace?",
        prompts: ["What specifically is contributing to your sense of peace right now?", "How can you carry this calmness into your next task?", "What is one thing you're grateful for in this quiet moment?"]
    },
    heavy: {
        tip: "Try listening to one song that matches your mood, then one that gently lifts it.",
        prompts: ["If your heart could speak without words right now, what would it say?", "What is one thing you can take off your plate for the next hour?", "Who is someone who makes you feel safe when things feel heavy?"]
    },
    anxious: {
        tip: "Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.",
        prompts: ["What is the one thing you are most afraid of happening right now?", "If that fear came true, what is one way you would cope?", "Write down three things that are currently within your control."]
    },
    overwhelmed: {
        tip: "Pick just one tiny task; like drinking a glass of water; and do only that.",
        prompts: ["What is the loudest thought in your head right now?", "What would it look like to be 10% kinder to yourself today?", "If you could pause time for 30 minutes, what would you do first?"]
    },
    numb: {
        tip: "Try a high-intensity sensory input: splash cold water on your face.",
        prompts: ["When was the last time you felt a spark of any emotion, even a small one?", "What is one physical sensation in your body right now (even if it's just 'blank')?", "If your current state was a color, what would it be and why?"]
    },
    default: {
        tip: "Take three deep, intentional breaths right now.",
        prompts: ["What is one thing on your mind that you haven't shared with anyone?", "What does 'self-care' actually mean to you today?", "What is something you're looking forward to, however small?"]
    }
};

exports.generateReflections = async (req, res) => {
    try {
        const { mood = "default" } = req.body;
        const normalizedMood = mood.toLowerCase();

        // If Gemini is not configured, return static reflections
        if (!genAI) {
            const data = STATIC_REFLECTIONS[normalizedMood] || STATIC_REFLECTIONS.default;
            return res.status(200).json({ tip: data.tip, prompts: data.prompts, isAI: false });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const promptTemplate = `
You are a deeply empathetic, slightly poetic mental wellness companion. 
The user is currently feeling: ${normalizedMood}.

Task:
1. Generate ONE very short, 1-sentence "Mindful Tip" to help them.
   - Avoid generic advice like "Take 3 breaths" or "Drink water".
   - Be creative, varied, and specific (e.g., "Look for the smallest green thing in the room", "Hum a low note for ten seconds", "Touch something cold").
2. Generate THREE unique, thoughtful reflection questions for the mood "${normalizedMood}". 
   - Questions should be probing but safe.
   - Avoid generic "How are you?" questions.

Output strictly in JSON format:
{
  "tip": "the creative mindful tip here",
  "prompts": ["prompt 1", "prompt 2", "prompt 3"]
}
`;

        const result = await model.generateContent(promptTemplate);
        const responseText = result.response.text().trim();
        
        // Basic JSON extraction (in case AI wraps it in markdown blocks)
        const jsonStr = responseText.includes("{") ? responseText.slice(responseText.indexOf("{"), responseText.lastIndexOf("}") + 1) : responseText;
        
        try {
            const data = JSON.parse(jsonStr);
            return res.status(200).json({ ...data, isAI: true });
        } catch (e) {
            throw new Error("AI returned invalid JSON");
        }
    } catch (error) {
        logger.error(`AI Reflection Generation Error: ${error.message}`);
        const { mood = "default" } = req.body;
        const data = STATIC_REFLECTIONS[mood.toLowerCase()] || STATIC_REFLECTIONS.default;
        return res.status(200).json({ tip: data.tip, prompts: data.prompts, isAI: false });
    }
};

/**
 * Generate 4 separate prompts (daily, weekly, monthly, yearly) in one go.
 * Uses latest mood and recent reflections for deep context.
 */
exports.generateBulkPrompts = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.userId;

        // 1. Fetch latest mood
        const latestMood = await MoodEntry.findOne({ userId }).sort({ createdAt: -1 });
        const moodText = latestMood ? latestMood.state : "calm";

        // 2. Fetch 3 most recent calendar reflections for context
        const recentReflections = await Reflection.find({ userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("prompt response mood");

        let reflectionContext = "";
        if (recentReflections.length > 0) {
            reflectionContext = "User's recent calendar reflections (use for thematic continuity, but DO NOT repeat them):\n";
            recentReflections.forEach(ref => {
                reflectionContext += `- To the prompt "${ref.prompt}", user wrote: "${ref.response}" (Feeling ${ref.mood})\n`;
            });
        }

        // 3. Fetch 2 recent journal entries for wider context
        const recentJournals = await Journal.find({ userId, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(2)
            .select("text");
        
        let journalContext = "";
        if (recentJournals.length > 0) {
            journalContext = "User's recent journal thoughts:\n";
            recentJournals.forEach(j => {
                journalContext += `- ${j.text}\n`;
            });
        }

        if (!genAI) {
            return res.status(200).json({
                daily: "What is one small thing that made you smile today?",
                weekly: "What was the most challenging moment this week and how did you handle it?",
                monthly: "Looking back at the past 30 days; what is a pattern you've noticed in your energy?",
                yearly: "If you could tell yourself something on January 1st of this year; what would it be?",
                isAI: false
            });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { temperature: 0.9 }
        });

        const promptTemplate = `
You are 'Manas', an emotionally intelligent and deeply reflective wellness guide.
Your task is to generate FOUR distinct journaling prompts for the user based on their context.

Context:
- Current Mood: ${moodText}
- ${reflectionContext}
- ${journalContext}
- Current Date: ${new Date().toDateString()}

Timeframe Requirements:
1. DAILY: Focus on the immediate; the small joys; or the current mood.
2. WEEKLY: A bridge between days; looking at growth or challenges over 7 days.
3. MONTHLY: A landscape view; looking at themes; habits; or internal shifts.
4. YEARLY: A mountain-top view; looking at the journey; resilience; and long-term evolution.

RULES:
- Vocabulary: Super simple; grounded; and human. (e.g., Avoid 'transformation'; use 'change'. Avoid 'utilize'; use 'use').
- Tone: Highly reflective and specific. Ask about feelings; sounds; textures; or specific moments.
- NO EM DASHES: Never use the — character. Use semicolons (;) or commas (,) instead.
- Format: Return strictly JSON as follows:
{
  "daily": "...",
  "weekly": "...",
  "monthly": "...",
  "yearly": "..."
}
`;

        const result = await model.generateContent(promptTemplate);
        const responseText = result.response.text().trim();
        const jsonStr = responseText.includes("{") ? responseText.slice(responseText.indexOf("{"), responseText.lastIndexOf("}") + 1) : responseText;
        
        const data = JSON.parse(jsonStr);
        return res.status(200).json({ ...data, isAI: true });

    } catch (error) {
        logger.error(`Bulk Prompt Generation Error: ${error.message}`);
        return res.status(200).json({
            daily: "What is one thing you noticed today that usually goes ignored?",
            weekly: "How has your relationship with yourself evolved over the last seven days?",
            monthly: "What is a recurring thought that has been visiting you this month?",
            yearly: "What is the bravest thing you've done for your own peace this year?",
            isAI: false
        });
    }
};
