import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";
import manasLogo from "../assets/manas-logo.png";

function Home() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showResetPrompt, setShowResetPrompt] = useState(false);

    useEffect(() => {
        if (!sessionStorage.getItem("hasSeenResetPrompt")) {
            setShowResetPrompt(true);
            sessionStorage.setItem("hasSeenResetPrompt", "true");
        }
    }, []);

    return (
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden pb-24">
            {/* Reset Prompt Modal */}
            {showResetPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md transition-opacity">
                    <div className="bg-surface-container-lowest max-w-sm w-full rounded-[32px] p-8 shadow-2xl border border-outline-variant/30 text-center relative overflow-hidden animate-spring-up">
                        <div className="w-16 h-16 rounded-full bg-primary-container/50 text-primary flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">self_improvement</span>
                        </div>
                        <h2 className="font-handwriting text-4xl text-on-surface mb-2">Take a breath?</h2>
                        <p className="text-on-surface-variant/80 text-sm mb-8 leading-relaxed">
                            Would you like to start your session with a 30-second breathing exercise to center yourself?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => navigate("/reset")}
                                className="w-full bg-primary-container text-on-primary-container rounded-full py-3.5 font-bold hover:shadow-md transition-all active:scale-95"
                            >
                                Yes, let's breathe
                            </button>
                            <button 
                                onClick={() => setShowResetPrompt(false)}
                                className="w-full bg-transparent text-on-surface-variant rounded-full py-3.5 font-medium border border-outline-variant/50 hover:bg-surface-container-high transition-all active:scale-95"
                            >
                                Not right now
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute top-1/2 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>

            <div className="relative max-w-lg md:max-w-2xl mx-auto px-6 py-8 md:py-12">
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-2">
                        <img src={manasLogo} alt="Manas" className="w-9 h-9 rounded-lg object-cover shadow-sm" />
                        <span className="text-xl text-on-primary-fixed drop-shadow-sm" style={{ fontFamily: "'Nusrat', serif" }}>Manas</span>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-on-surface/10 text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer backdrop-blur-sm"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Logout
                    </button>
                </header>

                {/* Greeting */}
                <div className="mb-14 text-center md:text-left">
                    <h1 className="font-handwriting text-5xl md:text-6xl text-on-surface leading-tight mb-3">
                        Hello, beautiful soul.
                    </h1>
                    <p className="font-headline text-lg italic text-on-surface-variant/80">
                        What does your mind need right now?
                    </p>
                </div>

                {/* Menu Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={() => navigate("/clear-mind")}
                        className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 p-6 bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-primary-container/50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl">air</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-on-surface text-lg">Clear Mind</h3>
                            <p className="text-sm text-on-surface-variant/80 mt-1">An instant emotional dump. Not saved.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => navigate("/journal")}
                        className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 p-6 bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-tertiary-container/50 text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                            <span className="material-symbols-outlined text-2xl">edit_note</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-on-surface text-lg">Journal</h3>
                            <p className="text-sm text-on-surface-variant/80 mt-1">Reflect on your thoughts safely.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => navigate("/focus")}
                        className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 p-6 bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-secondary-container/50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                            <span className="material-symbols-outlined text-2xl">self_improvement</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-on-surface text-lg">Focus Mode</h3>
                            <p className="text-sm text-on-surface-variant/80 mt-1">Deep work and mindful productivity.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => navigate("/insights")}
                        className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 p-6 bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-error-container/50 text-error flex items-center justify-center group-hover:bg-error group-hover:text-on-error transition-colors">
                            <span className="material-symbols-outlined text-2xl">favorite</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-on-surface text-lg">Mood Check</h3>
                            <p className="text-sm text-on-surface-variant/80 mt-1">Log your feelings and view insights.</p>
                        </div>
                    </button>
                </div>

                <Navbar />
            </div>
        </div>
    );
}

export default Home;
