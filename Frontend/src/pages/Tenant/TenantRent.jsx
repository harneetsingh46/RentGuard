import React, { useState } from "react";
import { Link } from "react-router-dom";

const TenantRent = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  // Temporary data — replace with API data later
  const rentDetails = {
    monthlyRent: null,
    dueDate: null,
    paymentStatus: "N/A",
    lastPayment: null,
  };

  const paymentHistory = [];

  const filters = ["All", "Paid", "Pending", "Overdue"];

  const filteredPayments =
    activeFilter === "All"
      ? paymentHistory
      : paymentHistory.filter(
        (payment) => payment.status === activeFilter
      );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Tenant Portal / Rent
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Rent & Payments
            </h1>

            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Manage your rent and keep track of your payment history.
            </p>
          </div>

          <Link
            to="/tenant/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-xs border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:text-yellow-300 dark:border-neutral-800 dark:bg-[#171717] dark:hover:bg-neutral-800"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Rent Overview */}
        <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Monthly Rent */}
          <div className="rounded-xs bg-[#141414] p-6 text-white shadow-2xs sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-400">Monthly Rent</p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {rentDetails.monthlyRent != null
                    ? formatCurrency(rentDetails.monthlyRent)
                    : "—"}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-4xl bg-[#f9c83d] text-xl text-black">
                ₹
              </div>
            </div>

            <div className="mt-7 border-t border-white/10 pt-4">
              <p className="text-xs text-neutral-400">
                Your regular monthly rental amount
              </p>
            </div>
          </div>

          {/* Next Due Date */}
          <div className="rounded-xs border border-neutral-200 bg-white-shadow-2xs6 shadow-sm dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Next Due Date
                </p>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  {rentDetails.dueDate || "—"}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-4xl bg-[#171717] text-xl text-yellow-300 dark:bg-amber-400/10 dark:text-yellow-400">
                ◷
              </div>
            </div>

            <p className="mt-7 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Please pay on or before the due date.
            </p>
          </div>

          {/* Payment Status */}
          <div className="rounded-xs border border-neutral-200 bg-white-shadow-2xs6 shadow-sm dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Current Status
                </p>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  {rentDetails.paymentStatus}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-4xl bg-green-50 text-xl text-green-700 dark:bg-green-400/10 dark:text-green-400">
                ✓
              </div>
            </div>

            <p className="mt-7 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Last payment: {rentDetails.lastPayment || "—"}
            </p>
          </div>
        </section>

        {/* Payment History */}
        <section className="overflow-hidden rounded-xs border border-neutral-200 bg-white-shadow-2xsadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="flex flex-col justify-between gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:p-7">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Payment History
              </h2>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Review your previous rent payments.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-xs px-4 py-2 text-xs font-medium transition ${activeFilter === filter
                    ? "bg-[#141414] text-white dark:bg-[#f9c83d] dark:text-black"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-[#faf9f6] dark:bg-[#1d1d1d]">
                <tr className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <th className="px-6 py-4 font-medium sm:px-7">
                    Rent Month
                  </th>
                  <th className="px-6 py-4 font-medium">Payment Date</th>
                  <th className="px-6 py-4 font-medium">Method</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-neutral-100 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-[#1d1d1d]"
                    >
                      <td className="px-6 py-5 font-medium sm:px-7">
                        {payment.month}
                      </td>

                      <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                        {payment.date}
                      </td>

                      <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                        {payment.method}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-xs px-3 py-1.5 text-xs font-medium ${payment.status === "Paid"
                            ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                            : payment.status === "Overdue"
                              ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                            }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                    >
                      No {activeFilter.toLowerCase()} payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-neutral-100 px-6 py-4 dark:border-neutral-800 sm:px-7">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing {filteredPayments.length} of {paymentHistory.length} payment records
            </p>
          </div>
        </section>

        {/* Payment Information */}
        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xs border border-neutral-200 bg-white-shadow-2xs6 dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-4xl bg-[#f9c83d] text-xl text-black">
                !
              </div>

              <div>
                <h3 className="font-semibold">Payment Reminder</h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Remember to pay your monthly rent before the due date to
                  avoid any late fees. Contact your property manager if you
                  have questions about your payment.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xs border border-neutral-200 bg-white-shadow-2xs6 dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <h3 className="font-semibold">Need Help?</h3>

            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Have a question about your rent or a payment record? Your
              property manager can help clarify payment details.
            </p>

            <Link
              to="/tenant/profile"
              className="mt-5 inline-flex items-center gap-2 rounded-xs bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              View My Profile
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Rent & Payments
        </footer>
      </div>
    </div>
  );
};

export default TenantRent;