import React, { useState } from 'react';

function LettingGo() {
    const [thought, setThought] = useState("");
    const [status, setStatus] = useState("idle"); // idle | dissolving | gone

    const handleLetGo = () => {
        if (!thought.trim()) return;
        setStatus("dissolving");
        
        // Wait for dissolve animation (1.5s as per CSS)
        setTimeout(() => {
            setStatus("gone");
            // Automatically return to idle after 4 seconds
            setTimeout(() => {
                setThought("");
                setStatus("idle");
            }, 4000); 
        }, 1500); 
    };

    return (
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-on-surface/5 relative overflow-hidden">
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">water_drop</span>
                Clear Your Mind
            </h2>
            
            {status === "idle" ? (
                <p className="text-sm text-on-surface/70 mb-4 font-body">
                    What is weighing on your mind? Type it below, and when you are ready, release it. It will completely disappear and won't be saved anywhere.
                </p>
            ) : (
                <div className="h-4 mb-4"></div> /* Spacer to prevent jumping */
            )}

            <div className="relative min-h-[140px]">
                {status === "idle" && (
                    <div className="animate-in fade-in duration-500 flex flex-col h-full">
                        <textarea
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                            placeholder="Right now, I am feeling..."
                            className="w-full bg-surface-container text-on-surface rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none h-24 font-body"
                        />
                        <button
                            onClick={handleLetGo}
                            disabled={!thought.trim()}
                            className="mt-3 w-full py-2.5 bg-secondary-container text-on-secondary-container rounded-full text-sm font-semibold hover:shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">air</span>
                            Let it go
                        </button>
                    </div>
                )}

                {status === "dissolving" && (
                    <div className="w-full bg-surface-container text-on-surface rounded-lg p-4 text-sm h-24 font-body animate-dissolve border-transparent pointer-events-none absolute top-0 left-0">
                        {thought}
                    </div>
                )}

                {status === "gone" && (
                    <div className="animate-in fade-in zoom-in-95 duration-1000 flex flex-col items-center justify-center h-full absolute inset-0">
                        <span className="material-symbols-outlined text-primary/40 text-[40px] font-light mb-2">
                            spa
                        </span>
                        <p className="font-headline italic text-on-surface/80 text-xl">
                            It has passed.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LettingGo;
