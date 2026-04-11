import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    
    // Auto-open on home page, otherwise state-controlled
    const isHomePage = location.pathname === "/";
    const showFullNavbar = isHomePage || isOpen;

    const links = [
        { path: "/", label: "Home", icon: "home" },
        { path: "/reset", label: "Reset", icon: "self_improvement" },
        { path: "/journal", label: "Journal", icon: "edit_note" },
        { path: "/focus", label: "Focus", icon: "timer" },
        { path: "/insights", label: "Insights", icon: "insights" },
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 w-full z-50 flex justify-center px-4 pointer-events-none">
            <div 
                className="relative flex justify-center w-full max-w-[23rem]"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                {/* The Trigger Button (Visible when collapsed) */}
                <button 
                    onClick={() => setIsOpen(true)}
                    className={`pointer-events-auto absolute bottom-0 flex items-center justify-center w-14 h-14 rounded-full bg-surface-container-highest shadow-lg border border-primary/20 text-primary transition-all duration-500 ease-spring cursor-pointer ${!showFullNavbar ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-50 pointer-events-none'}`}
                >
                    <span className="material-symbols-outlined text-3xl">menu</span>
                </button>

                {/* The Floating Navbar */}
                <nav 
                    onClick={(e) => e.stopPropagation()}
                    className={`pointer-events-auto w-full bg-surface-container-lowest/90 backdrop-blur-2xl border border-outline-variant/50 rounded-[2.5rem] p-2 shadow-2xl transition-all duration-500 ease-spring ${!showFullNavbar ? 'opacity-0 translate-y-12 scale-90 pointer-events-none' : 'opacity-100 translate-y-0 scale-100'}`}
                >
                    <div className="flex justify-between items-center gap-1 w-full relative">
                        {links.map(({ path, label, icon }) => {
                            const isActive = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex flex-col items-center justify-center min-w-[60px] rounded-2xl py-2 transition-all duration-300 cursor-pointer ${
                                        isActive
                                            ? "text-primary scale-110"
                                            : "text-on-surface-variant/70 hover:text-on-surface"
                                    }`}
                                >
                                    <div className={`flex items-center justify-center w-12 h-9 rounded-full mb-1 transition-all ${isActive ? 'bg-primary-container' : 'bg-transparent'}`}>
                                        <span className="material-symbols-outlined text-[24px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                            {icon}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-tight uppercase ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                        {label}
                                    </span>
                                </Link>
                            );
                        })}
                        
                        {/* Close logic for toggle UI (only show when not on homepage) */}
                        {!isHomePage && (
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="absolute -top-12 right-2 w-8 h-8 rounded-full bg-surface-container-high/50 backdrop-blur-md flex items-center justify-center text-on-surface-variant/50 hover:text-error transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default Navbar;