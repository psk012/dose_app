function Mood({ mood, setMood, updateDose }) {
    const moods = [
        { name: "Calm", icon: "spa", description: "Peaceful" },
        { name: "Heavy", icon: "cloud", description: "Weighted" },
        { name: "Low", icon: "water_drop", description: "Drained" },
        { name: "Scattered", icon: "auto_awesome", description: "Unfocused" },
    ];

    return (
        <div className="bg-surface-container-lowest rounded-xl p-5">
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-4">
                How are you feeling?
            </h2>

            <div className="grid grid-cols-2 gap-3">
                {moods.map((m) => {
                    const isSelected = mood === m.name;
                    return (
                        <button
                            key={m.name}
                            onClick={() => {
                                setMood(m.name);
                                updateDose(m.name);
                            }}
                            className={`flex flex-col items-start p-4 rounded-xl transition-all text-left cursor-pointer group ${
                                isSelected
                                    ? "bg-primary text-on-primary scale-[1.02] shadow-md"
                                    : "bg-primary-container text-on-primary-container hover:bg-primary-container/80"
                            }`}
                        >
                            <span
                                className={`material-symbols-outlined mb-2 transition-transform ${
                                    isSelected ? "text-on-primary" : "text-primary group-hover:scale-110"
                                }`}
                                style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {m.icon}
                            </span>
                            <span className={`text-sm ${isSelected ? "font-semibold" : "font-medium"}`}>
                                {m.name}
                            </span>
                            <span className={`text-xs mt-0.5 ${isSelected ? "text-on-primary/80" : "text-on-primary-container/70"}`}>
                                {m.description}
                            </span>
                        </button>
                    );
                })}
            </div>

            {mood && (
                <div className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    Feeling <span className="font-semibold text-primary">{mood}</span>
                </div>
            )}
        </div>
    );
}

export default Mood;