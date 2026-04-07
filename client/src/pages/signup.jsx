import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp, signupUser, loginUser, setupSafetyNet } from "../api/api";
import manasBanner from "../assets/manas-banner.png";

function Signup() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password, 4: SafetyNet
    
    // Form States
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [signupToken, setSignupToken] = useState("");
    
    // SafetyNet contact states
    const [contacts, setContacts] = useState([{ name: "", email: "" }]);
    const [tempToken, setTempToken] = useState("");

    // UI States
    const [error, setError] = useState("");
    const [loadingAction, setLoadingAction] = useState(""); // "" | "sendOtp" | "verifyOtp" | "signup" | "setupSafetyNet"
    const [resendTimer, setResendTimer] = useState(30);
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
        setLoadingAction("sendOtp");
        try {
            await sendOtp(email);
            setStep(2);
            setResendTimer(30);
            setCanResend(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAction("");
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 4) {
            setError("Please enter a valid 4-digit OTP");
            return;
        }
        setError("");
        setLoadingAction("verifyOtp");
        try {
            const data = await verifyOtp(email, otp);
            setSignupToken(data.signupToken);
            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAction("");
        }
    };

    const handleSignup = async () => {
        if (!isPasswordValid) {
            setError("Please meet all password requirements");
            return;
        }
        setError("");
        setLoadingAction("signup");
        try {
            await signupUser(email, password, signupToken);
            // After account creation, log in to get a token for SafetyNet setup
            const loginData = await loginUser(email, password);
            setTempToken(loginData.token);
            setStep(4); // Advance to SafetyNet onboarding
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAction("");
        }
    };

    const handleAddContact = () => {
        if (contacts.length < 2) {
            setContacts([...contacts, { name: "", email: "" }]);
        }
    };

    const handleRemoveContact = (index) => {
        setContacts(contacts.filter((_, i) => i !== index));
        if (contacts.length <= 1) {
            setContacts([{ name: "", email: "" }]);
        }
    };

    const handleContactChange = (index, field, value) => {
        const updated = [...contacts];
        updated[index][field] = value;
        setContacts(updated);
    };

    const handleSafetyNetSetup = async () => {
        // Validate contacts
        const validContacts = contacts.filter(c => c.name.trim() && c.email.trim());
        if (validContacts.length === 0) {
            setError("Please add at least one contact, or skip this step");
            return;
        }

        // Basic email validation
        for (const c of validContacts) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
                setError(`Invalid email: ${c.email}`);
                return;
            }
        }

        setError("");
        setLoadingAction("setupSafetyNet");
        try {
            await setupSafetyNet(tempToken, validContacts);
            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAction("");
        }
    };

    const handleSkipSafetyNet = () => {
        navigate("/login");
    };

    const handleKeyDown = (e, callback) => {
        if (e.key === "Enter") {
            if (!loadingAction) callback();
        }
    };

    // Password Validation Specs
    const hasMinLength = password.length >= 6;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

    const stepSubtext = {
        1: "Create a space for your thoughts.",
        2: `Enter the secure code sent to ${email}`,
        3: "Secure your new account with a strong password.",
        4: "One last thing — your safety net.",
    };

    return (
        <div className="bg-surface min-h-screen flex items-center justify-center px-6 vellum-texture relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>

            <div className="w-full max-w-sm space-y-8 z-10 relative">
                <div className="text-center space-y-3">
                    <img src={manasBanner} alt="Manas" className="w-56 mx-auto mb-4 drop-shadow-sm" />
                    {step <= 3 && (
                        <h1 className="font-handwriting text-4xl text-primary">Start your journey</h1>
                    )}
                    {step === 4 && (
                        <h1 className="font-handwriting text-4xl text-primary">Your safety net</h1>
                    )}
                    <p className="font-headline italic text-on-surface-variant/80 text-sm">
                        {stepSubtext[step]}
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
                                disabled={loadingAction === "sendOtp"}
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
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => handleKeyDown(e, handleVerifyOtp)}
                                disabled={loadingAction === "verifyOtp"}
                            />
                            
                            <div className="flex justify-between items-center mt-3">
                                <p onClick={() => setStep(1)} className="text-xs text-primary cursor-pointer hover:underline">Change Email?</p>
                                
                                {canResend ? (
                                    <p 
                                        onClick={loadingAction !== "sendOtp" ? handleSendOtp : undefined} 
                                        className={`text-xs font-semibold ${loadingAction === "sendOtp" ? 'text-on-surface-variant/40 cursor-not-allowed' : 'text-primary cursor-pointer hover:underline'}`}
                                    >
                                        {loadingAction === "sendOtp" ? "Sending..." : "Resend OTP"}
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
                                disabled={loadingAction === "signup"}
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

                    {/* STEP 4: SafetyNet Contacts */}
                    {step === 4 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-4 bg-primary-container/20 rounded-2xl border border-primary/10">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-container/60 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="material-symbols-outlined text-xl">shield_with_heart</span>
                                    </div>
                                    <div>
                                        <p className="text-on-surface text-sm leading-relaxed">
                                            Add 1–2 people you trust with your heart. If we ever sense you're going through a tough time, we'll gently ask them to check in — <strong>without sharing anything you've written</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {contacts.map((contact, index) => (
                                <div key={index} className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 space-y-3 relative">
                                    <div className="flex items-center justify-between">
                                        <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Contact {index + 1}
                                        </span>
                                        {contacts.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveContact(index)}
                                                className="text-on-surface-variant/50 hover:text-error transition-colors cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Their name"
                                        className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                                        value={contact.name}
                                        onChange={(e) => handleContactChange(index, "name", e.target.value)}
                                        disabled={loadingAction === "setupSafetyNet"}
                                    />
                                    <input
                                        type="email"
                                        placeholder="their@email.com"
                                        className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                                        value={contact.email}
                                        onChange={(e) => handleContactChange(index, "email", e.target.value)}
                                        disabled={loadingAction === "setupSafetyNet"}
                                    />
                                </div>
                            ))}

                            {contacts.length < 2 && (
                                <button
                                    onClick={handleAddContact}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-outline-variant/40 rounded-2xl text-on-surface-variant/60 text-sm font-medium hover:border-primary/30 hover:text-primary/70 transition-all cursor-pointer"
                                    disabled={loadingAction === "setupSafetyNet"}
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add another contact
                                </button>
                            )}
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
                        disabled={loadingAction === "sendOtp"}
                        className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loadingAction === "sendOtp" ? "Sending OTP..." : "Verify Email"}
                        {loadingAction !== "sendOtp" && <span className="material-symbols-outlined">mail</span>}
                    </button>
                )}

                {step === 2 && (
                    <button
                        onClick={handleVerifyOtp}
                        disabled={loadingAction === "verifyOtp"}
                        className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loadingAction === "verifyOtp" ? "Verifying..." : "Submit OTP"}
                        {loadingAction !== "verifyOtp" && <span className="material-symbols-outlined">check_circle</span>}
                    </button>
                )}

                {step === 3 && (
                    <button
                        onClick={handleSignup}
                        disabled={loadingAction === "signup" || !isPasswordValid}
                        className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loadingAction === "signup" ? "Creating account..." : "Create Account"}
                        {loadingAction !== "signup" && <span className="material-symbols-outlined">person_add</span>}
                    </button>
                )}

                {step === 4 && (
                    <div className="space-y-3">
                        <button
                            onClick={handleSafetyNetSetup}
                            disabled={loadingAction === "setupSafetyNet"}
                            className="w-full h-14 bg-primary-container text-on-primary-container rounded-full font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loadingAction === "setupSafetyNet" ? "Setting up..." : "Complete Setup"}
                            {loadingAction !== "setupSafetyNet" && <span className="material-symbols-outlined">shield_with_heart</span>}
                        </button>
                        <button
                            onClick={handleSkipSafetyNet}
                            disabled={loadingAction !== ""}
                            className="w-full py-3 text-on-surface-variant/70 text-sm font-medium hover:text-on-surface-variant transition-colors cursor-pointer"
                        >
                            Skip for now — I'll set this up later
                        </button>
                    </div>
                )}

                {step <= 3 && (
                    <p className="text-center text-sm text-on-surface-variant/70">
                        Already have an account?{" "}
                        <span
                            className="text-primary font-semibold cursor-pointer hover:underline"
                            onClick={() => navigate("/login")}
                        >
                            Sign in
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}

export default Signup;