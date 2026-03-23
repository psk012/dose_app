import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../api/api";

function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please enter both email and password");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await signupUser(email, password);
            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSignup();
    };

    return (
        <div className="bg-surface min-h-screen flex items-center justify-center px-6 vellum-texture relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>

            <div className="w-full max-w-sm space-y-8 z-10 relative">
                {/* Branding */}
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">spa</span>
                        </div>
                        <span className="font-headline italic text-lg text-primary">The Living Journal</span>
                    </div>
                    <h1 className="font-handwriting text-4xl text-primary">Start your journey</h1>
                    <p className="font-headline italic text-on-surface-variant/80 text-sm">
                        Create a space for your thoughts.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5 block">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div>
                        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5 block">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Minimum 6 characters"
                            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-error-container/30 border border-error/20 rounded-xl px-4 py-3">
                        <span className="material-symbols-outlined text-error text-lg">error</span>
                        <p className="text-on-error-container text-sm">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {loading ? "Creating account..." : "Create Account"}
                    {!loading && <span className="material-symbols-outlined">person_add</span>}
                </button>

                <p className="text-center text-sm text-on-surface-variant/70">
                    Already have an account?{" "}
                    <span
                        className="text-primary font-semibold cursor-pointer hover:underline"
                        onClick={() => navigate("/login")}
                    >
                        Sign in
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Signup;