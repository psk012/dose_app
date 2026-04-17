import { useNavigate } from "react-router-dom";
import PageTransitionWrapper from "../components/PageTransitionWrapper";
import AnimatedCard from "../components/AnimatedCard";
import IllustrationContainer from "../components/IllustrationContainer";

/**
 * CalmFace — same peaceful face as onboarding, but wrapped with
 * IllustrationContainer's breathing prop for a slow, living pulse.
 */
function CalmFace() {
    return (
        <div className="w-28 h-28 rounded-full bg-primary-container/50 flex items-center justify-center border border-primary-fixed-dim/15 shadow-sm">
            <svg viewBox="0 0 120 120" className="w-[4.5rem] h-[4.5rem]">
                {/* Left eye — peaceful closed arc */}
                <path
                    d="M32,50 Q40,43 48,50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-on-surface/45"
                />
                {/* Right eye — peaceful closed arc */}
                <path
                    d="M72,50 Q80,43 88,50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-on-surface/45"
                />
                {/* Gentle smile */}
                <path
                    d="M46,76 Q60,84 74,76"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-on-surface/45"
                />
            </svg>
        </div>
    );
}

function SetupComplete() {
    const navigate = useNavigate();

    return (
        <PageTransitionWrapper>
            <div className="bg-surface min-h-screen flex items-center justify-center px-6 vellum-texture relative overflow-hidden">
                {/* Soft decorative blur circles with ambient pulse */}
                <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none animate-ambient-pulse"></div>
                <div
                    className="absolute bottom-1/4 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none animate-ambient-pulse"
                    style={{ animationDelay: "4s" }}
                ></div>

                <div className="w-full max-w-sm z-10 relative">
                    <AnimatedCard className="text-center">
                        {/* Illustration — breathing animation active */}
                        <IllustrationContainer breathing className="mb-8">
                            <CalmFace />
                        </IllustrationContainer>

                        {/* Message */}
                        <h1 className="font-handwriting text-3xl text-primary mb-2">
                            Breathe.
                        </h1>
                        <p className="font-headline italic text-on-surface-variant/70 text-base leading-relaxed mb-8">
                            You've done well today.
                        </p>

                        {/* CTA */}
                        <button
                            onClick={() => navigate("/")}
                            className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Done
                            <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                    </AnimatedCard>
                </div>
            </div>
        </PageTransitionWrapper>
    );
}

export default SetupComplete;
