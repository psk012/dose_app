import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import manasBanner from "../assets/manas-banner.png";

function Welcome() {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Stagger entrance animation
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="bg-surface min-h-screen flex items-center justify-center px-6 vellum-texture relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-secondary-container/8 rounded-full blur-3xl pointer-events-none"></div>

            <div
                className={`w-full max-w-sm z-10 relative transition-all duration-700 ease-out ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
            >
                {/* Branding */}
                <div className="text-center space-y-4 mb-12">
                    <img
                        src={manasBanner}
                        alt="Manas"
                        className="w-60 mx-auto mb-2 drop-shadow-sm"
                    />
                    <p className="font-headline italic text-on-surface-variant/70 text-sm leading-relaxed">
                        your mind, your space.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4">
                    {/* Primary: Sign Up */}
                    <button
                        id="welcome-signup-btn"
                        onClick={() => navigate("/signup")}
                        className="group w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                        Get Started
                        <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:translate-x-1">
                            arrow_forward
                        </span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-outline-variant/40"></div>
                        <span className="text-xs text-on-surface-variant/50 font-label uppercase tracking-widest">
                            or
                        </span>
                        <div className="flex-1 h-px bg-outline-variant/40"></div>
                    </div>

                    {/* Secondary: Login */}
                    <button
                        id="welcome-login-btn"
                        onClick={() => navigate("/login")}
                        className="group w-full h-14 bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-full font-semibold text-base hover:bg-surface-container hover:border-primary/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                        I already have an account
                        <span className="material-symbols-outlined text-xl text-primary transition-transform duration-300 group-hover:translate-x-1">
                            login
                        </span>
                    </button>
                </div>

                {/* Footer tagline */}
                <p className="text-center text-xs text-on-surface-variant/40 mt-10 font-headline italic">
                    begin your journey of self-awareness ✨
                </p>
            </div>
        </div>
    );
}

export default Welcome;
