import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();

    // Keep localStorage in sync whenever token changes
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    function login(newToken) {
        setToken(newToken);
    }

    function logout() {
        setLoggingOut(true);
        setTimeout(() => {
            setToken(null);
            setLoggingOut(false);
            navigate("/login");
        }, 2500);
    }

    const value = {
        token,
        isAuthenticated: !!token,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {loggingOut && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-surface/90 backdrop-blur-md animate-fade-in transition-opacity">
                    <div className="text-center animate-float">
                        <span className="material-symbols-outlined text-5xl text-primary mb-4 block">self_improvement</span>
                        <h2 className="font-handwriting text-5xl text-on-surface mb-2">You're doing better than you think.</h2>
                        <p className="text-on-surface-variant font-headline italic mt-4 text-lg">Take a deep breath. See you soon.</p>
                    </div>
                </div>
            )}
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
