import { useState, useEffect } from "react";

// Singleton event emitter for progress bar
const progressEvents = new EventTarget();

export const startProgress = () => progressEvents.dispatchEvent(new Event("start"));
export const stopProgress = () => progressEvents.dispatchEvent(new Event("stop"));

export const ProgressBar = () => {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let interval;
        let timeout;

        const handleStart = () => {
            setVisible(true);
            setProgress(0);
            
            // Fast progress to 70%
            setTimeout(() => setProgress(30), 10);
            setTimeout(() => setProgress(50), 100);
            setTimeout(() => setProgress(70), 300);

            // Slow down after 70%
            interval = setInterval(() => {
                setProgress(prev => {
                    const step = Math.max(0.5, (100 - prev) * 0.05);
                    return Math.min(prev + step, 95); // Never quite reach 100% until stop
                });
            }, 300);
        };

        const handleStop = () => {
            clearInterval(interval);
            setProgress(100);
            
            // Hide after transition completes
            timeout = setTimeout(() => {
                setVisible(false);
                setTimeout(() => setProgress(0), 200); // Reset after hidden
            }, 300);
        };

        progressEvents.addEventListener("start", handleStart);
        progressEvents.addEventListener("stop", handleStop);

        return () => {
            progressEvents.removeEventListener("start", handleStart);
            progressEvents.removeEventListener("stop", handleStop);
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    if (!visible && progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-1 z-[9999] pointer-events-none">
            <div 
                className="h-full bg-primary transition-all ease-out"
                style={{ 
                    width: `${progress}%`,
                    opacity: visible ? 1 : 0,
                    transitionDuration: progress === 100 ? '200ms' : '300ms'
                }}
            />
        </div>
    );
};
