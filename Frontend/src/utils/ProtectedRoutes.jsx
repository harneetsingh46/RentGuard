import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoutes = ({ requiredRole }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <p className="items-center font-normal">Loading...</p>;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        if (user.role === "owner") {
            return <Navigate to="/owner/dashboard" replace />;
        }

        if (user.role === "tenant") {
            return <Navigate to="/tenant/dashboard" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;