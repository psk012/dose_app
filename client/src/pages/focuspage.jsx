import Focus from "../components/focus";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";

function FocusPage() {
    const { logout } = useAuth();

    return (
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute top-1/2 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>

            <div className="relative max-w-lg md:max-w-5xl lg:max-w-7xl mx-auto px-6 py-8 md:py-12">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-fixed text-xl">spa</span>
                        </div>
                        <span className="font-headline italic text-lg text-on-primary-fixed">The Living Journal</span>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-on-surface/20 text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Logout
                    </button>
                </header>

                <div className="flex flex-col md:flex-row md:items-start gap-0 md:gap-8">
                    <Navbar />

                    <div className="flex-1 w-full max-w-3xl mx-auto md:mx-0">
                        {/* Page heading */}
                        <div className="mb-6">
                            <h1 className="font-handwriting text-5xl text-on-surface leading-tight mb-2">
                                Deep focus
                            </h1>
                            <p className="font-headline italic text-on-surface/70">
                                Grow your lotus, while you focus.
                            </p>
                        </div>

                        <Link
                            to="/"
                            className="inline-flex items-center gap-1 text-on-surface-variant text-sm font-medium hover:text-primary transition-colors mb-6"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Back to Dashboard
                        </Link>

                        <Focus />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FocusPage;
