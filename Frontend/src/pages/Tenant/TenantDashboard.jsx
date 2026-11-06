
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";

const TenantDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [payments, setPayments] = useState([]);

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
        )
        .slice(0, 5),
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
      <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">

        {/* Header */}
        <header className="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500 dark:text-[#A5A5A5]">
              Tenant Portal
            </p>

            <h1 className="mt-4 text-3xl font-normal leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
              Your home. Your peace of mind.
            </h1>

            <p className="mt-3 text-sm text-stone-500 dark:text-[#A5A5A5] sm:text-base">
              Hi {tenant?.fullName?.split(" ")[0] || "there"}. Manage your
              rental, simply and securely.
            </p>
          </div>

          <div className="flex items-start gap-3 lg:max-w-[300px]">
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
        <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(350px,0.95fr)]">

          {/* LEFT COLUMN */}
          <div className="min-w-0">

            {/* Rental Overview */}
            <section className="relative overflow-hidden bg-[#141414] p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
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

              <div className="mt-8 grid grid-cols-1 gap-5 border-t border-white/15 pt-5 sm:grid-cols-2">
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

            {/* Property and Tenancy Details */}
            <section className="mt-7 border-b border-stone-200 pb-7 dark:border-neutral-800">
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-[#A5A5A5]">
                    Your property
                  </p>

                  <h3 className="mt-3 text-lg font-medium">
                    {propertyName}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
                    {fullAddress}
                  </p>

                  <Link
                    to="/tenant/documents"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-800 dark:hover:decoration-white"
                  >
                    View rental documents
                  </Link>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-[#A5A5A5]">
                      Tenancy information
                    </p>

                    <span className="text-xs text-stone-400">
                      Current
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-medium">
                    {unitName}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
                    Your current accommodation details.
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />

                    <span className="text-stone-700 dark:text-neutral-300">
                      Active tenancy
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment History */}
            <section className="mt-7">
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
                  className="inline-flex items-center gap-2 border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-stone-400 dark:border-neutral-800 dark:bg-[#171717] dark:hover:border-neutral-600"
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

              <div className="mt-5 overflow-x-auto border-y border-stone-200 dark:border-neutral-800">
                <table className="w-full min-w-[550px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500 dark:border-neutral-800 dark:text-[#A5A5A5]">
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
                          className="border-b border-stone-200/70 dark:border-neutral-800"
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
                                className={`inline-flex px-2.5 py-1 text-xs font-medium capitalize ${
                                  payment.status === "paid"
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
                                  className="border border-stone-300 px-3 py-1.5 text-xs font-medium transition hover:border-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
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

            {/* TENANT SERVICES - MOVED INSIDE LEFT COLUMN */}
            <section className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Rent and Utility Bills */}
              <div className="border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#171717] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-[#A5A5A5]">
                      Payments
                    </p>

                    <h2 className="mt-3 text-xl font-normal tracking-tight">
                      Rent & utility bills
                    </h2>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center bg-[#f9c83d] text-xl text-[#171717]">
                    ₹
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
                  View your rent, electricity, water and other bills.
                  Select multiple bills to create one combined Order.
                </p>

                <Link
                  to="/tenant/bills"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#f9c83d] px-5 py-3 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
                >
                  View & Pay Bills →
                </Link>
              </div>

              {/* File a Complaint */}
              <div className="border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#171717] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-[#A5A5A5]">
                      Support
                    </p>

                    <h2 className="mt-3 text-xl font-normal tracking-tight">
                      File a complaint
                    </h2>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center bg-[#171717] text-xl text-[#f9c83d] dark:bg-[#f9c83d] dark:text-[#171717]">
                    !
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
                  Report maintenance issues, plumbing problems,
                  electrical faults or other concerns about your
                  accommodation.
                </p>

                <Link
                  to="/tenant/maintenance"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-stone-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-stone-400 dark:border-neutral-700 dark:bg-[#171717] dark:hover:border-neutral-500"
                >
                  Submit a complaint →
                </Link>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="min-w-0 border border-stone-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-[#171717]">

            {/* Rent and Payments */}
            <div className="flex items-center justify-between gap-3">
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

            {/* Monthly Rent */}
            <div className="mt-6 border border-stone-200 bg-[#f7f5f0] p-5 dark:border-neutral-800 dark:bg-[#111111]">
              <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-stone-500 dark:text-[#A5A5A5]">
                Monthly rent
              </p>

              <p className="mt-3 text-3xl font-normal tracking-tight sm:text-4xl">
                {monthlyRent ? formatCurrency(monthlyRent) : "—"}
              </p>

              <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-[#A5A5A5]">
                {monthlyRent
                  ? "Your monthly rental amount."
                  : "Monthly rent information is not available."}
              </p>
            </div>

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

            {/* Rental Account */}
            <div className="mt-7 border-t border-stone-200 pt-6 dark:border-neutral-800">
              <h3 className="text-base font-medium">
                Your rental account
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
                Keep your personal details and rental documents up to date.
              </p>

              <div className="mt-5 space-y-0">
                <Link
                  to="/tenant/profile"
                  className="flex items-center justify-between border-b border-stone-100 py-4 text-sm transition hover:text-stone-500 dark:border-neutral-800 dark:hover:text-[#f9c83d]"
                >
                  <span>Personal information</span>
                  <span>→</span>
                </Link>

                <Link
                  to="/tenant/documents"
                  className="flex items-center justify-between border-b border-stone-100 py-4 text-sm transition hover:text-stone-500 dark:border-neutral-800 dark:hover:text-[#f9c83d]"
                >
                  <span>Rental documents</span>
                  <span>→</span>
                </Link>

                <Link
                  to="/tenant/bills"
                  className="flex items-center justify-between py-4 text-sm transition hover:text-stone-500 dark:hover:text-[#f9c83d]"
                >
                  <span>Rent and bills</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Account Details */}
            <div className="mt-5 border-t border-stone-200 pt-5 dark:border-neutral-800">
              <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-stone-500 dark:text-[#A5A5A5]">
                Account details
              </p>

              <div className="mt-4">
                <p className="text-xs text-stone-500 dark:text-[#A5A5A5]">
                  Tenant name
                </p>

                <p className="mt-1 break-words text-sm font-medium">
                  {tenant?.fullName || "—"}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs text-stone-500 dark:text-[#A5A5A5]">
                  Email address
                </p>

                <p className="mt-1 break-words text-sm font-medium">
                  {tenant?.email || "—"}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-stone-200 py-5 text-xs text-stone-500 sm:flex-row sm:items-center dark:border-neutral-800 dark:text-[#A5A5A5]">
          <p>RentGuard · Your rental, made simpler.</p>
          <p>{formatDate(new Date())}</p>
        </footer>
      </main>
    </div>
  );
};

export default TenantDashboard;
