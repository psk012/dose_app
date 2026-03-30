import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        const hasVisited = localStorage.getItem("hasVisited");
        
        if (!hasVisited) {
            localStorage.setItem("hasVisited", "true");
            return <Navigate to="/signup" />;
        }
        
        return <Navigate to="/login" />;
    }

    return children;
}

export default ProtectedRoute;