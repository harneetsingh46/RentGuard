import React, { useEffect, useState } from "react";
import apiClient from "../../ApiClient/interceptor";

const OwnerDashboard = () => {
  const currentDate = new Date();

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

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

  useEffect(() => {
    let isMounted = true;

    const getDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get("/dashboard/owner", {
          params: { month, year },
        });

        if (isMounted) setDashboard(response.data.data);
      } catch (requestError) {
        console.error("Dashboard error:", requestError);
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
            "Unable to load dashboard data. Please try again.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getDashboard();
    return () => {
      isMounted = false;
    };
  }, [month, year, retryCount]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusClass = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "paid" || normalized === "resolved") {
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    }
    if (normalized === "in progress" || normalized === "reserved") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    }
    if (normalized === "rejected") {
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  };

  const TableEmpty = ({ columns, children }) => (
    <tr>
      <td
        colSpan={columns}
        className="px-4 py-8 text-center text-gray-500 dark:text-[#A5A5A5]"
      >
        {children}
      </td>
    </tr>
  );

  if (loading && !dashboard) {
    return (
      <div className="w-full min-w-0 bg-[#f7f5f0] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">
        <main className="w-full min-w-0">
          <section className="p-8">
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
              Owner Overview
            </h1>
            <p className="mt-3 text-gray-500 dark:text-[#A5A5A5]">
              Loading your dashboard...
            </p>
          </section>
        </main>
      </div>
    );
  }

  const overview = dashboard?.overview || {};
  const billOverview = dashboard?.billOverview || {};
  const maintenance = dashboard?.maintenanceOverview || {};
  const recentPayments = dashboard?.recentPayments || [];
  const recentTenants = dashboard?.recentTenants || [];
  const recentBills = dashboard?.recentBills || [];
  const recentComplaints = dashboard?.recentComplaints || [];
  const properties = dashboard?.properties || [];

  const financialCards = [
    {
      title: "Total Bills",
      amount: billOverview.totalBillsAmount,
      description: `${billOverview.totalBills || 0} bills created for this period`,
    },
    {
      title: "Paid Bills",
      amount: billOverview.paidBillsAmount,
      description: `${billOverview.paidBills || 0} bills fully paid`,
    },
    {
      title: "Outstanding",
      amount: billOverview.outstandingAmount,
      description: `${(billOverview.unpaidBills || 0) + (billOverview.reservedBills || 0)} unpaid or reserved bills`,
    },
    {
      title: "Overdue",
      amount: billOverview.overdueAmount,
      description: `${billOverview.overdueBills || 0} outstanding bills past due date`,
    },
    {
      title: "Collected This Month",
      amount: billOverview.collectedThisMonth,
      description: "Successful payments received during this calendar month",
    },
  ];

  const propertyCards = [
    { title: "Properties", value: overview.totalProperties },
    { title: "Total Units", value: overview.totalUnits },
    { title: "Occupied Units", value: overview.occupiedUnits },
    { title: "Available Units", value: overview.availableUnits },
    { title: "Active Tenants", value: overview.activeTenants },
  ];

  const periodLabel = `${months.find((item) => item.value === month)?.label} ${year}`;

  return (
    <div className="w-full min-w-0 bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">
      <main className="w-full min-w-0">
        <section className="p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
                Owner Overview
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-[#A5A5A5]">
                Your properties, billing, payments and maintenance at a glance.
              </p>
            </div>

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
                  (_, index) => currentDate.getFullYear() - 5 + index,
                ).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                  setRetryCount((count) => count + 1);
                }}
                className="rounded-xs bg-yellow-400 px-4 py-2 text-black transition hover:bg-yellow-300"
              >
                Try Again
              </button>
            </div>
          )}

          {loading && dashboard && (
            <p className="mt-5 text-sm text-gray-500 dark:text-[#A5A5A5]">
              Updating dashboard...
            </p>
          )}

          {!error && dashboard && (
            <>
              <div className="mt-8">
                <h2 className="text-xl font-medium tracking-tight">
                  Financial Overview
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#A5A5A5]">
                  Bill period: {periodLabel}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                <p className="mt-3 text-xs text-gray-500 dark:text-[#A5A5A5]">
                  Bill totals are based on the selected bill month. “Collected
                  This Month” is based on the date successful payments were
                  received.
                </p>
              </div>

              <div className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-xl font-medium tracking-tight">
                    Property Overview
                  </h2>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
              <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-2">
                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight">
                    Recent Payments
                  </h2>
                  <div className="mt-5 max-h-[230px] overflow-auto rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 border-b border-stone-200 bg-gray-200 text-gray-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-[#A5A5A5]">

                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Tenant</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Property / Unit</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Amount</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Paid On</th>
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
                              <p>{payment.property?.propertyName || "Unknown property"}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-[#A5A5A5]">
                                {payment.unit?.unitName || "Unknown unit"}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-gray-500 dark:text-[#A5A5A5]">
                              {formatDate(payment.paidAt || payment.createdAt)}
                            </td>
                          </tr>
                        ))}
                        {recentPayments.length === 0 && (
                          <TableEmpty columns={4}>No successful payments found.</TableEmpty>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight">
                    Recent Tenants
                  </h2>
                  <div className="mt-5 max-h-[230px] overflow-auto rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 border-b border-stone-200 bg-gray-200 text-gray-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-[#A5A5A5]">

                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Tenant</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Property</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Unit</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTenants.map((tenant) => (
                          <tr
                            key={tenant._id}
                            className="border-b border-stone-100 last:border-b-0 dark:border-neutral-900"
                          >
                            <td className="whitespace-nowrap px-4 py-4">
                              <p>{tenant.fullName}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-[#A5A5A5]">
                                {tenant.email}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              {tenant.property?.propertyName || "Unknown property"}
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
                          <TableEmpty columns={4}>No active tenants found.</TableEmpty>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight">
                    Recent Bills — {periodLabel}
                  </h2>
                  <div className="mt-5 max-h-[230px] overflow-auto rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 border-b border-stone-200 bg-gray-200 text-gray-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-[#A5A5A5]">

                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Bill</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Tenant</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Amount</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBills.map((bill) => (
                          <tr
                            key={bill._id}
                            className="border-b border-stone-100 last:border-b-0 dark:border-neutral-900"
                          >
                            <td className="px-4 py-4">
                              <p>{bill.billName}</p>
                              <p className="mt-1 text-xs capitalize text-gray-500 dark:text-[#A5A5A5]">
                                {bill.category}
                              </p>
                            </td>
                            <td className="px-4 py-4">{bill.tenant?.fullName || "—"}</td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {formatCurrency(bill.amount)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusClass(bill.paymentStatus)}`}>
                                {bill.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {recentBills.length === 0 && (
                          <TableEmpty columns={4}>No bills found for this period.</TableEmpty>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight">
                    Recent Maintenance Complaints
                  </h2>
                  <div className="mt-5 max-h-[230px] overflow-auto rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 border-b border-stone-200 bg-gray-200 text-gray-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-[#A5A5A5]">

                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Issue</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Tenant</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Priority</th>
                          <th className="whitespace-nowrap px-4 py-3 font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentComplaints.map((complaint) => (
                          <tr
                            key={complaint._id}
                            className="border-b border-stone-100 last:border-b-0 dark:border-neutral-900"
                          >
                            <td className="px-4 py-4">
                              <p>{complaint.title}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-[#A5A5A5]">
                                {complaint.property?.propertyName || "Unknown property"} · {complaint.unit?.unitName || "Unknown unit"}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {complaint.tenant?.fullName || "—"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {complaint.priority}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs ${statusClass(complaint.status)}`}>
                                {complaint.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {recentComplaints.length === 0 && (
                          <TableEmpty columns={4}>No maintenance complaints found.</TableEmpty>
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
