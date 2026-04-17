const fs = require('fs');

let insightsCode = fs.readFileSync('client/src/pages/insights.jsx', 'utf8');

// 1. Add imports to insights
insightsCode = insightsCode.replace(
    `import { apiFetch, API_BASE } from "../api/api";`,
    `import { apiFetch, API_BASE } from "../api/api";\nimport { SkeletonCard, SkeletonText } from "../components/skeleton";\nimport { startProgress, stopProgress } from "../components/progressBar";`
);

// 2. Add startProgress/stopProgress logic to top-level fetches in insights.jsx
// We can wrap the whole initial load effect or specific fetch calls.
// Best place is to just replace fetchInsights, fetchActivity, fetchHistoryForDate
insightsCode = insightsCode.replace(
    `    const fetchInsights = async () => {`,
    `    const fetchInsights = async () => {\n        startProgress();`
);
insightsCode = insightsCode.replace(
    `        } finally {\n            setLoading(false);\n        }\n    };`,
    `        } finally {\n            setLoading(false);\n            stopProgress();\n        }\n    };`
);

// 3. Replace insights reflectionsLoading skeleton
insightsCode = insightsCode.replace(
    /\{reflectionsLoading \? \([\s\S]*?animate-pulse[\s\S]*?\) : reflections\.length > 0 \? \(/,
    `{reflectionsLoading ? (
                                <div className="space-y-3">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            ) : reflections.length > 0 ? (`
);

// 4. Replace insights historyLoading skeleton
insightsCode = insightsCode.replace(
    /\{isHistoryLoading \? \([\s\S]*?animate-pulse[\s\S]*?\) : historyItems\.length > 0 \? \(/,
    `{isHistoryLoading ? (
                                <div className="space-y-3">
                                    <SkeletonText lines={2} className="bg-surface-container rounded-xl p-4" />
                                </div>
                            ) : historyItems.length > 0 ? (`
);

fs.writeFileSync('client/src/pages/insights.jsx', insightsCode);
console.log('Insights patched');

// MOOD.JSX
let moodCode = fs.readFileSync('client/src/components/mood.jsx', 'utf8');

moodCode = moodCode.replace(
    `    const handleSubmit = async (moodName) => {
        setMood(moodName);
        setIsSaving(true);
        setSaved(false);
        try {
            await apiFetch(\`\${API_BASE}/insights/mood\`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify({ state: moodName }),
            });
            setSaved(true);
            if (onMoodSaved) onMoodSaved(moodName);
        } catch (error) {
            console.error("Failed to log mood:", error);
        } finally {
            setIsSaving(false);
        }
    };`,
    `    const handleSubmit = async (moodName) => {
        const prevMood = selectedMood;
        setMood(moodName);
        setSaved(true);
        setIsSaving(false);
        if (onMoodSaved) onMoodSaved(moodName); // Optimistic UI trigger
        
        try {
            await apiFetch(\`\${API_BASE}/insights/mood\`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify({ state: moodName }),
            });
        } catch (error) {
            setMood(prevMood);
            setSaved(false);
            console.error("Failed to log mood:", error);
        }
    };`
);

moodCode = moodCode.replace(
    /\{\(isSaving \|\| saved\) && \([\s\S]*?Listening carefully[\s\S]*?\} \([\s\S]*?Your feeling has been gently recorded[\s\S]*?\}\)/,
    `{(isSaving || saved) && (
                <div className="mt-6 flex items-center justify-center gap-2 animate-fade-in">
                    {isSaving ? (
                        <>
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            <p className="text-xs text-on-surface-variant font-medium">Recording lightly...</p>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                            <p className="text-xs text-on-surface-variant font-medium">Your feeling has been gently recorded.</p>
                        </>
                    )}
                </div>
            )}`
);

fs.writeFileSync('client/src/components/mood.jsx', moodCode);
console.log('Mood patched');
