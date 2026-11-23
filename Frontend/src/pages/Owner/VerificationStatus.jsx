import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Clock, AlertTriangle, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";

const VerificationStatus = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState("");

  const status = user?.verificationStatus || "pending";
  const rejectionReason = user?.verificationRejectionReason;

  useEffect(() => {
    if (user?.role === "owner" && user?.verificationStatus === "approved") {
      navigate("/owner/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleCheckStatus = async () => {
    try {
      setRefreshing(true);
      setFeedback("");
      const updated = await refreshUser();
      if (updated?.verificationStatus === "approved") {
        navigate("/owner/dashboard", { replace: true });
      } else if (updated?.verificationStatus === "rejected") {
        setFeedback("Your application was rejected by an admin.");
      } else {
        setFeedback("Your account is still awaiting verification.");
      }
    } catch {
      setFeedback("Unable to check status right now. Please try again shortly.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-[#373737] dark:bg-[#1B1B1B] sm:p-8">
        {status === "approved" ? (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Account Approved!
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your owner account has been verified. You now have full access to your owner portal.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate("/owner/dashboard")}
                className="inline-flex items-center justify-center gap-2 rounded-xs bg-yellow-300 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : status === "rejected" ? (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle size={36} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Verification Rejected
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your owner verification was reviewed and could not be approved at this time.
            </p>

            <div className="my-5 rounded-md border border-red-200 bg-red-50 p-4 text-left dark:border-red-900/50 dark:bg-red-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-800 dark:text-red-300">
                Reason for rejection
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-200">
                {rejectionReason || "No specific reason was provided by the administrator."}
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              If you believe this was an error or would like to re-submit documentation, please{" "}
              <Link
                to="/contact"
                className="font-semibold text-yellow-600 underline hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
              >
                contact support
              </Link>
              .
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xs bg-yellow-300 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Checking..." : "Check status again"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Clock size={36} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Verification Pending
            </h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
              Your account is awaiting admin verification. You will get an email once approved.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xs bg-yellow-300 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Checking..." : "Check status again"}
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <p className="mt-4 text-xs font-medium text-gray-600 dark:text-gray-400">
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus;
