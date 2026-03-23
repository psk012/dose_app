import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { createTask, fetchTasks, toggleTask, deleteTask, getWrapped } from "../api/api";

function Tasks() {
    const { token } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [showWrapped, setShowWrapped] = useState(false);
    const [wrapped, setWrapped] = useState(null);
    const [wrappedLoading, setWrappedLoading] = useState(false);

    function getToday() {
        return new Date().toISOString().split("T")[0];
    }

    // Fetch tasks when date changes
    useEffect(() => {
        if (!token) return;
        setLoading(true);
        setError("");

        fetchTasks(token, selectedDate)
            .then((data) => setTasks(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [token, selectedDate]);

    async function handleAddTask() {
        if (!newTask.trim()) return;

        setSaving(true);
        try {
            const task = await createTask(token, newTask.trim(), selectedDate);
            setTasks((prev) => [...prev, task]);
            setNewTask("");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(taskId) {
        try {
            const updated = await toggleTask(token, taskId);
            setTasks((prev) =>
                prev.map((t) => (t._id === taskId ? { ...t, completed: updated.completed } : t))
            );
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(taskId) {
        try {
            await deleteTask(token, taskId);
            setTasks((prev) => prev.filter((t) => t._id !== taskId));
        } catch (err) {
            setError(err.message);
        }
    }

    async function loadWrapped() {
        setWrappedLoading(true);
        try {
            const data = await getWrapped(token);
            setWrapped(data);
            setShowWrapped(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setWrappedLoading(false);
        }
    }

    function navigateDate(offset) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + offset);
        setSelectedDate(d.toISOString().split("T")[0]);
    }

    // Win percentage
    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const winPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Is viewing today?
    const isToday = selectedDate === getToday();

    // Format date for display
    function formatDate(dateStr) {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }

    return (
        <div className="bg-surface-container-lowest rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                    Daily Tasks
                </h2>
                <button
                    onClick={loadWrapped}
                    disabled={wrappedLoading}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    {wrappedLoading ? "Loading..." : "My Wrapped"}
                </button>
            </div>

            {/* Date navigation */}
            <div className="flex items-center justify-between mb-4 bg-surface-container-low rounded-full px-2 py-1">
                <button
                    onClick={() => navigateDate(-1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <span className="text-sm font-medium text-on-surface">
                    {isToday ? "Today" : formatDate(selectedDate)}
                </span>
                <button
                    onClick={() => navigateDate(1)}
                    disabled={isToday}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>

            {/* Win percentage circle */}
            {totalCount > 0 && (
                <div className="flex items-center justify-center mb-5">
                    <div className="relative w-20 h-20">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e8e1da"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={winPercent >= 70 ? "#47645d" : winPercent >= 40 ? "#7c9a92" : "#7c5357"}
                                strokeWidth="3"
                                strokeDasharray={`${winPercent}, 100`}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dasharray 0.5s ease-out" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-on-surface">{winPercent}%</span>
                            <span className="text-[10px] text-on-surface-variant">win</span>
                        </div>
                    </div>
                    <div className="ml-4 text-sm text-on-surface-variant">
                        <p><span className="font-semibold text-on-surface">{completedCount}</span> of {totalCount} done</p>
                    </div>
                </div>
            )}

            {/* Add task input (only for today) */}
            {isToday && (
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Add a task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    />
                    <button
                        onClick={handleAddTask}
                        disabled={saving || !newTask.trim()}
                        className="px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                    <span className="material-symbols-outlined text-error text-lg">error</span>
                    <p className="text-on-error-container">{error}</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center gap-2 py-4 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Loading tasks...
                </div>
            )}

            {/* Task list */}
            {!loading && (
                <div className="space-y-2">
                    {tasks.length === 0 ? (
                        <div className="text-center py-6 text-on-surface-variant/60">
                            <span className="material-symbols-outlined text-4xl mb-2 block">task_alt</span>
                            <p className="text-sm">
                                {isToday ? "No tasks yet. Plan your day above!" : "No tasks for this day."}
                            </p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task._id}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                    task.completed
                                        ? "bg-primary-container/10"
                                        : "bg-surface-container-low"
                                }`}
                            >
                                <button
                                    onClick={() => handleToggle(task._id)}
                                    className="shrink-0 cursor-pointer"
                                >
                                    <span
                                        className={`material-symbols-outlined text-xl ${
                                            task.completed ? "text-primary" : "text-outline-variant"
                                        }`}
                                        style={task.completed ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    >
                                        {task.completed ? "check_circle" : "radio_button_unchecked"}
                                    </span>
                                </button>
                                <span
                                    className={`flex-1 text-sm ${
                                        task.completed
                                            ? "line-through text-on-surface-variant/60"
                                            : "text-on-surface"
                                    }`}
                                >
                                    {task.text}
                                </span>
                                {isToday && (
                                    <button
                                        onClick={() => handleDelete(task._id)}
                                        className="shrink-0 text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Wrapped modal */}
            {showWrapped && wrapped && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowWrapped(false)}>
                    <div
                        className="bg-surface w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <span className="material-symbols-outlined text-primary text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                                auto_awesome
                            </span>
                            <h3 className="font-handwriting text-3xl text-on-surface">Your Wrapped</h3>
                            <p className="font-headline italic text-sm text-on-surface-variant mt-1">
                                {wrapped.totalDays} days tracked
                            </p>
                        </div>

                        {wrapped.totalDays === 0 ? (
                            <p className="text-center text-sm text-on-surface-variant">
                                Complete some days first to see your wrapped stats!
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {/* Best Day */}
                                {wrapped.bestDay && (
                                    <div className="bg-primary-container/15 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-primary text-lg">emoji_events</span>
                                            <span className="text-xs uppercase tracking-widest font-semibold text-primary">Most Productive</span>
                                        </div>
                                        <p className="text-lg font-bold text-on-surface">{wrapped.bestDay.winPercent}% win</p>
                                        <p className="text-xs text-on-surface-variant">
                                            {formatDateLong(wrapped.bestDay.date)} — {wrapped.bestDay.completed}/{wrapped.bestDay.total} tasks
                                        </p>
                                    </div>
                                )}

                                {/* Worst Day */}
                                {wrapped.worstDay && (
                                    <div className="bg-secondary-container/15 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-secondary text-lg">trending_down</span>
                                            <span className="text-xs uppercase tracking-widest font-semibold text-secondary">Needs Love</span>
                                        </div>
                                        <p className="text-lg font-bold text-on-surface">{wrapped.worstDay.winPercent}% win</p>
                                        <p className="text-xs text-on-surface-variant">
                                            {formatDateLong(wrapped.worstDay.date)} — {wrapped.worstDay.completed}/{wrapped.worstDay.total} tasks
                                        </p>
                                    </div>
                                )}

                                {/* Average */}
                                <div className="bg-surface-container rounded-xl p-4 text-center">
                                    <p className="text-sm text-on-surface-variant">Average Win Rate</p>
                                    <p className="font-handwriting text-4xl text-on-surface">{wrapped.averageWinPercent}%</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowWrapped(false)}
                            className="w-full py-3 bg-primary-container text-on-primary-container rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatDateLong(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default Tasks;
