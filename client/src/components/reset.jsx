function Reset({ isRunning, timeLeft, phase, startReset }) {
    return (
        <div className="bg-surface-container-lowest rounded-xl p-5">
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-4">
                Need a quick reset?
            </h2>

            {!isRunning ? (
                <button
                    onClick={startReset}
                    className="w-full h-12 bg-primary-container text-on-primary-container rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">self_improvement</span>
                    Start 30-sec Reset
                </button>
            ) : (
                <div className="flex flex-col items-center py-6 space-y-4">
                    {/* Breathing circle */}
                    <div className="relative">
                        <div
                            className={`w-28 h-28 rounded-full bg-primary-container/60 transition-all duration-1000 ease-in-out flex items-center justify-center ${
                                phase === "Breathe In" ? "scale-125" : "scale-75"
                            }`}
                        >
                            <div
                                className={`w-20 h-20 rounded-full bg-primary-container transition-all duration-1000 ease-in-out flex items-center justify-center ${
                                    phase === "Breathe In" ? "scale-110" : "scale-90"
                                }`}
                            >
                                <span className="material-symbols-outlined text-on-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    spa
                                </span>
                            </div>
                        </div>
                        {/* Ring glow */}
                        <div className={`absolute inset-0 rounded-full bg-primary-container/20 blur-xl transition-all duration-1000 ${
                            phase === "Breathe In" ? "scale-150" : "scale-75"
                        }`}></div>
                    </div>

                    <p className="font-headline italic text-xl text-primary">
                        {phase}
                    </p>
                    <p className="font-handwriting text-4xl text-on-surface">
                        {timeLeft}s
                    </p>
                </div>
            )}
        </div>
    );
}

export default Reset;