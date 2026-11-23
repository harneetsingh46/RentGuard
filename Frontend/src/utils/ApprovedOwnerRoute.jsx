import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ApprovedOwnerRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-medium">Loading...</p>
      </div>
    );
  }

  if (user?.role === "owner" && user?.verificationStatus !== "approved") {
    return <Navigate to="/owner/verification" replace />;
  }

  return <Outlet />;
};

export default ApprovedOwnerRoute;
