const BreathingFace = ({ phase, isRunning }) => {
    // Ultra-soft Phase Configs for the 'Manas' Breathing Guide
    const config = {
        inhale: {
            eyePath: "M35,45 A6,6 0 1,1 45,45 A6,6 0 1,1 35,45 M75,45 A6,6 0 1,1 85,45 A6,6 0 1,1 75,45", // Wide curious eyes
            mouthPath: "M55,80 Q60,70 65,80 Q60,90 55,80", // Small 'o' shape
            color: "bg-primary-container",
            scale: "scale-[1.35]"
        },
        hold: {
            eyePath: "M30,45 Q40,35 50,45 M70,45 Q80,35 90,45", // Relaxed peaceful arcs
            mouthPath: "M50,80 L70,80", // Small peaceful hold line
            color: "bg-primary-container/90",
            scale: "scale-[1.35]"
        },
        exhale: {
            eyePath: "M30,45 Q40,35 50,45 M70,45 Q80,35 90,45", // Relaxed peaceful arcs
            mouthPath: "M40,75 Q60,82 80,75", // Gentle soft smile
            color: "bg-secondary-container/40",
            scale: "scale-[0.75]"
        },
        idle: {
            eyePath: "M30,45 Q40,35 50,45 M70,45 Q80,35 90,45",
            mouthPath: "M45,80 L75,80",
            color: "bg-surface-container-high",
            scale: "scale-100"
        }
    };

    const currentType = !isRunning ? "idle" : (phase === "Breathe In" ? "inhale" : (phase === "Hold" ? "hold" : "exhale"));
    const current = config[currentType];

    return (
        <div className={`relative transition-all duration-[3900ms] ease-in-out ${current.scale}`}>
            {/* Glowing Aura Expansion */}
            <div className={`absolute inset-[-40px] rounded-full blur-3xl transition-all duration-[3900ms] ease-in-out ${
                currentType === 'inhale' || currentType === 'hold' ? 'bg-primary/25 scale-125' : 'bg-secondary/0 scale-0'
            }`}></div>
            
            {/* Face Background */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-[3900ms] ease-in-out shadow-inner border border-outline-variant/5 animate-breathe ${current.color}`}>
                <svg viewBox="0 0 120 120" className="w-24 h-24">
                    <g className="animate-blink origins-center">
                        <path 
                            d={current.eyePath} 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            className="text-on-surface/60 transition-all duration-[3900ms] ease-in-out"
                        />
                    </g>
                    <path 
                        d={current.mouthPath} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        className="text-on-surface/60 transition-all duration-[3900ms] ease-in-out"
                    />
                </svg>
            </div>
        </div>
    );
};

function Reset({ isRunning, timeLeft, phase, startReset }) {
    return (
        <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-[2rem] p-8 border border-outline-variant/30 shadow-sm transition-all text-center">
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-8">
                Breath is the bridge
            </h2>

            {!isRunning ? (
                <div className="space-y-8 animate-fade-in">
                    <BreathingFace isRunning={false} />
                    <button
                        onClick={startReset}
                        className="w-full h-14 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">self_improvement</span>
                        Start 36-sec Reset
                    </button>
                    <p className="text-sm text-on-surface-variant font-handwriting leading-relaxed">
                        Follow the guide slowly; inhale softly, hold with peace, and exhale everything; three cycles to reclaim your center.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center py-4 space-y-12">
                    <BreathingFace isRunning={true} phase={phase} />

                    <div className="space-y-2">
                        <p className="font-handwriting italic text-3xl text-primary transition-all duration-1000">
                            {phase}
                        </p>
                        <p className="font-handwriting text-5xl text-on-surface tabular-nums">
                            {timeLeft}s
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reset;