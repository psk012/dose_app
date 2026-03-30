import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp, signupUser } from "../api/api";
import manasBanner from "../assets/manas-banner.png";

function Signup() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
    
    // Form States
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [signupToken, setSignupToken] = useState("");
    
    // UI States
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(180);
    const [canResend, setCanResend] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let interval;
        if (step === 2 && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer]);

    const handleSendOtp = async () => {
        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await sendOtp(email);
            setStep(2);
            setResendTimer(180);
            setCanResend(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 4) {
            setError("Please enter a valid 4-digit OTP");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const data = await verifyOtp(email, otp);
            setSignupToken(data.signupToken);
            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!isPasswordValid) {
            setError("Please meet all password requirements");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await signupUser(email, password, signupToken);
            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e, callback) => {
        if (e.key === "Enter") {
            if (!loading) callback();
        }
    };

    // Password Validation Specs
    const hasMinLength = password.length >= 6;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

    return (
        <div className="bg-surface min-h-screen flex items-center justify-center px-6 vellum-texture relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>

            <div className="w-full max-w-sm space-y-8 z-10 relative">
                <div className="text-center space-y-3">
                    <img src={manasBanner} alt="Manas" className="w-56 mx-auto mb-4 drop-shadow-sm" />
                    <h1 className="font-handwriting text-4xl text-primary">Start your journey</h1>
                    <p className="font-headline italic text-on-surface-variant/80 text-sm">
                        {step === 1 && "Create a space for your thoughts."}
                        {step === 2 && `Enter the secure code sent to ${email}`}
                        {step === 3 && "Secure your new account with a strong password."}
                    </p>
                </div>

                <div className="space-y-4">
                    {/* STEP 1: Email */}
                    {step === 1 && (
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
                                onKeyDown={(e) => handleKeyDown(e, handleSendOtp)}
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* STEP 2: OTP */}
                    {step === 2 && (
                        <div>
                            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5 block">
                                4-Digit OTP
                            </label>
                            <input
                                type="text"
                                maxLength="4"
                                placeholder="0000"
                                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface text-center tracking-widest text-xl placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow digits
                                onKeyDown={(e) => handleKeyDown(e, handleVerifyOtp)}
                                disabled={loading}
                            />
                            
                            <div className="flex justify-between items-center mt-3">
                                <p onClick={() => setStep(1)} className="text-xs text-primary cursor-pointer hover:underline">Change Email?</p>
                                
                                {canResend ? (
                                    <p 
                                        onClick={!loading ? handleSendOtp : undefined} 
                                        className={`text-xs font-semibold ${loading ? 'text-on-surface-variant/40 cursor-not-allowed' : 'text-primary cursor-pointer hover:underline'}`}
                                    >
                                        {loading ? "Sending..." : "Resend OTP"}
                                    </p>
                                ) : (
                                    <p className="text-xs text-on-surface-variant/60 font-mono">
                                        Resend in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Password */}
                    {step === 3 && (
                        <div>
                            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5 block">
                                Create Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 mb-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, handleSignup)}
                                disabled={loading}
                            />
                            
                            <div className="p-4 bg-surface-container-low rounded-xl text-sm border border-outline/10 shadow-sm">
                                <p className="font-semibold text-on-surface-variant mb-2">Password Requirements:</p>
                                <ul className="space-y-1">
                                    <li className={`flex items-center gap-2 transition-colors ${hasMinLength ? 'text-primary font-medium' : 'text-on-surface-variant/60'}`}>
                                        <span className="material-symbols-outlined text-[16px]">{hasMinLength ? 'check_circle' : 'radio_button_unchecked'}</span>
                                        Minimum 6 characters
                                    </li>
                                    <li className={`flex items-center gap-2 transition-colors ${hasNumber ? 'text-primary font-medium' : 'text-on-surface-variant/60'}`}>
                                        <span className="material-symbols-outlined text-[16px]">{hasNumber ? 'check_circle' : 'radio_button_unchecked'}</span>
                                        At least 1 digit
                                    </li>
                                    <li className={`flex items-center gap-2 transition-colors ${hasSpecialChar ? 'text-primary font-medium' : 'text-on-surface-variant/60'}`}>
                                        <span className="material-symbols-outlined text-[16px]">{hasSpecialChar ? 'check_circle' : 'radio_button_unchecked'}</span>
                                        At least 1 special character
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-error-container/30 border border-error/20 rounded-xl px-4 py-3">
                        <span className="material-symbols-outlined text-error text-lg">error</span>
                        <p className="text-on-error-container text-sm">{error}</p>
                    </div>
                )}

                {/* Buttons based on step */}
                {step === 1 && (
                    <button
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? "Sending OTP..." : "Verify Email"}
                        {!loading && <span className="material-symbols-outlined">mail</span>}
                    </button>
                )}

                {step === 2 && (
                    <button
                        onClick={handleVerifyOtp}
                        disabled={loading}
                        className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? "Verifying..." : "Submit OTP"}
                        {!loading && <span className="material-symbols-outlined">check_circle</span>}
                    </button>
                )}

                {step === 3 && (
                    <button
                        onClick={handleSignup}
                        disabled={loading || !isPasswordValid}
                        className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                        {!loading && <span className="material-symbols-outlined">person_add</span>}
                    </button>
                )}

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