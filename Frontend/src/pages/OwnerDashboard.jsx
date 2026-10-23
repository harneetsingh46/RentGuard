import React, { useEffect, useState } from "react";
import apiClient from "../ApiClient/interceptor";

const OwnerDashboard = () => {
  const currentDate = new Date();

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Fetch dashboard data whenever the selected month or year changes
  useEffect(() => {
    const getDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get("/dashboard/owner", {
          params: {
            month,
            year,
          },
        });

        setDashboard(response.data.data);
      } catch (error) {
        console.error("Dashboard error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    getDashboard();
  }, [month, year]);

  // Format amounts as Indian currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format dates
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Display a loading message
  if (loading && !dashboard) {
    return (
      <div className="flex items-start bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">
        <main className="min-w-0 flex-1">
          <section className="min-h-[80vh] p-8">
            <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">
              A clearer view of your portfolio.
            </h1>

            <p className="mt-3 text-gray-500 dark:text-[#A5A5A5]">
              Loading your dashboard...
            </p>
          </section>
        </main>
      </div>
    );
  }

  const overview = dashboard?.overview;
  const rentOverview = dashboard?.rentOverview;
  const recentPayments = dashboard?.recentPayments || [];
  const recentTenants = dashboard?.recentTenants || [];

  // Summary card data
  const financialCards = [
    {
      title: "Total Rent",
      amount: rentOverview?.totalRent,
      description: "Rent recorded for this month",
    },
    {
      title: "Collected Rent",
      amount: rentOverview?.collectedRent,
      description: "Amount collected toward this month's rent",
    },
    {
      title: "Pending Rent",
      amount: rentOverview?.pendingRent,
      description: "Rent not yet overdue",
    },
    {
      title: "Overdue Rent",
      amount: rentOverview?.overdueRent,
      description: "Outstanding rent past its due date",
    },
  ];

  const propertyCards = [
    {
      title: "Properties",
      value: overview?.totalProperties,
    },
    {
      title: "Total Units",
      value: overview?.totalUnits,
    },
    {
      title: "Occupied Units",
      value: overview?.occupiedUnits,
    },
    {
      title: "Available Units",
      value: overview?.availableUnits,
    },
    {
      title: "Maintenance Units",
      value: overview?.maintenanceUnits,
    },
    {
      title: "Active Tenants",
      value: overview?.activeTenants,
    },
  ];

  return (
    <div className="flex items-start bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">
      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Dashboard content */}
        <section className="min-h-[80vh] p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">
                A clearer view of your portfolio.
              </h1>

              <p className="mt-3 text-gray-500 dark:text-[#A5A5A5]">
                Here's where things stand with your properties.
              </p>
            </div>

            {/* Month and year selector */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="rounded-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
                aria-label="Select month"
              >
                {months.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="rounded-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
                aria-label="Select year"
              >
                {Array.from(
                  { length: 10 },
                  (_, index) => currentDate.getFullYear() - 5 + index
                ).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xs border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              role="alert"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={() => {
                  setDashboard(null);
                  setLoading(true);
                  setError("");
                }}
                className="rounded-xs bg-yellow-400 px-4 py-2 text-black transition hover:bg-yellow-300"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Show loading while changing months */}
          {loading && dashboard && (
            <p className="mt-5 text-sm text-gray-500 dark:text-[#A5A5A5]">
              Updating dashboard...
            </p>
          )}

          {/* Dashboard data */}
          {!error && dashboard && (
            <>
              {/* Financial overview */}
              <div className="mt-8">
                <h2 className="text-xl font-medium tracking-tight">
                  Financial Overview
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-[#A5A5A5]">
                  {months.find((item) => item.value === month)?.label} {year}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {financialCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-xs border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <p className="text-sm text-gray-500 dark:text-[#A5A5A5]">
                        {card.title}
                      </p>

                      <p className="mt-3 text-2xl font-medium tracking-tight">
                        {formatCurrency(card.amount)}
                      </p>

                      <p className="mt-2 text-xs text-gray-500 dark:text-[#A5A5A5]">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property overview */}
              <div className="mt-10">
                <h2 className="text-xl font-medium tracking-tight">
                  Property Overview
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                  {propertyCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-xs border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <p className="text-sm text-gray-500 dark:text-[#A5A5A5]">
                        {card.title}
                      </p>

                      <p className="mt-3 text-2xl font-medium tracking-tight">
                        {card.value ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-2">
                {/* Recent payments */}
                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight">
                    Recent Payments
                  </h2>

                  <div className="mt-5 overflow-x-auto rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-stone-200 text-gray-500 dark:border-neutral-800 dark:text-[#A5A5A5]">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Tenant
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Property / Unit
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Amount
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentPayments.map((payment) => (
                          <tr
                            key={payment._id}
                            className="border-b border-stone-100 last:border-b-0 dark:border-neutral-900"
                          >
                            <td className="whitespace-nowrap px-4 py-4">
                              {payment.tenant?.fullName || "Unknown tenant"}
                            </td>

                            <td className="px-4 py-4">
                              <p>
                                {payment.property?.propertyName ||
                                  "Unknown property"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500 dark:text-[#A5A5A5]">
                                {payment.unit?.unitName || "Unknown unit"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              {formatCurrency(payment.amount)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-gray-500 dark:text-[#A5A5A5]">
                              {formatDate(payment.createdAt)}
                            </td>
                          </tr>
                        ))}

                        {recentPayments.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-4 py-8 text-center text-gray-500 dark:text-[#A5A5A5]"
                            >
                              No successful payments for this month.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent tenants */}
                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight">
                    Recent Tenants
                  </h2>

                  <div className="mt-5 overflow-x-auto rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-stone-200 text-gray-500 dark:border-neutral-800 dark:text-[#A5A5A5]">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Tenant
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Property
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Unit
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">
                            Joined
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentTenants.map((tenant) => (
                          <tr
                            key={tenant._id}
                            className="border-b border-stone-100 last:border-b-0 dark:border-neutral-900"
                          >
                            <td className="whitespace-nowrap px-4 py-4">
                              {tenant.fullName}
                            </td>

                            <td className="px-4 py-4">
                              {tenant.property?.propertyName ||
                                "Unknown property"}
                            </td>

                            <td className="px-4 py-4">
                              {tenant.unit?.unitName || "Unknown unit"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-gray-500 dark:text-[#A5A5A5]">
                              {formatDate(tenant.createdAt)}
                            </td>
                          </tr>
                        ))}

                        {recentTenants.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-4 py-8 text-center text-gray-500 dark:text-[#A5A5A5]"
                            >
                              No active tenants found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default OwnerDashboard;