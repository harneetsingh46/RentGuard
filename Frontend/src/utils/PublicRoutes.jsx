import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoutes = () => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <p className="w-2xl mx-6 items-center m-9 text-center p-9 rounded font-medium">Loading...</p>;
    }

    if (isAuthenticated || user) {
        if (user.role === "owner") {
            return <Navigate to="/owner/dashboard" replace />;
        }

        if (user.role === "tenant") {
            return <Navigate to="/tenant/dashboard" replace />;
        }
    }

    return <Outlet />;
};

export default PublicRoutes;