
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { notify } from "../../utils/notify";
import apiClient from "../../ApiClient/interceptor";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Search,
  FileCheck,
  AlertCircle,
  X,
  UserCheck,
} from "lucide-react";

const TenantDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [moveOutRequest, setMoveOutRequest] = useState(null);
  const [submittingMoveOutRequest, setSubmittingMoveOutRequest] = useState(false);
  const [moveOutRequestError, setMoveOutRequestError] = useState("");
  const [moveOutModalOpen, setMoveOutModalOpen] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState("");
  const [moveOutModalError, setMoveOutModalError] = useState("");
  const [myApplications, setMyApplications] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, request: null, error: "" });
  const [processingConfirm, setProcessingConfirm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);

  // Fetch dashboard information
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      setPaymentError("");

      const results = await Promise.allSettled([
        apiClient.get("/tenant/dashboard"),
        apiClient.get("/order/unpaid-bills"),
        apiClient.get("/payment/my-payments"),
        apiClient.get("/tenant/me/move-out-request"),
        apiClient.get("/rental-request/my-requests"),
      ]);

      // Dashboard information is required
      if (results[0].status === "rejected") {
        throw results[0].reason;
      }

      setDashboard(results[0].value.data.data);

      // Fetch unpaid bills
      if (results[1].status === "fulfilled") {
        setUnpaidBills(results[1].value.data.data || []);
      } else {
        setPaymentError("Unable to load your unpaid bills.");
      }

      // Fetch payment history
      if (results[2].status === "fulfilled") {
        setPayments(results[2].value.data.data || []);
      } else {
        setPaymentError((previous) =>
          previous
            ? `${previous} Payment history is unavailable.`
            : "Payment history is unavailable."
        );
      }

      if (results[3].status === "fulfilled") {
        const raw = results[3].value.data.data;
        setMoveOutRequest(raw?.moveOutRequest || raw || null);
      } else if (results[3].reason?.response?.status !== 404) {
        setMoveOutRequestError(
          results[3].reason?.response?.data?.message ||
          "Unable to load your move-out request status."
        );
      }

      if (results[4].status === "fulfilled") {
        const myApps = results[4].value.data.data || [];
        setMyApplications(myApps);
      }
    } catch (err) {
      console.error("Tenant dashboard error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  const maxDateStr = (() => {
    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    const y = max.getFullYear();
    const m = String(max.getMonth() + 1).padStart(2, "0");
    const d = String(max.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  const submitMoveOutRequest = async (e) => {
    if (e) e.preventDefault();
    if (!moveOutDate) {
      setMoveOutModalError("Please select your last day at this property.");
      return;
    }

    try {
      setSubmittingMoveOutRequest(true);
      setMoveOutModalError("");
      const response = await apiClient.post("/tenant/me/move-out-request", {
        moveOutDate,
      });
      const raw = response.data.data;
      setMoveOutRequest(raw?.moveOutRequest || raw || null);
      notify.success(response.data.message || "Move-out request submitted successfully.");
      setMoveOutModalOpen(false);
      setMoveOutDate("");
      setMoveOutRequestError("");
    } catch (err) {
      setMoveOutModalError(
        err.response?.data?.message || "Unable to submit your move-out request."
      );
    } finally {
      setSubmittingMoveOutRequest(false);
    }
  };

  const handleConfirmAcceptLease = async (requestToConfirm) => {
    const target = requestToConfirm || confirmModal.request;
    if (!target?._id) return;

    try {
      setProcessingConfirm(true);
      setConfirmModal((prev) => ({ ...prev, error: "" }));
      const res = await apiClient.patch(`/rental-request/${target._id}/accept`);
      notify.success(
        res.data.message ||
          "Congratulations! Lease confirmed. Other applications have been cancelled."
      );
      setConfirmModal({ open: false, request: null, error: "" });
      await fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to confirm lease.";
      setConfirmModal((prev) => ({ ...prev, error: msg }));
      notify.error(msg);
    } finally {
      setProcessingConfirm(false);
    }
  };

  const handleDeclineOffer = async (requestId) => {
    if (!window.confirm("Are you sure you want to decline this rental offer?")) return;

    try {
      setProcessingConfirm(true);
      await apiClient.patch(`/rental-request/${requestId}/decline`);
      notify.success("Rental offer declined.");
      setConfirmModal({ open: false, request: null, error: "" });
      await fetchDashboardData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to decline offer.");
    } finally {
      setProcessingConfirm(false);
    }
  };

  const handleCancelApplication = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this application?")) return;

    try {
      await apiClient.patch(`/rental-request/${requestId}/cancel`);
      notify.success("Application cancelled successfully.");
      await fetchDashboardData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to cancel application.");
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Download a paid payment receipt
  const downloadReceipt = async (payment) => {
    try {
      setDownloadingReceiptId(payment._id);
      setReceiptError("");

      const response = await apiClient.get(
        `/payment/my-payments/${payment._id}/receipt`,
        { responseType: "blob" }
      );

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = `RentGuard-Receipt-${payment._id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("Receipt download error:", err);
      setReceiptError(
        "Unable to download this receipt. Please try again."
      );
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const tenant = dashboard?.tenant;
  const property = dashboard?.property;
  const unit = dashboard?.unit;
  const locked = Boolean(unit);

  const approvedOffers = useMemo(
    () => myApplications.filter((a) => a.status === "Approved"),
    [myApplications]
  );

  const propertyName =
    property?.propertyName || property?.name || (unit ? "Property" : "Not assigned");

  const unitName =
    unit?.unitName ||
    unit?.unitNumber ||
    unit?.name ||
    unit?.number ||
    (unit ? "Unit" : "Not assigned");

  const fullAddress = property?.address || (unit ? "Address not available" : "Not currently leasing");

  // Calculate total outstanding amount
  const outstandingAmount = useMemo(
    () =>
      unpaidBills.reduce(
        (total, bill) => total + Number(bill.amount || 0),
        0
      ),
    [unpaidBills]
  );

  // Monthly rent from Unit
  const monthlyRent = unit?.rent || 0;

  // Find the nearest due date
  const nextDueDate = useMemo(() => {
    if (!unpaidBills.length) return null;

    return [...unpaidBills].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    )[0]?.dueDate;
  }, [unpaidBills]);

  // Get recent payments
  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort(
          (a, b) =>
            new Date(b.paidAt || b.createdAt) -
            new Date(a.paidAt || a.createdAt)
        ),
    [payments]
  );

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] p-6 text-[#171717] sm:p-10 dark:bg-[#101010] dark:text-[#F1F0ED]">
        <div className="mx-auto max-w-[1600px]">
          <h1 className="mt-6 text-3xl font-normal tracking-tight sm:text-5xl">
            Your home. Your peace of mind.
          </h1>

          <p className="mt-4 text-sm text-stone-500 dark:text-[#A5A5A5]">
            Loading your rental information...
          </p>

          <div className="mt-8 h-64 animate-pulse bg-stone-200/70 dark:bg-neutral-800" />
        </div>
      </div>
    );
  }

  // Dashboard error screen
  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] p-6 text-[#171717] sm:p-10 dark:bg-[#101010] dark:text-[#F1F0ED]">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-[#A5A5A5]">
            RentGuard
          </p>

          <h1 className="mt-6 text-3xl font-normal tracking-tight sm:text-5xl">
            Your home. Your peace of mind.
          </h1>

          <div className="mt-8 border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717]">
            <h2 className="text-lg font-medium">
              Unable to load your dashboard
            </h2>

            <p className="mt-2 text-sm text-stone-500 dark:text-[#A5A5A5]">
              {error || "Dashboard information is not available."}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 bg-[#171717] px-5 py-3 text-sm text-white transition hover:bg-stone-700 dark:bg-[#f9c83d] dark:text-[#171717] dark:hover:bg-[#edbb2f]"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">
      <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">

        {/* Header */}
        <header className="mb-6 flex flex-col justify-between gap-4 sm:mb-9 sm:gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="mt-3 text-2xl font-normal leading-tight tracking-tight [overflow-wrap:anywhere] sm:mt-4 sm:text-4xl lg:text-[42px]">
              Your home. Your peace of mind.
            </h1>

            <p className="mt-3 text-sm text-stone-500 dark:text-[#A5A5A5] sm:text-base">
              Hi {tenant?.fullName?.split(" ")[0] || "there"}. Manage your
              rental, simply and securely.
            </p>
          </div>

          <div className="flex min-w-0 items-start gap-3 lg:max-w-[300px]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="mt-1 h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5.5 9v11h13V9M9 20v-7h6v7" />
            </svg>

            <div className="min-w-0">
              <p className="text-sm font-medium">
                {unit ? `${propertyName} · ${unitName}` : "No assigned unit"}
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-[#A5A5A5]">
                {unit ? fullAddress : "Not currently leasing a property"}
              </p>
            </div>
          </div>
        </header>

        {/* Lease offers awaiting your confirmation */}
        {approvedOffers.length > 0 && (
          <section className="mb-6 rounded-xs border-2 border-yellow-400 bg-yellow-50/60 p-4 shadow-sm dark:border-yellow-500/70 dark:bg-yellow-950/20 sm:p-5">
            <div className="flex items-center gap-2 border-b border-yellow-200 pb-3 dark:border-yellow-900/50">
              <FileCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <h2 className="text-base font-bold text-gray-900 dark:text-yellow-300 sm:text-lg">
                Lease offers awaiting your confirmation
              </h2>
            </div>

            <div className="mt-4 divide-y divide-yellow-200/80 dark:divide-yellow-900/40">
              {approvedOffers.map((offer) => {
                const ownerName =
                  offer.owner?.fullName ||
                  offer.owner?.username ||
                  offer.owner?.name ||
                  "Property Owner";

                const approvedDate = offer.updatedAt || offer.reviewedAt || offer.createdAt;

                return (
                  <div
                    key={offer._id}
                    className="flex flex-col gap-4 py-4 first:pt-1 last:pb-1 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                          {offer.unit?.unitName || "Unit"}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-neutral-400">at</span>
                        <span className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                          {offer.property?.propertyName || "Property"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-neutral-400">
                        <span>
                          <strong className="font-semibold text-gray-900 dark:text-neutral-200">Rent:</strong>{" "}
                          {formatCurrency(offer.unit?.rent)}/mo
                        </span>
                        <span>·</span>
                        <span>
                          <strong className="font-semibold text-gray-900 dark:text-neutral-200">Owner:</strong>{" "}
                          {ownerName}
                        </span>
                        <span>·</span>
                        <span>
                          <strong className="font-semibold text-gray-900 dark:text-neutral-200">Approved:</strong>{" "}
                          {formatDateTime(approvedDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeclineOffer(offer._id)}
                          disabled={processingConfirm}
                          className="rounded-xs border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={locked || processingConfirm}
                          onClick={() => setConfirmModal({ open: true, request: offer, error: "" })}
                          className="inline-flex items-center justify-center rounded-xs bg-[#f9c83d] px-4 py-2 text-xs font-bold text-[#171717] hover:bg-[#edbb2f] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 disabled:opacity-70 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400 shadow-sm"
                        >
                          Confirm & Accept Lease
                        </button>
                      </div>
                      {locked && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Available after your current owner approves your move-out.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No active unit / self-registered tenant banner */}
        {!unit && (
          <div className="mb-6 rounded-xs border border-stone-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ready to rent a property?
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-[#A5A5A5]">
                  You don't have an active lease assigned yet. Explore available listings and send a request directly to owners.
                </p>
              </div>
              <Link
                to="/tenant/rentals"
                className="inline-flex shrink-0 items-center justify-center rounded-xs bg-yellow-300 px-5 py-2.5 text-xs font-bold text-black hover:bg-yellow-400 shadow"
              >
                Browse Available Properties &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Main Two Column Layout */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,0.95fr)] xl:gap-7">

          {/* LEFT COLUMN */}
          <div className="min-w-0">

            {/* Rental Overview */}
            <section className="relative min-w-0 overflow-hidden bg-[#141414] p-4 text-white sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-300">
                  Your rental overview
                </p>

                {unit ? (
                  <span className="inline-flex items-center gap-2 bg-[#3b3420] px-3 py-1.5 text-xs text-[#f9c83d]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f9c83d]" />
                    Active tenancy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-stone-800 px-3 py-1.5 text-xs text-stone-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                    No active lease
                  </span>
                )}
              </div>

              <div className="mt-8">
                <h2 className="mt-3 max-w-2xl text-3xl font-normal leading-tight tracking-tight text-[#f9c83d] sm:text-5xl lg:text-[58px]">
                  {tenant?.fullName || "Tenant"}
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/15 pt-5 sm:mt-8 sm:grid-cols-2 sm:gap-5">
                <div>
                  <p className="text-xs text-stone-400">Property</p>

                  <p className="mt-2 text-base font-medium">
                    {unit ? propertyName : "Not assigned"}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-stone-400">Unit</p>

                  <p className="mt-2 text-base font-medium">
                    {unit ? unitName : "Not assigned"}
                  </p>
                </div>
              </div>
            </section>

            {/* Payment History */}
            <section className="mt-4 min-w-0 bg-white p-3 shadow-sm shadow-stone-200/40 dark:bg-[#171717] dark:shadow-none sm:mt-7 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-normal tracking-tight">
                    Payment history
                  </h2>

                  <p className="mt-1 text-xs text-stone-500 dark:text-[#A5A5A5]">
                    Review your recent rental payments.
                  </p>
                </div>

                <Link
                  to="/tenant/bills"
                  className="inline-flex w-full items-center justify-center gap-2 border border-stone-200 bg-yellow-300 px-3 py-2.5 text-sm font-medium text-black transition hover:border-stone-400 sm:w-auto sm:px-4 dark:border-neutral-700 dark:bg-[#242424] dark:text-[#F1F0ED] dark:hover:border-neutral-500 dark:hover:bg-[#2D2D2D]"
                >
                  Pay bills →
                </Link>
              </div>

              {paymentError && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {paymentError}
                </p>
              )}

              {receiptError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {receiptError}
                </p>
              )}

              {/* Compact payment cards for phones */}
              <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:hidden">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <article
                      key={payment._id}
                      className="min-w-0 border border-stone-200 bg-white p-3 dark:border-neutral-700 dark:bg-[#1D1D1D]"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {payment.order?.items?.length || 0} bill(s)
                          </p>
                          <p className="mt-1 break-all text-xs text-stone-500 dark:text-[#A5A5A5]">
                            {payment.razorpayPaymentId || "Payment record"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-1 text-[11px] font-medium capitalize ${
                            payment.status === "paid"
                              ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                              : payment.status === "failed"
                                ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-stone-200 pt-3 dark:border-neutral-800">
                        <div>
                          <p className="text-xs text-stone-500 dark:text-[#A5A5A5]">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </p>
                          <p className="mt-1 text-base font-semibold">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        {payment.status === "paid" && (
                          <button
                            type="button"
                            onClick={() => downloadReceipt(payment)}
                            disabled={downloadingReceiptId === payment._id}
                            className="max-w-full border border-stone-300 px-3 py-2 text-xs font-medium transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-[#242424] dark:text-[#F1F0ED] dark:hover:bg-[#303030]"
                          >
                            {downloadingReceiptId === payment._id
                              ? "Downloading..."
                              : "Download receipt"}
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-stone-500 dark:text-[#A5A5A5]">
                    No payment records found.
                  </p>
                )}
              </div>

              {/* Full table from small tablets upward */}
              <div className="mt-5 hidden max-h-[420px] overflow-auto overscroll-contain border-y border-stone-200 dark:border-neutral-700 sm:block">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-stone-200 bg-[#f7f5f0] font-medium text-[10px] uppercase tracking-wider text-stone-600 dark:border-neutral-700 dark:bg-[#222222] dark:text-[#C4C4C4]">
                      <th className="px-3 py-4 font-normal">
                        Transaction
                      </th>

                      <th className="px-3 py-4 font-normal">
                        Date
                      </th>

                      <th className="px-3 py-4 font-normal">
                        Amount
                      </th>

                      <th className="px-3 py-4 text-right font-normal">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentPayments.length > 0 ? (
                      recentPayments.map((payment) => (
                        <tr
                          key={payment._id}
                          className="border-b border-stone-200/70 transition-colors hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-[#202020]"
                        >
                          <td className="px-3 py-5">
                            <p className="font-medium">
                              {payment.order?.items?.length || 0} bill(s)
                            </p>

                            <p className="mt-1 text-xs text-stone-500 dark:text-[#A5A5A5]">
                              {payment.razorpayPaymentId || "Payment record"}
                            </p>
                          </td>

                          <td className="px-3 py-5 text-stone-500 dark:text-[#A5A5A5]">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>

                          <td className="px-3 py-5 font-medium">
                            {formatCurrency(payment.amount)}
                          </td>

                          <td className="px-3 py-5 text-right">
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`inline-flex px-2.5 py-1 text-xs font-medium capitalize ${payment.status === "paid"
                                  ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                                  : payment.status === "failed"
                                    ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                                  }`}
                              >
                                {payment.status}
                              </span>

                              {payment.status === "paid" && (
                                <button
                                  type="button"
                                  onClick={() => downloadReceipt(payment)}
                                  disabled={downloadingReceiptId === payment._id}
                                  className="border border-stone-300 px-3 py-1.5 text-xs font-medium transition hover:border-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-[#242424] dark:text-[#F1F0ED] dark:hover:border-neutral-500 dark:hover:bg-[#303030]"
                                >
                                  {downloadingReceiptId === payment._id
                                    ? "Downloading..."
                                    : "Download receipt"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-3 py-10 text-center text-sm text-stone-500 dark:text-[#A5A5A5]"
                        >
                          No payment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-[#A5A5A5]">
                Your recent payment transactions are displayed here.
              </p>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="min-w-0 h-full border border-stone-200 bg-white p-4 sm:p-7 dark:border-neutral-800 dark:bg-[#171717]">

            {/* Rent and Payments */}
            <div className="flex items-center lg:py-6 justify-between gap-3">
              <h2 className="text-xl font-normal tracking-tight sm:text-2xl">
                Rent & payments
              </h2>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5 shrink-0 text-stone-500 dark:text-[#A5A5A5]"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="1" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
              </svg>
            </div>

            <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
              {unit
                ? "View your rental charges, outstanding bills and payment information."
                : "Once your rental application is approved and confirmed, your bills and rent schedule will appear here."}
            </p>

            {/* Outstanding Bills */}
            <div className="mt-4 border border-stone-200 p-5 dark:border-neutral-800">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-stone-500 dark:text-[#A5A5A5]">
                  Outstanding bills
                </p>

                <span className="bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
                  {unpaidBills.length} unpaid
                </span>
              </div>

              <p className="mt-3 text-3xl font-normal tracking-tight">
                {formatCurrency(outstandingAmount)}
              </p>

              <p className="mt-2 text-xs text-stone-500 dark:text-[#A5A5A5]">
                {unit ? "Total amount awaiting payment." : "No outstanding bills (No active lease)."}
              </p>
            </div>

            {/* Next Due Date */}
            <div className="mt-4 border border-stone-200 p-5 dark:border-neutral-800">
              <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-stone-500 dark:text-[#A5A5A5]">
                Next due date
              </p>

              <p className="mt-3 text-xl font-medium">
                {formatDate(nextDueDate)}
              </p>

              <p className="mt-2 text-xs text-stone-500 dark:text-[#A5A5A5]">
                {nextDueDate
                  ? "Upcoming unpaid bill due date."
                  : "No upcoming unpaid bills."}
              </p>
            </div>

            {/* Pay Bills / Browse Button */}
            {unit ? (
              <Link
                to="/tenant/bills"
                className="mt-4 flex w-full items-center justify-center gap-2 bg-[#f9c83d] px-5 py-3.5 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
              >
                Pay Rent & Bills →
              </Link>
            ) : (
              <Link
                to="/tenant/rentals"
                className="mt-4 flex w-full items-center justify-center gap-2 bg-[#f9c83d] px-5 py-3.5 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
              >
                Browse Available Properties →
              </Link>
            )}
          </aside>
        </div>

        {/* Move-out request (only applicable when tenant has an active assigned unit) */}
        {unit && (
          <section className="mt-5 w-full min-w-0 border border-stone-200 bg-white p-4 sm:mt-7 sm:p-6 dark:border-neutral-800 dark:bg-[#171717]">
            <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-[#A5A5A5]">
                  Tenancy
                </p>
                <h2 className="mt-2 text-xl font-normal tracking-tight">
                  Move-out request
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
                  If you plan to leave this property, submit a request to your owner.
                  The request remains valid for 48 hours. Your tenancy only ends after
                  the owner approves it and confirms that all bills are paid.
                </p>
              </div>
            </div>

            {moveOutRequestError && (
              <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                {moveOutRequestError}
              </p>
            )}

            <div className="mt-5 border-t border-stone-200 pt-4 dark:border-neutral-800">
              {moveOutRequest?.status === "pending" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex w-fit shrink-0 px-3 py-1 text-xs font-medium capitalize bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                      Pending
                    </span>
                    <span className="text-sm font-medium text-stone-800 dark:text-neutral-200">
                      Last day: {formatDate(moveOutRequest.requestedMoveOutDate)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-[#A5A5A5]">
                    Valid until {formatDateTime(moveOutRequest.expiresAt)}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-[#A5A5A5]">
                    You remain an active tenant until the owner approves the request.
                  </p>
                </div>
              )}

              {moveOutRequest?.status === "approved" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex w-fit shrink-0 px-3 py-1 text-xs font-medium capitalize bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400 border border-green-200 dark:border-green-800/60">
                      Approved
                    </span>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Approved on {formatDateTime(moveOutRequest.reviewedAt)}
                    </span>
                  </div>
                </div>
              )}

              {moveOutRequest?.status === "rejected" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-fit shrink-0 px-3 py-1 text-xs font-medium capitalize bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                      Rejected
                    </span>
                  </div>
                  <div className="border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      Your move-out request was rejected.
                    </p>
                    {moveOutRequest.rejectionReason && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                        Reason: {moveOutRequest.rejectionReason}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-red-600 dark:text-red-300">
                      Your pending rental applications were cancelled.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMoveOutDate("");
                      setMoveOutModalError("");
                      setMoveOutModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center bg-[#f9c83d] px-5 py-2.5 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
                  >
                    Submit new request
                  </button>
                </div>
              )}

              {moveOutRequest?.status === "expired" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-fit shrink-0 px-3 py-1 text-xs font-medium capitalize bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-neutral-300 border border-stone-200 dark:border-neutral-700">
                      Expired
                    </span>
                  </div>
                  <div className="border border-stone-200 bg-stone-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      This request expired.
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-[#A5A5A5]">
                      Your pending rental applications were cancelled.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMoveOutDate("");
                      setMoveOutModalError("");
                      setMoveOutModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center bg-[#f9c83d] px-5 py-2.5 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
                  >
                    Submit new request
                  </button>
                </div>
              )}

              {(!moveOutRequest || !moveOutRequest.status || moveOutRequest.status === "none") && (
                <button
                  type="button"
                  onClick={() => {
                    setMoveOutDate("");
                    setMoveOutModalError("");
                    setMoveOutModalOpen(true);
                  }}
                  className="inline-flex w-full items-center justify-center bg-[#f9c83d] px-5 py-3 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f] sm:w-auto"
                >
                  Submit move-out request
                </button>
              )}
            </div>
          </section>
        )}

        {/* Move-out Request Confirmation Modal */}
        {moveOutModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            {/* Outside click must NOT close the modal */}
            <div
              className="w-full max-w-md border border-stone-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-[#171717]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Request Move-out
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMoveOutModalOpen(false);
                    setMoveOutModalError("");
                  }}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitMoveOutRequest} className="mt-4 space-y-4">
                <p className="text-xs leading-5 text-stone-600 dark:text-[#A5A5A5]">
                  This request is valid for 48 hours. Your tenancy ends only after your owner approves it and all bills are paid.
                </p>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-700 dark:text-neutral-300">
                    Last day at this property <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    max={maxDateStr}
                    value={moveOutDate}
                    onChange={(e) => {
                      setMoveOutDate(e.target.value);
                      if (moveOutModalError) setMoveOutModalError("");
                    }}
                    className="mt-1.5 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-yellow-400 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>

                {moveOutModalError && (
                  <div role="alert" className="border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                    {moveOutModalError}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submittingMoveOutRequest}
                    onClick={() => {
                      setMoveOutModalOpen(false);
                      setMoveOutModalError("");
                    }}
                    className="border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMoveOutRequest || !moveOutDate}
                    className="bg-[#f9c83d] px-4 py-2 text-xs font-semibold text-[#171717] hover:bg-[#edbb2f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingMoveOutRequest ? "Submitting..." : "Confirm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Lease Modal */}
        {confirmModal.open && confirmModal.request && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            {/* Outside click must NOT close the modal */}
            <div
              className="w-full max-w-md border border-stone-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-[#171717]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Confirm Lease Acceptance
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: false, request: null, error: "" })}
                  disabled={processingConfirm}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-xs text-stone-600 dark:text-[#A5A5A5]">
                  Please review the tenancy details before confirming. Accepting this lease will activate your tenancy and cancel all other open applications.
                </p>

                <div className="rounded border border-stone-200 bg-stone-50 p-3.5 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-neutral-400">Unit:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {confirmModal.request.unit?.unitName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-neutral-400">Property:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {confirmModal.request.property?.propertyName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-neutral-400">Monthly Rent:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(confirmModal.request.unit?.rent)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-neutral-400">Move-in Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {confirmModal.request.moveInDate
                          ? formatDate(confirmModal.request.moveInDate)
                          : "Immediate"}
                      </span>
                    </div>
                  </div>
                </div>

                {confirmModal.error && (
                  <div role="alert" className="border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                    {confirmModal.error}
                  </div>
                )}

                {locked && (
                  <div className="border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300">
                    Available after your current owner approves your move-out.
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeclineOffer(confirmModal.request._id)}
                  disabled={processingConfirm}
                  className="border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  Decline Offer
                </button>
                <button
                  type="button"
                  disabled={locked || processingConfirm}
                  onClick={() => handleConfirmAcceptLease(confirmModal.request)}
                  className="bg-[#f9c83d] px-4 py-2 text-xs font-bold text-[#171717] hover:bg-[#edbb2f] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 disabled:opacity-70 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400"
                >
                  {processingConfirm ? "Confirming..." : "Confirm & Accept Lease"}
                </button>
              </div>
              {locked && (
                <p className="mt-2 text-right text-[11px] text-amber-700 dark:text-amber-400">
                  Available after your current owner approves your move-out.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-stone-200 py-5 text-xs text-stone-500 sm:flex-row sm:items-center dark:border-neutral-800 dark:text-[#A5A5A5]">
          <p>RentGuard · Your rental, made simpler.</p>
          <p>{formatDate(new Date())}</p>
        </footer>
      </main>
    </div>
  );
};

export default TenantDashboard;
