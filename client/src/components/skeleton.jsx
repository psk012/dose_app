export const SkeletonText = ({ lines = 1, className = "" }) => (
    <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div 
                key={i} 
                className={`h-4 bg-surface-container-high/50 rounded-full overflow-hidden relative ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`}
            >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-variant/20 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
        ))}
    </div>
);

export const SkeletonContact = ({ className = "" }) => (
    <div className={`p-4 bg-surface-container-low rounded-2xl flex gap-3 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-surface-container-high/50 overflow-hidden relative shrink-0">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-variant/20 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
        <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-1/3 bg-surface-container-high/50 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-variant/20 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="h-3 w-1/2 bg-surface-container-high/50 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-variant/20 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="flex gap-2 mt-3">
                <div className="h-5 w-20 bg-surface-container-high/50 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-variant/20 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
                <div className="h-5 w-24 bg-surface-container-high/50 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-variant/20 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
            </div>
        </div>
    </div>
);

export const SkeletonCard = ({ className = "" }) => (
    <div className={`p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/20 ${className}`}>
        <div className="h-5 w-3/4 bg-surface-container-high/50 rounded-full overflow-hidden relative mb-3">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-variant/20 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
        <SkeletonText lines={2} />
    </div>
);
