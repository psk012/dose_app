function Dose({ dose }) {
    const levels = [
        { name: "Dopamine", key: "dopamine", color: "bg-primary", icon: "bolt" },
        { name: "Oxytocin", key: "oxytocin", color: "bg-secondary", icon: "favorite" },
        { name: "Serotonin", key: "serotonin", color: "bg-primary", icon: "sunny" },
        { name: "Endorphin", key: "endorphin", color: "bg-tertiary", icon: "directions_run" },
    ];

    return (
        <div className="bg-surface-container-lowest rounded-xl p-5">
            <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-4">
                Your DOSE Levels
            </h2>

            <div className="space-y-4">
                {levels.map((item) => (
                    <div key={item.name}>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                                    {item.icon}
                                </span>
                                <span className="text-sm font-medium text-on-surface">
                                    {item.name}
                                </span>
                            </div>
                            <span className="text-xs font-semibold text-on-surface-variant">
                                {dose[item.key]}%
                            </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div
                                className={`${item.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${dose[item.key]}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dose;