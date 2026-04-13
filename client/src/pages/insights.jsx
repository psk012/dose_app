import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";
import Mood from "../components/mood";
import { apiFetch, API_BASE } from "../api/api";

function Insights() {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Phase 9 & 10 States
    const [reflections, setReflections] = useState([]);
    const [tip, setTip] = useState("");
    const [reflectionsLoading, setReflectionsLoading] = useState(false);
    const [activeReflection, setActiveReflection] = useState(null);
    const [answer, setAnswer] = useState("");
    const [location, setLocation] = useState("");
    const [isSavingReflection, setIsSavingReflection] = useState(false);
    
    // Calendar & Journey States
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [activityDates, setActivityDates] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [currentMood, setCurrentMood] = useState("default");
    
    // Accurate Calendar State
    const [viewDate, setViewDate] = useState({
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    });



    const fetchInsights = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/insights/dashboard`, {
                headers: { Authorization: token }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error("Failed to fetch insights", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivity = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/reflections/activity`, {
                headers: { Authorization: token }
            });
            if (res.ok) {
                const result = await res.json();
                setActivityDates(result);
            }
        } catch (error) {
            console.error("Failed to fetch activity dates", error);
        }
    };

    const fetchHistoryForDate = async (date) => {
        setIsHistoryLoading(true);
        try {
            const res = await apiFetch(`${API_BASE}/reflections/${date}`, {
                headers: { Authorization: token }
            });
            if (res.ok) {
                const result = await res.json();
                setHistoryItems(result);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const fetchReflections = async (mood = "default") => {
        setCurrentMood(mood);
        setReflectionsLoading(true);
        try {
            const res = await apiFetch(`${API_BASE}/prompts/reflections`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({ mood })
            });
            if (res.ok) {
                const result = await res.json();
                setTip(result.tip || "");
                setReflections(result.prompts || []);
            }
        } catch (error) {
            console.error("Failed to fetch reflections", error);
        } finally {
            setReflectionsLoading(false);
        }
    };

    const handleDeleteReflection = async (id) => {
        if (!window.confirm("Are you sure you want to delete this reflection?")) return;
        try {
            const res = await apiFetch(`${API_BASE}/reflections/${id}`, {
                method: "DELETE",
                headers: { Authorization: token }
            });
            if (res.ok) {
                fetchActivity();
                fetchHistoryForDate(selectedDate);
                fetchInsights(); // Re-sync logs count
            }
        } catch (error) {
            console.error("Failed to delete reflection", error);
        }
    };

    const handleSaveReflection = async () => {
        if (!answer.trim()) return;
        setIsSavingReflection(true);
        try {
            const res = await apiFetch(`${API_BASE}/reflections`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({ 
                    prompt: activeReflection, 
                    response: answer, 
                    mood: currentMood,
                    location: location || "Unknown",
                    date: new Date().toISOString().split("T")[0]
                })
            });
            if (res.ok) {
                setAnswer("");
                setLocation("");
                setActiveReflection(null);
                fetchInsights();
                fetchActivity();
                if (selectedDate === new Date().toISOString().split("T")[0]) {
                    fetchHistoryForDate(selectedDate);
                }
            }
        } catch (error) {
            console.error("Failed to save reflection", error);
        } finally {
            setIsSavingReflection(false);
        }
    };

    const handleMonthChange = (offset) => {
        setViewDate(prev => {
            let newMonth = prev.month + offset;
            let newYear = prev.year;
            if (newMonth < 0) {
                newMonth = 11;
                newYear -= 1;
            } else if (newMonth > 11) {
                newMonth = 0;
                newYear += 1;
            }
            return { month: newMonth, year: newYear };
        });
    };

    useEffect(() => {
        if (token) {
            fetchInsights();
            fetchActivity();
            fetchHistoryForDate(selectedDate);
        }
    }, [token, selectedDate]);

    const handleMoodSaved = (mood) => {
        fetchInsights();
        fetchReflections(mood);
    };

    // Accurate Calendar Helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1).getDay();
    const days = Array.from({ length: getDaysInMonth(viewDate.year, viewDate.month) }, (_, i) => i + 1);

    return (
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden pb-32">
            <div className="max-w-md mx-auto px-6 py-8 md:py-12">
                <header className="mb-8 text-center">
                    <h1 className="font-handwriting text-4xl text-on-surface">Your Insights</h1>
                    <p className="text-on-surface-variant/80 mt-2 text-sm">Discover patterns in your emotional journey</p>
                </header>

                <div className="space-y-6">
                    {/* Log Mood Section */}
                    <Mood onMoodSaved={handleMoodSaved} />

                    {/* Actionable Tip */}
                    {tip && !reflectionsLoading && (
                        <div className="animate-fade-in py-3 px-5 bg-primary-container/20 border border-primary-container/30 rounded-2xl flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">lightbulb</span>
                            <p className="text-sm text-on-surface font-medium italic">"{tip}"</p>
                        </div>
                    )}

                    {!loading && data && (
                        <>
                        </>
                    )}

                    {/* Reflection Cards Section (Moved ABOVE Calendar) */}
                    <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-on-surface">
                            <span className="material-symbols-outlined text-secondary">forum</span>
                            Reflection Cards
                        </h2>
                        
                        <div className="space-y-4">
                            {reflectionsLoading ? (
                                <div className="space-y-3">
                                    <div className="h-16 w-full bg-surface-container-high animate-pulse rounded-2xl"></div>
                                    <div className="h-16 w-full bg-surface-container-high animate-pulse rounded-2xl"></div>
                                </div>
                            ) : reflections.length > 0 ? (
                                reflections.map((prompt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => {
                                            setActiveReflection(prompt);
                                            setAnswer("");
                                        }}
                                        className="w-full text-left p-4 rounded-2xl bg-secondary-container/20 border border-outline-variant/20 hover:bg-secondary-container/40 hover:border-secondary-container/50 text-on-surface transition-all active:scale-[0.98] group"
                                    >
                                        <p className="font-medium text-sm leading-relaxed group-hover:translate-x-1 transition-transform">{prompt}</p>
                                    </button>
                                ))
                            ) : (
                                <p className="text-xs text-center text-on-surface-variant italic">Log a mood to see unique reflection cards.</p>
                            )}
                        </div>
                    </div>

                    {/* Journey Calendar Section */}
                    <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-semibold text-lg flex items-center gap-2 text-on-surface">
                                <span className="material-symbols-outlined text-tertiary">calendar_month</span>
                                Journey Calendar
                            </h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleMonthChange(-1)}
                                    className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <button 
                                    onClick={() => handleMonthChange(1)}
                                    className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-4">
                            <p className="text-sm font-bold text-on-surface capitalize tracking-widest">
                                {new Date(viewDate.year, viewDate.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 mb-6">
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                <div key={d} className="text-center text-[10px] font-bold text-on-surface-variant/40 py-1">{d}</div>
                            ))}
                            
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-9"></div>
                            ))}

                            {days.map(d => {
                                const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const isSelected = selectedDate === dateStr;
                                const isToday = new Date().toISOString().split("T")[0] === dateStr;
                                const hasActivity = activityDates.includes(dateStr);
                                
                                return (
                                    <button 
                                        key={d} 
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`relative h-9 rounded-xl flex items-center justify-center text-xs font-medium transition-all ${
                                            isSelected ? 'bg-primary text-on-primary shadow-md' : 
                                            isToday ? 'bg-primary-container/30 text-primary border border-primary/20' :
                                            'hover:bg-surface-container-high'
                                        }`}
                                    >
                                        {d}
                                        {hasActivity && !isSelected && (
                                            <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-4 border-t border-outline-variant/20 pt-4">
                            <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest px-1">
                                {(() => {
                                    const d = new Date(selectedDate.replace(/-/g, '/'));
                                    const month = d.toLocaleDateString("en-US", { month: "short" });
                                    const day = d.getDate();
                                    const year = d.getFullYear();
                                    const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
                                    return `${month} ${day}${suffix}, ${year}`;
                                })()}
                            </p>
                            {isHistoryLoading ? (
                                <div className="space-y-3">
                                    <div className="h-10 animate-pulse bg-surface-container rounded-xl"></div>
                                </div>
                            ) : historyItems.length > 0 ? (
                                historyItems.map(item => (
                                    <div key={item._id} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 animate-fade-in group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[10px] uppercase font-black text-secondary tracking-tighter bg-secondary-container/30 px-2 py-0.5 rounded-md inline-block w-fit">{item.mood}</p>
                                                <span className="text-[10px] text-on-surface-variant/40 font-bold px-0.5">{item.location !== "Unknown" ? item.location : ""}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteReflection(item._id)}
                                                className="text-on-surface-variant/20 hover:text-error transition-colors p-1"
                                                title="Delete Reflection"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                        <p className="text-[13px] font-headline italic text-on-surface mb-2 leading-snug">"{item.prompt}"</p>
                                        <p className="text-[15px] text-on-surface-variant font-handwriting leading-relaxed group-hover:text-on-surface transition-colors">{item.response}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-6 text-xs text-on-surface-variant/60 italic font-medium">No journey entries found for this day.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reflection Notepad Modal */}
            {activeReflection && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/60 backdrop-blur-lg animate-fade-in">
                    <div className="w-full max-w-md bg-surface-container-lowest rounded-[2.5rem] p-8 border border-outline-variant/50 shadow-2xl animate-spring-up overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary to-primary/50"></div>
                        
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
                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                <input 
                                    placeholder="Enter Location..."
                                    className="bg-transparent border-none focus:outline-none placeholder:text-on-surface-variant/20 w-full"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <span className="material-symbols-outlined text-secondary text-3xl">auto_awesome_motion</span>
                            <button onClick={() => setActiveReflection(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <h3 className="font-headline italic text-on-surface text-xl leading-relaxed mb-6">"{activeReflection}"</h3>

                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Write your reflection here..."
                            className="w-full h-48 p-5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all resize-none text-base font-handwriting text-xl shadow-inner"
                            autoFocus
                        />

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setActiveReflection(null)} className="flex-1 h-14 rounded-full font-bold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all active:scale-95">Discard</button>
                            <button onClick={handleSaveReflection} disabled={isSavingReflection || !answer.trim()} className="flex-[2] h-14 bg-secondary text-on-secondary rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSavingReflection ? "Saving..." : "Save to Journey"}
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}

export default Insights;
