import React from "react";

export default function ComfortZoneCard({ step, icon, title, text, subtext, index }) {
    return (
        <div 
            className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm flex gap-4 animate-spring-up"
            style={{ 
                animationFillMode: 'both', 
                animationDelay: `${index * 120}ms` 
            }}
        >
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-on-surface-variant/50 tracking-widest">{step}</span>
                <div className="w-10 h-10 rounded-full bg-primary-container/40 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
            </div>
            
            <div className="flex-1 mt-0.5">
                <h3 className="text-sm font-bold text-on-surface mb-1">{title}</h3>
                <p className="text-sm text-on-surface-variant/80 leading-relaxed">
                    {text}
                </p>
                {subtext && (
                    <div className="mt-3 p-3 bg-secondary-container/20 rounded-2xl border border-secondary/10">
                        <p className="text-xs font-medium text-on-secondary-container">
                            {subtext}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
