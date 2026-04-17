import { useNavigate } from "react-router-dom";
import PageTransitionWrapper from "../components/PageTransitionWrapper";
import AnimatedCard from "../components/AnimatedCard";
import IllustrationContainer from "../components/IllustrationContainer";
import ComfortZoneCard from "../components/ComfortZoneCard";

/**
 * CalmFace — a minimal SVG illustration of a peaceful, meditative face.
 * Closed eyes (gentle upward arcs) and a soft smile.
 * Follows the line-drawn style established in reset.jsx (BreathingFace).
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

function Onboarding() {
    const navigate = useNavigate();

    return (
        <PageTransitionWrapper>
            <div className="bg-surface min-h-screen flex items-center justify-center px-6 vellum-texture relative overflow-hidden">
                {/* Soft decorative blur circles — same pattern as signup */}
                <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none animate-ambient-pulse"></div>
                <div
                    className="absolute bottom-1/4 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none animate-ambient-pulse"
                    style={{ animationDelay: "4s" }}
                ></div>

                <div className="w-full max-w-sm z-10 relative">
                    {/* Progress indicator */}
                    <div className="flex flex-col items-center gap-3 mb-8">
                        <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant/50 font-semibold">
                            Step 1 of 3
                        </p>
                        <div className="flex gap-2">
                            <div className="w-8 h-1 rounded-full bg-primary/60 transition-all"></div>
                            <div className="w-8 h-1 rounded-full bg-outline-variant/30"></div>
                            <div className="w-8 h-1 rounded-full bg-outline-variant/30"></div>
                        </div>
                    </div>

                    {/* Main card */}
                    <AnimatedCard className="text-center" delay={80}>
                        {/* Illustration */}
                        <IllustrationContainer className="mb-6">
                            <CalmFace />
                        </IllustrationContainer>

                        {/* Title */}
                        <h1 className="font-handwriting text-3xl text-primary mb-3">
                            My Comfort Zone
                        </h1>

                        <div className="space-y-4 mb-8 text-left">
                            <ComfortZoneCard
                                step="01"
                                icon="flight_land"
                                title="A place to land"
                                text="Some days are just hard. This is where you don't have to go through it alone."
                                index={0}
                            />
                            <ComfortZoneCard
                                step="02"
                                icon="group"
                                title="Pick your people"
                                text="Add one or two people you feel safe with. A friend, a sibling, anyone who makes you feel okay."
                                index={1}
                            />
                            <ComfortZoneCard
                                step="03"
                                icon="mark_email_unread"
                                title="They get a simple message"
                                text="If you seem to be having a rough time, the people you chose get a short message. Just so they know to reach out."
                                subtext='"They may be going through a difficult emotional phase. Consider checking in."'
                                index={2}
                            />
                            <ComfortZoneCard
                                step="04"
                                icon="lock"
                                title="Your words stay yours"
                                text="Nothing you write here is shared. Not your journal, not your feelings. Nothing. It all stays with you."
                                index={3}
                            />
                            <ComfortZoneCard
                                step="05"
                                icon="volunteer_activism"
                                title="You don't have to ask"
                                text="Sometimes you just want someone to show up without having to explain everything. This helps make that happen."
                                index={4}
                            />
                        </div>

                        {/* CTA */}
                        <button
                            onClick={() => navigate("/safetynet")}
                            className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Begin Setup
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>

                        {/* Skip */}
                        <button
                            onClick={() => navigate("/")}
                            className="w-full py-3 mt-3 text-on-surface-variant/60 text-sm font-medium hover:text-on-surface-variant transition-colors cursor-pointer"
                        >
                            I'll do this later
                        </button>
                    </AnimatedCard>
                </div>
            </div>
        </PageTransitionWrapper>
    );
}

export default Onboarding;
