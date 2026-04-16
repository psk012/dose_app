import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";
import {
    addComfortZoneContact,
    deleteComfortZoneContact,
    getComfortZoneAuditLog,
    getComfortZoneConfig,
    getComfortZoneStatus,
    pauseComfortZone,
    requestComfortZoneEmailOtp,
    resumeComfortZone,
    updateComfortZoneConfig,
    verifyComfortZoneEmailOtp,
} from "../api/api";

const emptyForm = {
    name: "",
    email: "",
    emailOtp: "",
    emailVerificationToken: "",
};

const OTP_COOLDOWN_SECONDS = 60;

function MyComfortZone() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [config, setConfig] = useState(null);
    const [status, setStatus] = useState(null);
    const [auditLog, setAuditLog] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showConsent, setShowConsent] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [emailCooldown, setEmailCooldown] = useState(0);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [configResult, statusResult, logResult] = await Promise.allSettled([
                getComfortZoneConfig(token),
                getComfortZoneStatus(token),
                getComfortZoneAuditLog(token),
            ]);
            if (configResult.status === "rejected") throw new Error(configResult.reason.message || "Failed to load My Comfort Zone.");
            if (statusResult.status === "rejected") throw new Error(statusResult.reason.message || "Failed to load status.");
            setConfig(configResult.value);
            setStatus(statusResult.value);
            if (logResult.status === "fulfilled") setAuditLog(logResult.value);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Cooldown timer for email OTP send button
    useEffect(() => {
        if (emailCooldown <= 0) return;
        const interval = setInterval(() => {
            setEmailCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [emailCooldown]);

    async function run(key, action) {
        setBusy(key);
        setError("");
        try {
            await action();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy("");
        }
    }

    function flash(message) {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
    }

    function updateForm(field, value) {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === "email") {
                next.emailOtp = "";
                next.emailVerificationToken = "";
                setEmailCooldown(0);
            }
            return next;
        });
    }

    async function toggleEnabled() {
        if (!config.enabled && !config.consentGivenAt) {
            setShowConsent(true);
            return;
        }
        await run("toggle", async () => {
            await updateComfortZoneConfig(token, { enabled: !config.enabled });
            await loadData();
            flash(config.enabled ? "My Comfort Zone disabled" : "My Comfort Zone enabled");
        });
    }

    async function acceptConsent() {
        setShowConsent(false);
        await run("consent", async () => {
            await updateComfortZoneConfig(token, { enabled: true });
            await loadData();
            flash("My Comfort Zone enabled.");
        });
    }

    async function sendEmailCode() {
        await run("send-email", async () => {
            await requestComfortZoneEmailOtp(token, form.email);
            setEmailCooldown(OTP_COOLDOWN_SECONDS);
            flash("Email code sent.");
        });
    }

    async function verifyEmailCode() {
        await run("verify-email", async () => {
            const data = await verifyComfortZoneEmailOtp(token, form.email, form.emailOtp);
            setForm(prev => ({ ...prev, emailVerificationToken: data.verificationToken }));
            flash("Email verified.");
        });
    }

    async function saveContact() {
        await run("save-contact", async () => {
            await addComfortZoneContact(token, {
                name: form.name,
                email: form.email,
                emailVerificationToken: form.emailVerificationToken,
            });
            setForm(emptyForm);
            setShowAdd(false);
            await loadData();
            flash("Contact verified. Invitation sent for acceptance.");
        });
    }

    async function removeContact(id) {
        await run(`delete-${id}`, async () => {
            await deleteComfortZoneContact(token, id);
            await loadData();
            flash("Contact removed.");
        });
    }

    async function pause(days) {
        await run("pause", async () => {
            await pauseComfortZone(token, days);
            await loadData();
            flash(days ? `Paused for ${days} days` : "Paused indefinitely");
        });
    }

    async function resume() {
        await run("resume", async () => {
            await resumeComfortZone(token);
            await loadData();
            flash("Alerts resumed.");
        });
    }

    function formatDate(date) {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function pill(ok, good, pending) {
        return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ok ? "bg-primary-container/50 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>{ok ? good : pending}</span>;
    }

    const contacts = config?.trustedContacts || [];
    const canSave = form.name.trim() && form.emailVerificationToken;

    if (loading) {
        return (
            <div className="bg-surface min-h-screen vellum-texture flex items-center justify-center">
                <p className="text-on-surface-variant font-headline italic">Loading My Comfort Zone...</p>
            </div>
        );
    }

    return (
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden pb-24">
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none"></div>
            <div className="relative max-w-lg md:max-w-2xl mx-auto px-6 py-8 md:py-12">
                {showConsent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md">
                        <div className="bg-surface-container-lowest max-w-sm w-full rounded-[32px] p-8 shadow-2xl border border-outline-variant/30">
                            <h2 className="font-handwriting text-3xl text-on-surface text-center mb-4">Enable My Comfort Zone?</h2>
                            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">Only verified and accepted contacts can receive a generic check-in reminder. Journal text, emotional content, and AI summaries are never shared.</p>
                            <button onClick={acceptConsent} disabled={busy === "consent"} className="w-full bg-primary-container text-on-primary-container rounded-full py-3.5 font-bold hover:shadow-md transition-all disabled:opacity-50">I understand, enable it</button>
                            <button onClick={() => setShowConsent(false)} className="w-full mt-3 border border-outline-variant/50 text-on-surface-variant rounded-full py-3.5 font-medium">Not right now</button>
                        </div>
                    </div>
                )}

                <header className="flex items-center gap-3 mb-10">
                    <button onClick={() => navigate("/")} className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-handwriting text-4xl text-on-surface">My Comfort Zone</h1>
                        <p className="text-on-surface-variant/70 text-xs font-label">Support, only with consent</p>
                    </div>
                </header>

                {success && <div className="bg-primary-container/30 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-on-primary-container text-sm">{success}</div>}
                {error && <div className="bg-error-container/30 border border-error/20 rounded-xl px-4 py-3 mb-6 text-on-error-container text-sm">{error}</div>}

                <div className="space-y-5">
                    <section className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-on-surface">Protection</h3>
                                <p className="text-xs text-on-surface-variant/60">{status?.status || "disabled"}</p>
                            </div>
                            <button onClick={toggleEnabled} disabled={busy === "toggle"} className={`relative w-14 h-8 rounded-full transition-all ${config?.enabled ? "bg-primary" : "bg-outline-variant/40"}`}>
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${config?.enabled ? "translate-x-7" : "translate-x-1"}`} />
                            </button>
                        </div>
                        {config?.enabled && (
                            <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-outline-variant/20 text-center">
                                <div>
                                    <p className="text-xs text-on-surface-variant/60">Last analysis</p>
                                    <p className="text-sm font-medium text-on-surface">{formatDate(config.lastAnalysisAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-on-surface-variant/60">Active contacts</p>
                                    <p className="text-sm font-medium text-on-surface">{config.activeContactCount || 0} of {contacts.length}</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {config?.enabled && (
                        <section className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-on-surface">My Comfort Zone</h3>
                                {contacts.length < 2 && !showAdd && <button onClick={() => setShowAdd(true)} className="text-primary text-sm font-bold">Add</button>}
                            </div>
                            <div className="space-y-3">
                                {contacts.length === 0 && !showAdd && <p className="text-sm text-on-surface-variant/60 text-center py-4">No contacts added yet.</p>}
                                {contacts.map(contact => (
                                    <div key={contact.id} className="p-4 bg-surface-container-low rounded-2xl">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-lg">person</span></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-on-surface text-sm truncate">{contact.name || "Contact"}</p>
                                                <p className="text-xs text-on-surface-variant/60 truncate">{contact.email}</p>
                                            </div>
                                            <button onClick={() => removeContact(contact.id)} disabled={busy === `delete-${contact.id}`} className="text-on-surface-variant/40 hover:text-error"><span className="material-symbols-outlined text-lg">delete</span></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {pill(contact.isEmailVerified, "Email verified", "Email pending")}
                                            {pill(contact.isAccepted, "Accepted", "Acceptance pending")}
                                        </div>
                                    </div>
                                ))}
                                {showAdd && (
                                    <div className="p-5 bg-surface-container-low rounded-2xl space-y-4 border border-outline-variant/30">
                                        <p className="font-semibold text-on-surface text-sm">Add a contact</p>

                                        {/* Name */}
                                        <input className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all" placeholder="Their name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} />

                                        {/* ── EMAIL VERIFICATION ── */}
                                        <div className="space-y-2.5">
                                            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">Email</label>
                                            <input type="email" className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all" placeholder="their@email.com" value={form.email} onChange={(e) => updateForm("email", e.target.value)} disabled={Boolean(form.emailVerificationToken)} />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={sendEmailCode}
                                                    disabled={busy === "send-email" || !form.email || emailCooldown > 0 || Boolean(form.emailVerificationToken)}
                                                    className="flex-1 rounded-xl bg-surface-container-high hover:bg-surface-container-highest px-3 py-2.5 text-xs font-bold text-on-surface-variant disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                >
                                                    {busy === "send-email" ? "Sending..." : emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Send code"}
                                                </button>
                                                <input
                                                    inputMode="numeric"
                                                    maxLength={4}
                                                    className="w-24 rounded-xl bg-surface-container-lowest border border-outline-variant/50 px-3 py-2.5 text-xs text-center tracking-widest text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                                                    placeholder="0000"
                                                    value={form.emailOtp}
                                                    onChange={(e) => updateForm("emailOtp", e.target.value.replace(/\D/g, ""))}
                                                    disabled={Boolean(form.emailVerificationToken)}
                                                />
                                            </div>
                                            <button
                                                onClick={verifyEmailCode}
                                                disabled={busy === "verify-email" || form.emailOtp.length !== 4 || Boolean(form.emailVerificationToken)}
                                                className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                    form.emailVerificationToken
                                                        ? "bg-primary/10 text-primary border border-primary/20"
                                                        : form.emailOtp.length === 4
                                                            ? "bg-primary-container text-on-primary-container hover:shadow-md active:scale-[0.98]"
                                                            : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
                                                } disabled:cursor-not-allowed`}
                                            >
                                                {busy === "verify-email" && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                                                {form.emailVerificationToken && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                                {form.emailVerificationToken ? "Email verified" : busy === "verify-email" ? "Verifying..." : "Verify email"}
                                            </button>
                                        </div>

                                        {/* ── ACTIONS ── */}
                                        <div className="flex gap-3 pt-1">
                                            <button onClick={saveContact} disabled={busy === "save-contact" || !canSave} className="flex-1 bg-primary-container text-on-primary-container rounded-full py-2.5 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5">
                                                {busy === "save-contact" && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                                                {busy === "save-contact" ? "Saving..." : "Save and invite"}
                                            </button>
                                            <button onClick={() => { setShowAdd(false); setForm(emptyForm); setEmailCooldown(0); }} className="flex-1 bg-surface-container-high text-on-surface-variant rounded-full py-2.5 text-sm hover:bg-surface-container-highest transition-colors cursor-pointer">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {config?.enabled && (
                        <section className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 p-6">
                            <h3 className="font-semibold text-on-surface mb-4">Alert controls</h3>
                            {status?.status === "paused" ? (
                                <button onClick={resume} disabled={busy === "resume"} className="w-full bg-primary-container text-on-primary-container rounded-full py-3 font-semibold text-sm disabled:opacity-50">Resume alerts</button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => pause(7)} disabled={Boolean(busy)} className="py-3 border border-outline-variant/40 rounded-xl text-on-surface-variant text-sm">Pause 7 days</button>
                                    <button onClick={() => pause(null)} disabled={Boolean(busy)} className="py-3 border border-outline-variant/40 rounded-xl text-on-surface-variant text-sm">Pause indefinitely</button>
                                </div>
                            )}
                        </section>
                    )}

                    {config?.enabled && auditLog.length > 0 && (
                        <section className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 p-6">
                            <h3 className="font-semibold text-on-surface mb-4">Alert history</h3>
                            <div className="space-y-2">
                                {auditLog.map(log => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                                        <p className="text-sm text-on-surface">Alert {log.deliveryStatus}</p>
                                        <p className="text-xs text-on-surface-variant/60">{log.recipientCount} recipient{log.recipientCount > 1 ? "s" : ""}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="p-5 bg-surface-container-low/50 rounded-3xl border border-outline-variant/20">
                        <p className="font-semibold text-on-surface-variant/80 text-xs mb-2">Your privacy is absolute</p>
                        <p className="text-xs text-on-surface-variant/60 leading-relaxed">Only verified and accepted contacts receive alerts. The only alert text is: "They may be going through a difficult emotional phase. Consider checking in." No journal text, emotional content, AI summaries, or personal details are shared.</p>
                    </section>
                </div>
                <Navbar />
            </div>
        </div>
    );
}

export default MyComfortZone;

