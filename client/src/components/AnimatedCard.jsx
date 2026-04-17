/**
 * AnimatedCard
 * A centered content card with glassmorphism styling and gentle entry animation.
 * Matches the existing card language (backdrop-blur, rounded-[2rem], soft border).
 *
 * Props:
 *   delay  — ms before the entry animation starts (for staggering)
 *   className — additional Tailwind classes
 *
 * Usage:
 *   <AnimatedCard>
 *     <h1>Title</h1>
 *     <p>Body</p>
 *   </AnimatedCard>
 */
export default function AnimatedCard({ children, delay = 0, className = "" }) {
    return (
        <div
            className={`bg-surface-container-lowest/80 backdrop-blur-md rounded-[2rem] p-8 border border-outline-variant/20 shadow-sm animate-gentle-entry ${className}`}
            style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
        >
            {children}
        </div>
    );
}
