import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { saveJournal } from "../api/api";

function Journal({ entry, setEntry, setEntries, entries, journalLoading, journalError }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const { token } = useAuth();

    // ✅ Auto-clear success message after 2 seconds
    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => setSuccess(false), 2000);
        return () => clearTimeout(timer);
    }, [success]);

    const handleSave = async () => {
        if (entry.trim() === "") return;

        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            await saveJournal(token, entry);
            setEntries((prev) => [entry, ...prev]);
            setEntry("");
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface-container-lowest rounded-xl p-5">
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-4">
                Express your thoughts
            </h2>

            <textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Write what's on your mind..."
                className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant/50 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all resize-none min-h-[100px] text-sm"
                disabled={saving}
            />

            {error && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                    <span className="material-symbols-outlined text-error text-lg">error</span>
                    <p className="text-on-error-container">{error}</p>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    <p className="text-primary font-medium">Saved successfully</p>
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={saving || entry.trim() === ""}
                className="mt-3 px-6 py-2.5 bg-primary-container text-on-primary-container rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
                <span className="material-symbols-outlined text-lg">save</span>
                {saving ? "Saving..." : "Save Entry"}
            </button>

            {/* Loading state for initial journal fetch */}
            {journalLoading && (
                <div className="flex items-center gap-2 mt-6 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Loading your entries...
                </div>
            )}

            {/* Error state for journal fetch */}
            {journalError && (
                <div className="flex items-center gap-2 mt-6 text-sm">
                    <span className="material-symbols-outlined text-error text-lg">error</span>
                    <p className="text-on-error-container">Failed to load entries: {journalError}</p>
                </div>
            )}

            {!journalLoading && !journalError && (
                <div className="mt-6 space-y-3">
                    {entries.length === 0 ? (
                        <div className="text-center py-6 text-on-surface-variant/60">
                            <span className="material-symbols-outlined text-4xl mb-2 block">draft</span>
                            <p className="text-sm">No entries yet. Write your first thought above.</p>
                        </div>
                    ) : (
                        <>
                            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                Past Entries
                            </p>
                            {entries.map((e, index) => (
                                <div
                                    key={index}
                                    className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-sm text-on-surface leading-relaxed"
                                >
                                    {e}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Journal;