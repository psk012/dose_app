import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const location = useLocation();

    const links = [
        { path: "/", label: "Home", icon: "home" },
        { path: "/focus", label: "Focus", icon: "timer" },
        { path: "/tasks", label: "Tasks", icon: "checklist" },
        { path: "/reset", label: "Reset", icon: "self_improvement" },
        { path: "/journal", label: "Journal", icon: "edit_note" },
    ];

    return (
        <nav className="flex md:flex-col mb-6 md:mb-0 bg-surface-container-lowest rounded-full md:rounded-3xl p-1.5 shadow-sm w-full md:w-56 md:sticky md:top-8 overflow-x-auto md:overflow-visible gap-1 md:gap-2 shrink-0 border border-outline-variant/30">
            {links.map(({ path, label, icon }) => {
                const isActive = location.pathname === path;
                return (
                    <Link
                        key={path}
                        to={path}
                        className={`flex-1 md:flex-none min-w-0 flex items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                            isActive
                                ? "bg-primary-container text-on-primary-container shadow-sm md:shadow-md"
                                : "text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg md:text-xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {icon}
                        </span>
                        <span className="hidden sm:inline md:block">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default Navbar;