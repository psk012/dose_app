import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { logFocusSession } from "../api/api";
import AmbientAudio, { AUDIO_TRACKS } from "./ambientAudio";

// Realistic SVG Lotus flower that blooms organically
function LotusFlower({ progress }) {
    // Defines the precise petals of the lotus. 
    // M = start base. Q = cubic bezier curve up left side and right side to a pointed tip.
    const petals = [
        // Back petals (outermost layer, bloom early)
        { id: 'bL', color: '#7c9a92', maxRotate: -70, delay: 0 },
        { id: 'bR', color: '#7c9a92', maxRotate: 70, delay: 0 },
        // Mid-back petals
        { id: 'mL2', color: '#aecdc4', maxRotate: -50, delay: 0.15 },
        { id: 'mR2', color: '#aecdc4', maxRotate: 50, delay: 0.15 },
        // Mid-front petals
        { id: 'mL', color: '#cae9e0', maxRotate: -30, delay: 0.3 },
        { id: 'mR', color: '#cae9e0', maxRotate: 30, delay: 0.3 },
        // Front inner petals
        { id: 'fL', color: '#eabcb3', maxRotate: -15, delay: 0.45 },
        { id: 'fR', color: '#eabcb3', maxRotate: 15, delay: 0.45 },
        // Center pod (base bloom)
        { id: 'c',  color: '#ffdad3', maxRotate: 0, delay: 0.6 },
    ];

    return (
        <svg viewBox="0 0 200 200" className="w-56 h-56 drop-shadow-lg animate-float">
            {/* Background Breathe Glow */}
            <circle
                cx="100" cy="100" r="50"
                fill="none" stroke="#cae9e0" strokeWidth="1"
                className="animate-breathe origin-center"
                opacity={0.3 + progress * 0.2}
            />

            {/* Organic Water Ripples */}
            <ellipse 
                cx="100" cy="165" 
                rx={20 + 70 * progress} ry={5 + 15 * progress} 
                fill="none" stroke="#aecdc4" strokeWidth="1.5" 
                opacity={(1 - progress) * 0.8} 
            />
            <ellipse 
                cx="100" cy="165" 
                rx={10 + 40 * progress} ry={2 + 8 * progress} 
                fill="none" stroke="#7c9a92" strokeWidth="1" 
                opacity={(1 - progress) * 0.5 + 0.2} 
            />

            {/* The Blooming Petals */}
            {petals.map((petal) => {
                // Calculate individual petal bloom timing
                const p = Math.max(0, Math.min(1, (progress - petal.delay) / (1 - petal.delay + 0.001)));
                // Cubic ease-out for organic slowing effect
                const bloom = 1 - Math.pow(1 - p, 3);
                
                // Outer petals open wide, inner stay closer
                const rotate = petal.maxRotate * bloom;
                // Petals scale up slightly as they open
                const scale = 0.6 + 0.4 * bloom;
                // Opacity fades in slightly during rotation
                const opacity = 0.85 + 0.15 * bloom;

                return (
                    <path
                        key={petal.id}
                        // Organic tear-drop petal pointing up from base (100, 160) to tip (100, 50)
                        d="M 100 160 Q 60 100, 100 50 Q 140 100, 100 160 Z"
                        fill={petal.color}
                        opacity={opacity}
                        style={{
                            transformOrigin: "100px 160px",
                            transform: `rotate(${rotate}deg) scale(${scale})`,
                            transition: "transform 1s ease-out, opacity 1s ease-out",
                        }}
                    />
                );
            })}

            {/* Glowing inner pollen/center that ignites at the end */}
            <circle
                cx="100" cy="140"
                r={8 * Math.max(0, (progress - 0.7) / 0.3)}
                fill="#ffffff"
                className="drop-shadow-md"
                opacity={0.9}
            />
            <circle
                cx="100" cy="140"
                r={16 * Math.max(0, (progress - 0.7) / 0.3)}
                fill="#ffdad3"
                className="blur-md"
                opacity={0.6}
            />

        </svg>
    );
}

function Focus() {
    const { token } = useAuth();

    // Timer settings
    const [workMinutes, setWorkMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [audioTrackId, setAudioTrackId] = useState("none");

    // Timer state
    const [mode, setMode] = useState("idle"); // idle | working | break | complete
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [showSettings, setShowSettings] = useState(false);

    const intervalRef = useRef(null);
    const ambientRef = useRef(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Timer countdown
    useEffect(() => {
        if (mode !== "working" && mode !== "break") return;

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    if (mode === "working") {
                        handleWorkComplete();
                    } else {
                        handleBreakComplete();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [mode]);

    function startWork() {
        const totalSeconds = workMinutes * 60;
        setTimeLeft(totalSeconds);
        setTotalTime(totalSeconds);
        setMode("working");
        // Trigger audio from user gesture (tap) — required for mobile browsers
        if (ambientRef.current) ambientRef.current.userPlay();
    }

    async function handleWorkComplete() {
        // Log session to backend
        try {
            await logFocusSession(token, workMinutes, breakMinutes);
        } catch (err) {
            console.error("Failed to log session:", err);
        }

        // Start break
        const breakSeconds = breakMinutes * 60;
        setTimeLeft(breakSeconds);
        setTotalTime(breakSeconds);
        setMode("break");
    }

    function handleBreakComplete() {
        setMode("complete");
    }

    function resetTimer() {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setMode("idle");
        setTimeLeft(0);
        setTotalTime(0);
        if (ambientRef.current) ambientRef.current.userStop();
    }

    // Progress calculation
    const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0;

    // Format time display
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    return (
        <div className="bg-surface-container-lowest rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                    Focus Session
                </h2>
                {mode === "idle" && (
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">tune</span>
                    </button>
                )}
            </div>

            {/* Settings panel */}
            {showSettings && mode === "idle" && (
                <div className="bg-surface-container-low rounded-xl p-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-on-surface">Work duration</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setWorkMinutes(prev => prev <= 5 ? Math.max(1, prev - 1) : prev - 5)}
                                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-outline-variant transition-colors cursor-pointer"
                            >
                                −
                            </button>
                            <span className="w-12 text-center font-semibold text-on-surface">
                                {workMinutes}m
                            </span>
                            <button
                                onClick={() => setWorkMinutes(prev => prev < 5 ? prev + 1 : Math.min(120, prev + 5))}
                                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-outline-variant transition-colors cursor-pointer"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-on-surface">Break duration</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setBreakMinutes(prev => prev <= 1 ? 0.25 : Math.max(1, prev - 1))}
                                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-outline-variant transition-colors cursor-pointer"
                            >
                                −
                            </button>
                            <span className="w-12 text-center font-semibold text-on-surface">
                                {breakMinutes < 1 ? breakMinutes * 60 + 's' : breakMinutes + 'm'}
                            </span>
                            <button
                                onClick={() => setBreakMinutes(prev => prev < 1 ? 1 : Math.min(30, prev + 1))}
                                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-outline-variant transition-colors cursor-pointer"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-on-surface">Ambient noise</label>
                        <select
                            value={audioTrackId}
                            onChange={(e) => setAudioTrackId(e.target.value)}
                            className="bg-surface-container-high hover:bg-outline-variant transition-colors text-on-surface rounded-full px-3 py-1 text-sm outline-none cursor-pointer"
                        >
                            {AUDIO_TRACKS.map(track => (
                                <option key={track.id} value={track.id}>{track.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <AmbientAudio ref={ambientRef} isPlaying={mode === "working"} trackId={audioTrackId} />

            {/* Idle state */}
            {mode === "idle" && (
                <div className="flex flex-col items-center py-6 space-y-4">
                    <LotusFlower progress={0} />
                    <p className="font-headline italic text-on-surface-variant text-sm">
                        {workMinutes} min work · {breakMinutes < 1 ? breakMinutes * 60 + ' sec' : breakMinutes + ' min'} break
                    </p>
                    <button
                        onClick={startWork}
                        className="px-8 py-3 bg-primary-container text-on-primary-container rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                        Start Focus
                    </button>
                </div>
            )}

            {/* Working state */}
            {mode === "working" && (
                <div className="flex flex-col items-center py-4 space-y-4">
                    <LotusFlower progress={progress} />
                    <div className="text-center">
                        <p className="font-handwriting text-5xl text-on-surface mb-1">
                            {timeDisplay}
                        </p>
                        <p className="font-headline italic text-primary text-sm">
                            Growing your lotus...
                        </p>
                    </div>
                    <button
                        onClick={resetTimer}
                        className="px-6 py-2 rounded-full border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Break state */}
            {mode === "break" && (
                <div className="flex flex-col items-center py-4 space-y-4">
                    <LotusFlower progress={1} />
                    <div className="text-center">
                        <p className="font-handwriting text-5xl text-on-surface mb-1">
                            {timeDisplay}
                        </p>
                        <p className="font-headline italic text-tertiary text-sm">
                            Break time — stretch & breathe
                        </p>
                    </div>
                    <button
                        onClick={resetTimer}
                        className="px-6 py-2 rounded-full border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                        Skip Break
                    </button>
                </div>
            )}

            {/* Complete state */}
            {mode === "complete" && (
                <div className="flex flex-col items-center py-6 space-y-4">
                    <LotusFlower progress={1} />
                    <div className="text-center space-y-1">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                        </span>
                        <p className="font-handwriting text-3xl text-on-surface">
                            Session complete!
                        </p>
                        <p className="font-headline italic text-on-surface-variant text-sm">
                            Your lotus has bloomed 🌸
                        </p>
                    </div>
                    <button
                        onClick={resetTimer}
                        className="px-8 py-3 bg-primary-container text-on-primary-container rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">replay</span>
                        Start Another
                    </button>
                </div>
            )}
        </div>
    );
}

export default Focus;
