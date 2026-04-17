/**
 * PageTransitionWrapper
 * Wraps a full page with a gentle fade + slide-up entry animation.
 * CSS-only — no runtime overhead beyond the initial paint.
 *
 * Usage:
 *   <PageTransitionWrapper>
 *     <div className="min-h-screen ...">page content</div>
 *   </PageTransitionWrapper>
 */
export default function PageTransitionWrapper({ children, className = "" }) {
    return (
        <div className={`animate-gentle-entry ${className}`}>
            {children}
        </div>
    );
}
