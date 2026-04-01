import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const location = useLocation();
    const [isHovered, setIsHovered] = useState(false);
    
    // We only auto-hide the navbar when we are NOT on the home page
    const isHomePage = location.pathname === "/";
    const shouldHide = !isHomePage && !isHovered;

    const links = [
        { path: "/", label: "Home", icon: "home" },
        { path: "/reset", label: "Reset", icon: "self_improvement" },
        { path: "/journal", label: "Journal", icon: "edit_note" },
        { path: "/focus", label: "Focus", icon: "timer" },
        { path: "/insights", label: "Insights", icon: "insights" },
    ];

    return (
        <div 
            className="fixed bottom-6 left-0 right-0 w-full z-50 flex justify-center px-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* The Trigger Icon (appears when navbar is hidden) */}
            <div className={`pointer-events-auto absolute bottom-0 flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-lowest/40 backdrop-blur-sm border border-outline-variant/20 text-on-surface-variant/30 transition-all duration-700 ease-spring ${shouldHide ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-50 pointer-events-none'}`}>
                <span className="material-symbols-outlined text-2xl">menu</span>
            </div>

            {/* The Floating Navbar */}
            <nav className={`pointer-events-auto w-full max-w-[22rem] bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/40 rounded-[2rem] px-2 py-2.5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] transition-all duration-500 ease-spring ${shouldHide ? 'opacity-0 translate-y-12 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100'}`}>
                <div className="flex justify-between items-center gap-1 w-full">
                    {links.map(({ path, label, icon }) => {
                        const isActive = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`flex flex-col items-center justify-center min-w-[56px] rounded-2xl p-1.5 transition-all duration-300 ease-spring ${
                                    isActive
                                        ? "text-primary scale-105"
                                        : "text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high/50"
                                }`}
                            >
                                <div className={`flex items-center justify-center w-11 h-8 rounded-full mb-1 transition-all ${isActive ? 'bg-primary-container/80' : 'bg-transparent'}`}>
                                    <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                        {icon}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default Navbar;