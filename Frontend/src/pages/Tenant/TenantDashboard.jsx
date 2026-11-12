
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";

const TenantDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [moveOutRequest, setMoveOutRequest] = useState(null);
  const [submittingMoveOutRequest, setSubmittingMoveOutRequest] = useState(false);
  const [moveOutRequestError, setMoveOutRequestError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);

  // Fetch dashboard information
  useEffect(() => {
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
          setMoveOutRequest(results[3].value.data.data || null);
        } else if (results[3].reason?.response?.status !== 404) {
          setMoveOutRequestError(
            results[3].reason?.response?.data?.message ||
            "Unable to load your move-out request status."
          );
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

    fetchDashboardData();
  }, []);

  const submitMoveOutRequest = async () => {
    try {
      setSubmittingMoveOutRequest(true);
      setMoveOutRequestError("");
      const response = await apiClient.post("/tenant/me/move-out-request");
      setMoveOutRequest(response.data.data || null);
    } catch (err) {
      setMoveOutRequestError(
        err.response?.data?.message || "Unable to submit your move-out request."
      );
    } finally {
      setSubmittingMoveOutRequest(false);
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

  const propertyName =
    property?.propertyName || property?.name || "Your property";

  const unitName =
    unit?.unitName ||
    unit?.unitNumber ||
    unit?.name ||
    unit?.number ||
    "Unit details";

  const fullAddress = property?.address || "Address not available";

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
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-[#A5A5A5]">
            RentGuard / Tenant Portal
          </p>

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
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500 dark:text-[#A5A5A5]">
              Tenant Portal
            </p>

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
                {propertyName} · {unitName}
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-[#A5A5A5]">
                {fullAddress}
              </p>
            </div>
          </div>
        </header>

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

                <span className="inline-flex items-center gap-2 bg-[#3b3420] px-3 py-1.5 text-xs text-[#f9c83d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f9c83d]" />
                  Active tenancy
                </span>
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
                    {propertyName}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-stone-400">Unit</p>

                  <p className="mt-2 text-base font-medium">
                    {unitName}
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
              View your rental charges, outstanding bills and payment
              information.
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
                Total amount awaiting payment.
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

            {/* Pay Bills Button */}
            <Link
              to="/tenant/bills"
              className="mt-4 flex w-full items-center justify-center gap-2 bg-[#f9c83d] px-5 py-3.5 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
            >
              Pay Rent & Bills →
            </Link>
          </aside>
        </div>

        {/* Move-out request */}
        <section className="mt-5 w-full min-w-0 border border-stone-200 bg-white p-4 sm:mt-7 sm:p-6 dark:border-neutral-800 dark:bg-[#171717] sm:p-6">
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
            {moveOutRequest?.status && (
              <span className={`inline-flex w-fit shrink-0 px-3 py-1.5 text-xs font-medium capitalize ${moveOutRequest.status === "pending"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                : moveOutRequest.status === "approved"
                  ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                  : moveOutRequest.status === "rejected"
                    ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400"
                    : "bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-neutral-300"
                }`}>
                {moveOutRequest.status}
              </span>
            )}
          </div>

          {moveOutRequestError && (
            <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
              {moveOutRequestError}
            </p>
          )}

          {moveOutRequest?.status === "pending" ? (
            <div className="mt-5 border-t border-stone-200 pt-4 dark:border-neutral-800">
              <p className="text-sm text-stone-700 dark:text-neutral-300">
                Your request has been sent to the property owner.
              </p>

              <p className="mt-2 text-xs text-stone-500 dark:text-[#A5A5A5]">
                Valid until: {formatDateTime(moveOutRequest.expiresAt)}
              </p>

              <p className="mt-1 text-xs text-stone-500 dark:text-[#A5A5A5]">
                You remain an active tenant until the owner approves the request.
              </p>
            </div>
          ) : moveOutRequest?.status === "approved" ? (
            <p className="mt-4 border-t border-stone-200 pt-4 text-sm text-green-700 dark:border-neutral-800 dark:text-green-400">
              Your move-out request was approved on{" "}
              {formatDateTime(moveOutRequest.reviewedAt)}.
            </p>
          ) : (
            <div className="mt-5 border-t border-stone-200 pt-4 dark:border-neutral-800">

              {moveOutRequest?.status === "rejected" && (
                <div className="mb-4 border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Your previous move-out request was rejected.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-600 dark:text-red-300">
                    Your bills were not fully paid. You can submit a new move-out
                    request immediately after rejection. There is no need to wait
                    for the previous 48-hour period to end.
                  </p>
                </div>
              )}

              {moveOutRequest?.status === "expired" && (
                <p className="mb-3 text-sm text-stone-500 dark:text-[#A5A5A5]">
                  Your previous request expired. You can submit a new request.
                </p>
              )}

              <button
                type="button"
                onClick={submitMoveOutRequest}
                disabled={submittingMoveOutRequest}
                className="inline-flex w-full items-center justify-center bg-[#f9c83d] px-5 py-3 text-sm font-medium sm:w-auto text-[#171717] transition hover:bg-[#edbb2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingMoveOutRequest
                  ? "Submitting..."
                  : moveOutRequest?.status === "rejected"
                    ? "Submit new move-out request"
                    : "Submit move-out request"}
              </button>
            </div>
          )}
        </section>

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
