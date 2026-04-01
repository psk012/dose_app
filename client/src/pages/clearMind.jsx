import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function ClearMind() {
    const [text, setText] = useState("");
    const [isReleasing, setIsReleasing] = useState(false);
    const navigate = useNavigate();

    const handleRelease = () => {
        if (!text.trim()) return;
        setIsReleasing(true);
        setTimeout(() => {
            setText("");
            setIsReleasing(false);
            // Optionally navigate back home
            // navigate("/");
        }, 1500);
    };

    return (
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden pb-24">
            <div className="max-w-md mx-auto px-6 py-8 md:py-12 flex flex-col min-h-[calc(100vh-6rem)]">
                <header className="mb-8 flex items-center justify-between">
                    <button 
                        onClick={() => navigate("/")}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="font-handwriting text-3xl text-on-surface">Clear Mind</h1>
                    <div className="w-10"></div>
                </header>

                <div className="flex-1 flex flex-col justify-center relative">
                    <p className="text-on-surface-variant/80 text-center mb-6 text-sm font-medium">
                        Write down whatever is weighing on you. <br/>When you click "Let Go", it disappears forever.
                    </p>

                    <div className={`relative transition-all duration-1000 ${isReleasing ? 'opacity-0 scale-95 blur-xl -translate-y-8' : 'opacity-100 scale-100 blur-0 translate-y-0'}`}>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="I feel..."
                            className="w-full h-64 bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/50 rounded-3xl p-6 text-on-surface placeholder:text-on-surface-variant/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary-container shadow-sm transition-all text-lg"
                        />
                    </div>
                </div>

                <div className={`mt-8 transition-opacity duration-300 ${isReleasing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <button
                        onClick={handleRelease}
                        disabled={!text.trim()}
                        className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Let Go
                        <span className="material-symbols-outlined text-lg">air</span>
                    </button>
                </div>
            </div>
            <Navbar />
        </div>
    );
}

export default ClearMind;
