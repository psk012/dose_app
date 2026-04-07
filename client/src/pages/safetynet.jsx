import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";
import {
    getSafetyNetConfig,
    updateSafetyNetConfig,
    updateSafetyNetContacts,
    getSafetyNetStatus,
    pauseSafetyNet,
    resumeSafetyNet,
    getSafetyNetAuditLog,
} from "../api/api";

function SafetyNet() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [config, setConfig] = useState(null);
    const [status, setStatus] = useState(null);
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Edit mode for contacts
    const [editingContacts, setEditingContacts] = useState(false);
    const [editContacts, setEditContacts] = useState([]);

    // Consent acknowledgement for first-time enable
    const [showConsent, setShowConsent] = useState(false);

    useEffect(() => {
        loadData();
    }, [token]);

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [configResult, statusResult, logResult] = await Promise.allSettled([
                getSafetyNetConfig(token),
                getSafetyNetStatus(token),
                getSafetyNetAuditLog(token),
            ]);

            // Properly handle rejected promises so the UI doesn't crash on null
            if (configResult.status === "rejected") {
                throw new Error(configResult.reason.message || "Failed to load SafetyNet config");
            }
            if (statusResult.status === "rejected") {
                throw new Error(statusResult.reason.message || "Failed to load SafetyNet status");
            }

            setConfig(configResult.value);
            setStatus(statusResult.value);
            if (logResult.status === "fulfilled") setAuditLog(logResult.value);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggle() {
        if (!config.enabled && !config.consentGivenAt) {
            setShowConsent(true);
            return;
        }

        setActionLoading(true);
        setError("");
        try {
            await updateSafetyNetConfig(token, { enabled: !config.enabled });
            await loadData();
            setSuccess(config.enabled ? "SafetyNet disabled" : "SafetyNet enabled");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleConsent() {
        setShowConsent(false);
        setActionLoading(true);
        setError("");
        try {
            await updateSafetyNetConfig(token, { enabled: true });
            await loadData();
            setSuccess("SafetyNet enabled — you're protected 🛡️");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handlePause(days) {
        setActionLoading(true);
        setError("");
        try {
            await pauseSafetyNet(token, days);
            await loadData();
            setSuccess(days ? `Paused for ${days} days` : "Paused indefinitely");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleResume() {
        setActionLoading(true);
        setError("");
        try {
            await resumeSafetyNet(token);
            await loadData();
            setSuccess("Alerts resumed");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    function startEditContacts() {
        setEditContacts(
            config.trustedContacts.length > 0
                ? config.trustedContacts.map(c => ({ name: c.name, email: c.email }))
                : [{ name: "", email: "" }]
        );
        setEditingContacts(true);
    }

    function handleEditContactChange(index, field, value) {
        const updated = [...editContacts];
        updated[index][field] = value;
        setEditContacts(updated);
    }

    function addEditContact() {
        if (editContacts.length < 2) {
            setEditContacts([...editContacts, { name: "", email: "" }]);
        }
    }

    function removeEditContact(index) {
        const updated = editContacts.filter((_, i) => i !== index);
        setEditContacts(updated.length > 0 ? updated : [{ name: "", email: "" }]);
    }

    async function saveContacts() {
        const validContacts = editContacts.filter(c => c.name.trim() && c.email.trim());
        if (validContacts.length === 0) {
            setError("Please add at least one contact");
            return;
        }

        for (const c of validContacts) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
                setError(`Invalid email: ${c.email}`);
                return;
            }
        }

        setActionLoading(true);
        setError("");
        try {
            await updateSafetyNetContacts(token, validContacts);
            setEditingContacts(false);
            await loadData();
            setSuccess("Contacts updated");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getRiskColor(level) {
        switch (level) {
            case "low": return "text-green-600";
            case "medium": return "text-amber-500";
            case "high": return "text-orange-500";
            case "critical": return "text-red-500";
            default: return "text-on-surface-variant";
        }
    }

    if (loading) {
        return (
            <div className="bg-surface min-h-screen vellum-texture flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <span className="material-symbols-outlined text-4xl text-primary mb-3 block animate-breathe">shield_with_heart</span>
                    <p className="text-on-surface-variant font-headline italic">Loading SafetyNet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden pb-24">
            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none"></div>
            <div className="absolute top-1/2 -left-32 w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none"></div>

            {/* Consent Modal */}
            {showConsent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md">
                    <div className="bg-surface-container-lowest max-w-sm w-full rounded-[32px] p-8 shadow-2xl border border-outline-variant/30 relative overflow-hidden animate-spring-up">
                        <div className="w-14 h-14 rounded-2xl bg-primary-container/50 text-primary flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">shield_with_heart</span>
                        </div>
                        <h2 className="font-handwriting text-3xl text-on-surface text-center mb-4">Enable SafetyNet?</h2>
                        
                        <div className="space-y-3 text-sm text-on-surface-variant mb-6">
                            <p className="leading-relaxed">SafetyNet analyzes your <strong>emotional patterns</strong> over time to detect prolonged distress. If it senses you might need support, it sends a gentle, generic check-in message to your trusted contacts.</p>
                            
                            <div className="p-3 bg-primary-container/10 rounded-xl border border-primary/10">
                                <p className="font-semibold text-on-surface mb-2 text-xs uppercase tracking-wider">What we NEVER share:</p>
                                <ul className="space-y-1 text-xs">
                                    <li className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary">lock</span> Your journal entries</li>
                                    <li className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary">lock</span> Your thoughts or feelings</li>
                                    <li className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary">lock</span> Any personal details</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleConsent}
                                disabled={actionLoading}
                                className="w-full bg-primary-container text-on-primary-container rounded-full py-3.5 font-bold hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {actionLoading ? "Enabling..." : "I understand, enable SafetyNet"}
                            </button>
                            <button
                                onClick={() => setShowConsent(false)}
                                className="w-full bg-transparent text-on-surface-variant rounded-full py-3.5 font-medium border border-outline-variant/50 hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer"
                            >
                                Not right now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative max-w-lg md:max-w-2xl mx-auto px-6 py-8 md:py-12">
                {/* Header */}
                <header className="flex items-center gap-3 mb-10">
                    <button
                        onClick={() => navigate("/")}
                        className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-handwriting text-4xl text-on-surface">SafetyNet</h1>
                        <p className="text-on-surface-variant/70 text-xs font-label">Your emotional safety net</p>
                    </div>
                </header>

                {/* Success / Error messages */}
                {success && (
                    <div className="flex items-center gap-2 bg-primary-container/30 border border-primary/20 rounded-xl px-4 py-3 mb-6 animate-fade-in">
                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                        <p className="text-on-primary-container text-sm">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 bg-error-container/30 border border-error/20 rounded-xl px-4 py-3 mb-6">
                        <span className="material-symbols-outlined text-error text-lg">error</span>
                        <p className="text-on-error-container text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-5">
                    {/* ─── STATUS CARD ──────────────────────── */}
                    <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config?.enabled ? 'bg-primary-container/50 text-primary' : 'bg-surface-container-high text-on-surface-variant/40'}`}>
                                    <span className="material-symbols-outlined text-2xl">shield_with_heart</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-on-surface">SafetyNet</h3>
                                    <p className="text-xs text-on-surface-variant/60">
                                        {status?.status === "active" && "Actively monitoring"}
                                        {status?.status === "paused" && "Paused"}
                                        {status?.status === "disabled" && "Disabled"}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle */}
                            <button
                                onClick={handleToggle}
                                disabled={actionLoading}
                                className={`relative w-14 h-8 rounded-full transition-all duration-300 cursor-pointer ${config?.enabled ? 'bg-primary' : 'bg-outline-variant/40'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${config?.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {config?.enabled && (
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant/20">
                                <div className="text-center">
                                    <p className="text-xs text-on-surface-variant/60 mb-1">Last Analysis</p>
                                    <p className="text-sm font-medium text-on-surface">{config?.lastAnalysisAt ? formatDate(config.lastAnalysisAt) : "Pending"}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-on-surface-variant/60 mb-1">Contacts</p>
                                    <p className="text-sm font-medium text-on-surface">{config?.trustedContacts?.length || 0} of 2</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── TRUSTED CONTACTS ─────────────────── */}
                    {config?.enabled && (
                        <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xl text-primary">group</span>
                                    Trusted Contacts
                                </h3>
                                {!editingContacts && (
                                    <button
                                        onClick={startEditContacts}
                                        className="text-primary text-sm font-medium hover:underline cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {!editingContacts ? (
                                <div className="space-y-3">
                                    {config.trustedContacts.length === 0 ? (
                                        <div className="text-center py-6">
                                            <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2 block">person_add</span>
                                            <p className="text-sm text-on-surface-variant/60">No contacts added yet</p>
                                            <button
                                                onClick={startEditContacts}
                                                className="mt-3 text-primary text-sm font-semibold hover:underline cursor-pointer"
                                            >
                                                Add a trusted contact
                                            </button>
                                        </div>
                                    ) : (
                                        config.trustedContacts.map((contact, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-lg">person</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-on-surface text-sm truncate">{contact.name}</p>
                                                    <p className="text-xs text-on-surface-variant/60 truncate">{contact.email}</p>
                                                </div>
                                                <span className="material-symbols-outlined text-primary/40 text-lg">verified_user</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {editContacts.map((contact, index) => (
                                        <div key={index} className="p-3 bg-surface-container-low rounded-xl space-y-2 relative">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-on-surface-variant/60 font-semibold uppercase tracking-wider">Contact {index + 1}</span>
                                                {editContacts.length > 1 && (
                                                    <button onClick={() => removeEditContact(index)} className="text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer">
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                                                value={contact.name}
                                                onChange={(e) => handleEditContactChange(index, "name", e.target.value)}
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                                                value={contact.email}
                                                onChange={(e) => handleEditContactChange(index, "email", e.target.value)}
                                            />
                                        </div>
                                    ))}

                                    {editContacts.length < 2 && (
                                        <button
                                            onClick={addEditContact}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-outline-variant/30 rounded-xl text-on-surface-variant/50 text-sm hover:border-primary/30 hover:text-primary/60 transition-all cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                            Add another
                                        </button>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={saveContacts}
                                            disabled={actionLoading}
                                            className="flex-1 bg-primary-container text-on-primary-container rounded-full py-2.5 font-semibold text-sm hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                        >
                                            {actionLoading ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={() => setEditingContacts(false)}
                                            className="flex-1 bg-surface-container-high text-on-surface-variant rounded-full py-2.5 font-medium text-sm hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── PAUSE / RESUME ─────────────────────── */}
                    {config?.enabled && (
                        <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-6">
                            <h3 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-xl text-tertiary">pause_circle</span>
                                Alert Controls
                            </h3>

                            {status?.status === "paused" ? (
                                <div>
                                    <div className="flex items-center gap-2 p-3 bg-tertiary-container/20 rounded-xl mb-4">
                                        <span className="material-symbols-outlined text-tertiary text-lg">info</span>
                                        <p className="text-sm text-on-surface-variant">
                                            Alerts are paused{status.pausedUntil ? ` until ${formatDate(status.pausedUntil)}` : " indefinitely"}.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleResume}
                                        disabled={actionLoading}
                                        className="w-full bg-primary-container text-on-primary-container rounded-full py-3 font-semibold text-sm hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        {actionLoading ? "Resuming..." : "Resume Alerts"}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handlePause(7)}
                                        disabled={actionLoading}
                                        className="py-3 border border-outline-variant/40 rounded-xl text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        Pause 7 days
                                    </button>
                                    <button
                                        onClick={() => handlePause(null)}
                                        disabled={actionLoading}
                                        className="py-3 border border-outline-variant/40 rounded-xl text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        Pause indefinitely
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── ALERT HISTORY ──────────────────────── */}
                    {config?.enabled && auditLog.length > 0 && (
                        <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-6">
                            <h3 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-xl text-secondary">history</span>
                                Alert History
                            </h3>

                            <div className="space-y-2">
                                {auditLog.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined text-lg ${log.deliveryStatus === "sent" ? "text-primary" : "text-error"}`}>
                                                {log.deliveryStatus === "sent" ? "check_circle" : "error"}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium text-on-surface">
                                                    Alert {log.deliveryStatus}
                                                </p>
                                                <p className="text-xs text-on-surface-variant/60">
                                                    {formatDate(log.triggeredAt)} · {log.recipientCount} recipient{log.recipientCount > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold uppercase ${getRiskColor(log.riskLevel)}`}>
                                            {log.riskLevel}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── PRIVACY NOTICE ─────────────────────── */}
                    <div className="p-5 bg-surface-container-low/50 rounded-3xl border border-outline-variant/20">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-xl text-primary/60 mt-0.5">lock</span>
                            <div className="text-xs text-on-surface-variant/60 space-y-1.5">
                                <p className="font-semibold text-on-surface-variant/80">Your privacy is absolute</p>
                                <p>SafetyNet analyzes emotional patterns only — your journal entries, thoughts, and personal details are never shared with anyone.</p>
                                <p>Trusted contacts receive only a generic check-in message with no specifics about you or your activity.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Navbar />
            </div>
        </div>
    );
}

export default SafetyNet;
