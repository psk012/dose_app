import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";
import manasLogo from "../assets/manas-logo.png";

const featureCards = [
    {
        title: "Brain dump",
        caption: "Let out everything on your mind. It disappears instantly.",
        icon: "air",
        route: "/clear-mind",
        iconClass: "bg-primary-container/50 text-primary group-hover:bg-primary group-hover:text-on-primary",
    },
    {
        title: "Journal",
        caption: "A space to understand yourself.",
        icon: "edit_note",
        route: "/journal",
        iconClass: "bg-tertiary-container/50 text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary",
    },
    {
        title: "Focus Mode",
        caption: "Sshhh... Focus😇",
        icon: "self_improvement",
        route: "/focus",
        iconClass: "bg-secondary-container/50 text-secondary group-hover:bg-secondary group-hover:text-on-secondary",
    },
    {
        title: "Mood Check",
        caption: "Pause. Check in with yourself.",
        icon: "favorite",
        route: "/insights",
        iconClass: "bg-error-container/50 text-error group-hover:bg-error group-hover:text-on-error",
    },
    {
        title: "My Comfort Zone",
        caption: "You don't have to go through this alone.",
        icon: "shield_with_heart",
        route: "/comfort-zone",
        iconClass: "bg-secondary-container/50 text-secondary group-hover:bg-secondary group-hover:text-on-secondary",
        wide: true,
    },
];

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
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden pb-36">
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

            <div className="relative max-w-lg md:max-w-2xl mx-auto px-6 py-8 md:py-12 animate-spring-up">
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
                    <h1 className="font-handwriting text-5xl md:text-6xl text-on-surface leading-[1.1] mb-2">
                        Hello, beautiful soul.
                    </h1>
                    <p className="font-handwriting text-xl text-on-surface-variant/70 italic">
                        What does your mind need right now?
                    </p>
                </div>

                {/* Menu Options */}
                <section aria-labelledby="support-options" className="space-y-5">
                    <div className="text-center sm:text-left px-2">
                        <h2 id="support-options" className="text-3xl md:text-4xl font-handwriting text-on-surface leading-tight">
                            Take a moment. What do you need right now?
                        </h2>
                        <p className="mt-1 font-handwriting text-lg text-on-surface-variant/60">
                            You don't have to do everything at once.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {featureCards.map((card) => (
                            <button
                                key={card.title}
                                onClick={() => navigate(card.route)}
                                className={`group flex min-h-40 flex-col items-center sm:items-start text-center sm:text-left gap-4 p-6 bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.12)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${card.wide ? "sm:col-span-2" : ""}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${card.iconClass}`}>
                                    <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-handwriting font-bold text-on-surface leading-tight">{card.title}</h3>
                                    <p className="mt-1 text-sm text-on-surface-variant/60 leading-relaxed">{card.caption}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <Navbar />
            </div>
        </div>
    );
}

export default Home;
