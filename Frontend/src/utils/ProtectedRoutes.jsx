
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoutes = ({ requiredRole }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="font-medium">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to={requiredRole === "admin" ? "/admin/login" : "/login"}
                replace
            />
        );
    }

    if (requiredRole && user.role !== requiredRole) {
        if (user.role === "admin") {
            return <Navigate to="/admin/dashboard" replace />;
        }

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