import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { saveJournal, apiFetch } from "../api/api"; // Ensure apiFetch is exported!

function Journal({ entry, setEntry, setEntries, entries, journalLoading, journalError }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [bulkPrompts, setBulkPrompts] = useState({ daily: "", weekly: "", monthly: "", yearly: "" });
    const [showPrompts, setShowPrompts] = useState(false);
    const [promptsLoading, setPromptsLoading] = useState(false);
    const [activePrompt, setActivePrompt] = useState(null);
    const [modalEntry, setModalEntry] = useState("");
    const [modalLocation, setModalLocation] = useState("");
    const [viewBin, setViewBin] = useState(false);
    const [deletedEntries, setDeletedEntries] = useState([]);
    const { token } = useAuth();

    // Helper to fetch with auth
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://dose-backend-ezck.onrender.com/api";
    
    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => setSuccess(false), 2000);
        return () => clearTimeout(timer);
    }, [success]);

    const fetchDeleted = async () => {
        try {
            const res = await fetch(`${API_BASE}/journal/deleted`, { headers: { Authorization: token }});
            const data = await res.json();
            setDeletedEntries(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (viewBin) fetchDeleted();
    }, [viewBin]);

    const fetchBulkPrompts = async () => {
        if (showPrompts) {
            setShowPrompts(false);
            return;
        }
        
        setPromptsLoading(true);
        setShowPrompts(true);
        try {
            const res = await fetch(`${API_BASE}/prompts/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token }
            });
            const data = await res.json();
            if (data.daily) setBulkPrompts(data);
        } catch (err) {
            console.error("Failed to load prompts");
        } finally {
            setPromptsLoading(false);
        }
    };

    const handleSave = async (isModal = false) => {
        const textToSave = isModal ? `Prompt: ${activePrompt}\n\n${modalEntry}` : entry;
        if (textToSave.trim() === "") return;
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch(`${API_BASE}/journal`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({ text: textToSave })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setEntries((prev) => [data.entry, ...prev]);
            if (isModal) {
                setModalEntry("");
                setActivePrompt(null);
            } else {
                setEntry("");
            }
            setSuccess(true);
            setShowPrompts(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePromptClick = (p) => {
        setActivePrompt(p);
        setModalEntry("");
        // Simple location placeholder or auto-fill logic if desired
        setModalLocation("My Space");
    };

    const handleSoftDelete = async (id) => {
        try {
            await fetch(`${API_BASE}/journal/soft/${id}`, { method: "DELETE", headers: { Authorization: token }});
            setEntries((prev) => prev.filter(e => e._id !== id));
        } catch (err) {
            console.error(err);
        }
    };
    
    const handleRestore = async (id) => {
        try {
            await fetch(`${API_BASE}/journal/restore/${id}`, { method: "PATCH", headers: { Authorization: token }});
            const restored = deletedEntries.find(e => e._id === id);
            setDeletedEntries((prev) => prev.filter(e => e._id !== id));
            if(restored) setEntries(prev => [restored, ...prev].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error(err);
        }
    };
    
    const handlePermanentDelete = async (id) => {
        try {
            await fetch(`${API_BASE}/journal/permanent/${id}`, { method: "DELETE", headers: { Authorization: token }});
            setDeletedEntries((prev) => prev.filter(e => e._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-3xl p-6 border border-outline-variant/30 shadow-sm relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-lg text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">edit_note</span>
                    Express your thoughts
                </h2>
                <button 
                    onClick={() => setViewBin(!viewBin)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface-variant transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-sm">{viewBin ? 'menu_book' : 'delete'}</span>
                    {viewBin ? 'Journal' : 'Recycle Bin'}
                </button>
            </div>

            {!viewBin ? (
                <>
                    <textarea
                        value={entry}
                        id="journal-input"
                        onChange={(e) => setEntry(e.target.value)}
                        placeholder="Start writing securely..."
                        className="w-full p-5 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-tertiary-container focus:bg-surface-container-lowest transition-all resize-none min-h-[140px] text-lg leading-relaxed font-handwriting"
                        disabled={saving}
                    />

                    <div className="flex justify-between items-center mt-4 mb-10">
                        <div className="flex flex-col">
                            {error && <span className="text-error text-xs">{error}</span>}
                            {success && <span className="text-tertiary font-medium text-xs">Saved securely.</span>}
                        </div>
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving || entry.trim() === ""}
                            className="bg-tertiary-container text-on-tertiary-container rounded-full px-6 py-2.5 font-bold hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            <span>Let it out</span>
                        </button>
                    </div>

                    {/* Journaling Prompts Trigger */}
                    <div className="text-center mb-6">
                        <button 
                            onClick={fetchBulkPrompts}
                            className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 mx-auto ${
                                showPrompts ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high text-on-surface-variant hover:bg-tertiary/10'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${promptsLoading ? 'animate-spin' : ''}`}>
                                {promptsLoading ? 'sync' : 'psychology_alt'}
                            </span>
                            {showPrompts ? 'Hide Prompts' : 'Journaling Prompts'}
                        </button>
                    </div>

                    {showPrompts && (
                        <div className="grid grid-cols-2 gap-3 mb-10 animate-spring-up overflow-hidden">
                            {[
                                { title: "Daily", key: "daily", color: "bg-primary-container/20 border-primary/20 text-primary" },
                                { title: "Weekly", key: "weekly", color: "bg-secondary-container/20 border-secondary/20 text-secondary" },
                                { title: "Monthly", key: "monthly", color: "bg-tertiary-container/30 border-tertiary/20 text-tertiary" },
                                { title: "Yearly", key: "yearly", color: "bg-error-container/10 border-error/10 text-error" },
                            ].map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => handlePromptClick(bulkPrompts[p.key])}
                                    className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95 group relative ${p.color}`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">{p.title}</span>
                                        <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">edit_square</span>
                                    </div>
                                    <p className="text-[13px] font-headline italic leading-snug line-clamp-3">
                                        {promptsLoading ? "Brewing a thoughtful question..." : bulkPrompts[p.key] || "Thinking..."}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Past Entries</p>
                        {journalLoading && <p className="text-sm text-on-surface-variant animate-pulse">Loading...</p>}
                        {!journalLoading && entries.length === 0 && <p className="text-sm text-on-surface-variant border border-dashed border-outline-variant/50 rounded-xl p-6 text-center">Your journal is empty. What's on your mind?</p>}
                        
                        {entries.map((e) => (
                            <div key={e._id} className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl group flex flex-col sm:flex-row gap-4 justify-between items-start">
                                <div className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap font-handwriting">{e.text}</div>
                                <button onClick={() => handleSoftDelete(e._id)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-all shrink-0">
                                    <span className="material-symbols-outlined">delete_forever</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Notepad Modal for Prompts */}
                    {activePrompt && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/60 backdrop-blur-lg animate-fade-in">
                            <div className="w-full max-w-md bg-surface-container-lowest rounded-[2.5rem] p-8 border border-outline-variant/50 shadow-2xl animate-spring-up overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-tertiary to-secondary/50"></div>
                                
                                <div className="flex flex-col gap-1 mb-6 text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-widest border-b border-outline-variant/20 pb-4">
                                    <div className="flex justify-between">
                                        <span>Date: {(() => {
                                            const d = new Date();
                                            const month = d.toLocaleDateString("en-US", { month: "short" });
                                            const day = d.getDate();
                                            const year = d.getFullYear();
                                            const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
                                            return `${month} ${day}${suffix}, ${year}`;
                                        })()}</span>
                                        <span>Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>Place:</span>
                                        <input 
                                            type="text" 
                                            value={modalLocation}
                                            onChange={(e) => setModalLocation(e.target.value)}
                                            placeholder="Your sanctuary..."
                                            className="bg-transparent border-none outline-none text-tertiary focus:text-tertiary-container transition-colors w-full"
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="text-xs text-on-surface-variant uppercase font-black tracking-widest mb-2 opacity-50">Journaling Prompt</p>
                                    <p className="font-headline italic text-lg text-on-surface leading-tight">"{activePrompt}"</p>
                                </div>

                                <textarea
                                    autoFocus
                                    value={modalEntry}
                                    onChange={(e) => setModalEntry(e.target.value)}
                                    placeholder="Let your thoughts flow freely onto the paper..."
                                    className="w-full h-64 bg-transparent border-none outline-none resize-none font-handwriting text-xl text-on-surface-variant placeholder:text-on-surface-variant/30 leading-relaxed mb-6"
                                />

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setActivePrompt(null)}
                                        className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        onClick={() => handleSave(true)}
                                        disabled={saving || modalEntry.trim() === ""}
                                        className="flex-[2] py-3 bg-tertiary text-on-tertiary rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save to Journal"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Recycle Bin</p>
                    {deletedEntries.length === 0 && <p className="text-sm text-on-surface-variant border border-dashed border-outline-variant/50 rounded-xl p-6 text-center">Recycle bin is empty.</p>}
                    
                    {deletedEntries.map((e) => (
                        <div key={e._id} className="bg-surface-container-low border border-outline-variant/30 p-5 rounded-2xl flex flex-col gap-3 opacity-70">
                            <div className="text-on-surface-variant text-sm whitespace-pre-wrap font-handwriting">{e.text}</div>
                            <div className="flex gap-2 justify-end border-t border-outline-variant/20 pt-3">
                                <button onClick={() => handleRestore(e._id)} className="text-xs px-3 py-1.5 bg-surface border border-outline-variant/40 rounded-full hover:bg-surface-container text-on-surface transition-all">Restore</button>
                                <button onClick={() => handlePermanentDelete(e._id)} className="text-xs px-3 py-1.5 bg-error-container text-on-error-container rounded-full hover:shadow-md transition-all">Permanent Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Journal;