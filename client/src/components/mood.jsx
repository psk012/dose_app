import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch, API_BASE } from "../api/api";

const MoodFace = ({ mood }) => {
    // Face Configs: Background Colors & SVG Paths for Eyes/Mouth
    const configs = {
        calm: {
            color: "bg-[#E2F1E8]", // Soft Sage
            eyePath: "M30,45 Q40,35 50,45 M70,45 Q80,35 90,45", // Relaxed closed arcs
            mouthPath: "M40,75 Q60,82 80,75", // Gentle smile
        },
        heavy: {
            color: "bg-[#D9E4F5]", // Droopy Blue
            eyePath: "M35,50 Q42,42 49,50 M71,50 Q78,42 85,50", // Sad/Heavy arcs
            mouthPath: "M45,85 Q60,78 75,85", // Frown
        },
        anxious: {
            color: "bg-[#F2E8F5]", // Pale Lilac
            eyePath: "M35,45 A5,5 0 1,1 45,45 A5,5 0 1,1 35,45 M75,45 A5,5 0 1,1 85,45 A5,5 0 1,1 75,45", // Small wide dots
            mouthPath: "M50,80 Q60,75 70,80 Q60,85 50,80", // Small 'o' or nervous line
        },
        overwhelmed: {
            color: "bg-[#FDE2E5]", // Warm Peach/Red
            eyePath: "M32,42 L48,48 M32,48 L48,42 M72,42 L88,48 M72,48 L88,42", // Scrunched Xs
            mouthPath: "M40,85 Q60,80 80,85", // Tense line
        },
        numb: {
            color: "bg-[#ECECEC]", // Flat Grey
            eyePath: "M30,48 L50,48 M70,48 L90,48", // Straight lines
            mouthPath: "M45,80 L75,80", // Straight line
        },
        default: {
            color: "bg-surface-container-high",
            eyePath: "M30,45 Q40,35 50,45 M70,45 Q80,35 90,45",
            mouthPath: "M45,80 L75,80",
        }
    };

    const current = configs[mood] || configs.default;

    return (
        <div className={`w-32 h-32 rounded-full mx-auto mb-6 transition-colors duration-700 ease-in-out shadow-inner border border-outline-variant/10 flex items-center justify-center animate-breathe ${current.color}`}>
            <svg viewBox="0 0 120 120" className="w-24 h-24">
                {/* Eyes Group with Blink Animation */}
                <g className="animate-blink origins-center">
                    <path 
                        d={current.eyePath} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        className="text-on-surface/60 transition-all duration-500 ease-spring"
                    />
                </g>
                {/* Mouth */}
                <path 
                    d={current.mouthPath} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    className="text-on-surface/60 transition-all duration-500 ease-spring"
                />
            </svg>
        </div>
    );
};

function Mood({ onMoodSaved }) {
    const { token } = useAuth();
    const [selectedMood, setMood] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const moods = [
        { name: "calm", label: "Calm", icon: "spa" },
        { name: "heavy", label: "Heavy", icon: "cloud" },
        { name: "anxious", label: "Anxious", icon: "bolt" },
        { name: "overwhelmed", label: "Overwhelmed", icon: "waves" },
        { name: "numb", label: "Numb", icon: "ac_unit" },
    ];

    const handleSubmit = async (moodName) => {
        setMood(moodName);
        setIsSaving(true);
        setSaved(false);
        try {
            await apiFetch(`${API_BASE}/insights/mood`, {
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
    };

    return (
        <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm transition-all">
            <div className="text-center mb-6">
                <MoodFace mood={selectedMood || "default"} />
                <h2 className="font-semibold text-lg flex items-center justify-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary">favorite</span>
                    How are you feeling right now?
                </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
                {moods.map((m) => (
                    <button
                        key={m.name}
                        onClick={() => handleSubmit(m.name)}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all active:scale-95 ${
                            selectedMood === m.name
                                ? "bg-primary text-on-primary border-primary shadow-md"
                                : "bg-surface border-outline-variant/50 text-on-surface-variant hover:border-primary/30"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                        <span className="text-sm font-bold tracking-tight">{m.label}</span>
                    </button>
                ))}
            </div>

            {(isSaving || saved) && (
                <div className="mt-6 flex items-center justify-center gap-2 animate-fade-in">
                    {isSaving ? (
                        <>
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            <p className="text-xs text-on-surface-variant font-medium">Listening carefully...</p>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                            <p className="text-xs text-on-surface-variant font-medium">Your feeling has been gently recorded.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Mood;