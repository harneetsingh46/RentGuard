import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";

const TenantDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get("/tenant/dashboard");
        setDashboard(response.data.data);
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

    fetchDashboard();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const tenant = dashboard?.tenant;
  const property = dashboard?.property;
  const unit = dashboard?.unit;
  const account = dashboard?.account;

  const propertyName =
    property?.propertyName || property?.name || "Your property";

  const unitName =
    unit?.unitName ||
    unit?.unitNumber ||
    unit?.name ||
    unit?.number ||
    "Unit details";

  const fullAddress = property?.address || "Address not available";

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
              Hi {tenant?.fullName?.split(" ")[0] || account?.username || "there"}.
              {" "}Manage your rental, simply and securely.
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

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(350px,0.95fr)]">

          {/* Left column */}
          <div className="min-w-0">

            {/* Rent summary */}
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
                  {tenant?.fullName || account?.username || "Tenant"}
                </h2>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 border-t border-white/15 pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-stone-400">
                    Property
                  </p>

                  <p className="mt-2 text-base font-medium">
                    {propertyName}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-stone-400">
                    Unit
                  </p>

                  <p className="mt-2 text-base font-medium">
                    {unitName}
                  </p>
                </div>
              </div>
            </section>

            {/* Property and tenancy details */}
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

            {/* Payment history */}
            <section className="mt-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-normal tracking-tight">
                    Payment history
                  </h2>

                  <p className="mt-1 text-xs text-stone-500 dark:text-[#A5A5A5]">
                    Review your rental payments.
                  </p>
                </div>

                <Link
                  to="/tenant/rent"
                  className="inline-flex items-center gap-2 border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-stone-400 dark:border-neutral-800 dark:bg-[#171717] dark:hover:border-neutral-600"
                >
                  Rent details
                </Link>
              </div>

              <div className="mt-5 overflow-x-auto border-y border-stone-200 dark:border-neutral-800">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500 dark:border-neutral-800 dark:text-[#A5A5A5]">
                      <th className="px-3 py-4 font-normal">Information</th>
                      <th className="px-3 py-4 font-normal">Details</th>
                      <th className="px-3 py-4 text-right font-normal">View</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-b border-stone-200/70 dark:border-neutral-800">
                      <td className="px-3 py-5">Rental property</td>
                      <td className="px-3 py-5 text-stone-500 dark:text-[#A5A5A5]">
                        {propertyName}
                      </td>
                      <td className="px-3 py-5 text-right">
                        <Link
                          to="/tenant/rent"
                          aria-label="View rent details"
                          className="text-lg hover:text-stone-500 dark:hover:text-[#f9c83d]"
                        >
                          ↗
                        </Link>
                      </td>
                    </tr>

                    <tr className="border-b border-stone-200/70 dark:border-neutral-800">
                      <td className="px-3 py-5">Accommodation</td>
                      <td className="px-3 py-5 text-stone-500 dark:text-[#A5A5A5]">
                        {unitName}
                      </td>
                      <td className="px-3 py-5 text-right">
                        <Link
                          to="/tenant/profile"
                          aria-label="View profile"
                          className="text-lg hover:text-stone-500 dark:hover:text-[#f9c83d]"
                        >
                          ↗
                        </Link>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-3 py-5">Documents</td>
                      <td className="px-3 py-5 text-stone-500 dark:text-[#A5A5A5]">
                        Rental records
                      </td>
                      <td className="px-3 py-5 text-right">
                        <Link
                          to="/tenant/documents"
                          aria-label="View documents"
                          className="text-lg hover:text-stone-500 dark:hover:text-[#f9c83d]"
                        >
                          ↗
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-[#A5A5A5]">
                Transaction amounts, due dates, and payment statuses can be
                displayed here once your payment records are connected.
              </p>
            </section>
          </div>

          {/* Right column */}
          <aside className="min-w-0 border border-stone-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-[#171717]">

            {/* Payment panel */}
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
              Access your rent information and keep track of your rental
              responsibilities.
            </p>

            <div className="mt-6 border border-stone-200 bg-[#f7f5f0] p-5 dark:border-neutral-800 dark:bg-[#111111]">
              <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-stone-500 dark:text-[#A5A5A5]">
                Monthly rent
              </p>

              <p className="mt-3 text-3xl font-normal tracking-tight sm:text-4xl">
                —
              </p>

              <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-[#A5A5A5]">
                Your monthly rent amount will appear here when available.
              </p>
            </div>

            <Link
              to="/tenant/rent"
              className="mt-4 flex w-full items-center justify-center gap-2 bg-[#f9c83d] px-5 py-3.5 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
            >
              View rent details
            </Link>

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
                </Link>

                <Link
                  to="/tenant/documents"
                  className="flex items-center justify-between border-b border-stone-100 py-4 text-sm transition hover:text-stone-500 dark:border-neutral-800 dark:hover:text-[#f9c83d]"
                >
                  <span>Rental documents</span>
                </Link>

                <Link
                  to="/tenant/rent"
                  className="flex items-center justify-between py-4 text-sm transition hover:text-stone-500 dark:hover:text-[#f9c83d]"
                >
                  <span>Rent information</span>
                </Link>
              </div>
            </div>

            {/* Account details */}
            <div className="mt-5 border-t border-stone-200 pt-5 dark:border-neutral-800">
              <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-stone-500 dark:text-[#A5A5A5]">
                Account details
              </p>

              <div className="mt-4">
                <p className="text-xs text-stone-500 dark:text-[#A5A5A5]">
                  Tenant name
                </p>
                <p className="mt-1 break-words text-sm font-medium">
                  {tenant?.fullName || account?.username || "—"}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs text-stone-500 dark:text-[#A5A5A5]">
                  Email address
                </p>
                <p className="mt-1 break-words text-sm font-medium">
                  {account?.email || "—"}
                </p>
              </div>
            </div>
          </aside>
        </div>
        {/* Tenant Services */}
        <section className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* External Bills */}
          <div className="border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#171717] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-[#A5A5A5]">
                  Utilities
                </p>

                <h2 className="mt-3 text-xl font-normal tracking-tight">
                  External bills
                </h2>
              </div>

              <span className="flex h-10 w-10 items-center justify-center bg-[#f9c83d] text-xl text-[#171717]">
                ₹
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-[#A5A5A5]">
              Access electricity, water, internet, and other utility bills
              that are separate from your monthly rent.
            </p>

            <Link
              to="/tenant/bills"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#f9c83d] px-5 py-3 text-sm font-medium text-[#171717] transition hover:bg-[#edbb2f]"
            >
              View external bills
              <span aria-hidden="true">→</span>
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
              Report maintenance issues, plumbing problems, electrical
              faults, or other concerns about your accommodation.
            </p>

            <Link
              to="/tenant/maintenance"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-stone-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-stone-400 dark:border-neutral-700 dark:bg-[#171717] dark:hover:border-neutral-500"
            >
              Submit a complaint
              <span aria-hidden="true">→</span>
            </Link>
          </div>

        </section>

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