/**
 * IllustrationContainer
 * Wraps a single illustration (SVG or image) with optional breathing animation.
 * Keeps illustrations consistently sized and centered.
 *
 * Props:
 *   breathing — enables the slow scale 1 → 1.03 → 1 loop
 *   className — additional Tailwind classes
 *
 * Usage:
 *   <IllustrationContainer breathing>
 *     <svg>...</svg>
 *   </IllustrationContainer>
 */
export default function IllustrationContainer({ children, breathing = false, className = "" }) {
    return (
        <div
            className={`inline-flex items-center justify-center ${breathing ? "animate-illustration-breathe" : ""} ${className}`}
        >
            {children}
        </div>
    );
}
