import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../ApiClient/interceptor";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const Rent = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");

  const [rents, setRents] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingRents, setLoadingRents] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [creatingRent, setCreatingRent] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedRent, setSelectedRent] = useState(null);
  const [rentPayments, setRentPayments] = useState([]);
  const [paymentError, setPaymentError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState("");

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dueDate, setDueDate] = useState("");

  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  const [downloadingReceiptId, setDownloadingReceiptId] = useState("");

  // Fetch properties
  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      setError("");

      const response = await apiClient.get("/property/");
      const propertyList = response.data.data || [];

      setProperties(propertyList);

      if (propertyList.length > 0) {
        setSelectedProperty((current) => {
          const propertyStillExists = propertyList.some(
            (property) => property._id === current,
          );

          return propertyStillExists ? current : propertyList[0]._id;
        });
      } else {
        setSelectedProperty("");
        setRents([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load properties.");
    } finally {
      setLoadingProperties(false);
    }
  };

  // Fetch rent records for a property
  const fetchRents = async (propertyId) => {
    if (!propertyId) {
      setRents([]);
      return;
    }

    try {
      setLoadingRents(true);
      setError("");

      const response = await apiClient.get(`/rent/${propertyId}`);
      setRents(response.data.data || []);
    } catch (err) {
      if (err.response?.status === 404) {
        // The backend returns 404 when no rent records exist.
        setRents([]);
      } else {
        setRents([]);
        setError(err.response?.data?.message || "Failed to load rent records.");
      }
    } finally {
      setLoadingRents(false);
    }
  };

  // Fetch active tenants for a property
  const fetchTenants = async (propertyId) => {
    if (!propertyId) {
      setTenants([]);
      return;
    }

    try {
      setLoadingTenants(true);
      setError("");

      const response = await apiClient.get(`/property/${propertyId}/tenants`);

      setTenants(response.data.data || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setTenants([]);
      } else {
        setTenants([]);
        setError(err.response?.data?.message || "Failed to load tenants.");
      }
    } finally {
      setLoadingTenants(false);
    }
  };

  // Initial property fetch
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch rents when the selected property changes
  useEffect(() => {
    if (selectedProperty) {
      fetchRents(selectedProperty);
    } else {
      setRents([]);
    }
  }, [selectedProperty]);

  // Clear the tenant selection when the property changes
  useEffect(() => {
    setTenants([]);
    setSelectedTenant("");
  }, [selectedProperty]);

  // Calculate summary amounts
  const summary = useMemo(() => {
    return rents.reduce(
      (totals, rent) => {
        const amount = Number(rent.amount) || 0;
        const paid = Number(rent.paidAmount) || 0;
        const remaining = Math.max(amount - paid, 0);

        totals.totalRent += amount;
        totals.collected += paid;
        totals.pending += remaining;

        if (rent.status === "overdue") {
          totals.overdue += remaining;
        }

        return totals;
      },
      {
        totalRent: 0,
        collected: 0,
        pending: 0,
        overdue: 0,
      },
    );
  }, [rents]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatMonth = (billingMonth, billingYear) => {
    if (!billingMonth || !billingYear) return "—";

    return new Date(
      Number(billingYear),
      Number(billingMonth) - 1,
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusClasses = {
    paid: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    partial:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    pending:
      "bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-stone-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  // Fetch payment history for the selected rent record
  const openPaymentHistory = async (rent) => {
    setSelectedRent(rent);
    setRentPayments([]);
    setPaymentError("");
    setLoadingPayments(true);

    try {
      const response = await apiClient.get(
        `/payment/property/${selectedProperty}`,
      );
      const propertyPayments = response.data.data || [];

      const paymentsForRent = propertyPayments.filter((payment) => {
        const paymentRentId =
          typeof payment.rent === "object" ? payment.rent?._id : payment.rent;

        return String(paymentRentId) === String(rent._id);
      });

      setRentPayments(paymentsForRent);
    } catch (err) {
      if (err.response?.status === 404) {
        setRentPayments([]);
      } else {
        setPaymentError(
          err.response?.data?.message || "Failed to load payment history.",
        );
      }
    } finally {
      setLoadingPayments(false);
    }
  };

  // Download receipt for a successful payment
  const handleDownloadReceipt = async (payment) => {
    if (payment.status !== "paid") {
      setPaymentError("Receipts are available only for successful payments.");
      return;
    }

    try {
      setDownloadingReceiptId(payment._id);
      setPaymentError("");

      const response = await apiClient.get(
        `/payment/property/${selectedProperty}/${payment._id}/receipt`,
        {
          responseType: "blob",
        }
      );

      // Create a temporary URL for the PDF
      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(pdfBlob);

      // Create a temporary download link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `RentGuard-Receipt-${payment._id}.pdf`;

      document.body.appendChild(link);
      link.click();

      // Clean up
      link.remove();
      // Let the browser begin the download before releasing the temporary URL.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      setPaymentError(
        "Failed to download receipt. Please try again."
      );
    } finally {
      setDownloadingReceiptId("");
    }
  };

  const closePaymentHistory = () => {
    if (loadingPayments) return;
    setSelectedRent(null);
    setRentPayments([]);
    setPaymentError("");
  };

  // Open the Create Rent modal
  const openCreateModal = async () => {
    setError("");
    setSuccess("");
    setSelectedTenant("");
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setDueDate("");
    setMonthDropdownOpen(false);
    setTenants([]);
    setShowCreateModal(true);

    await fetchTenants(selectedProperty);
  };

  // Create a rent record
  const handleCreateRent = async (e) => {
    e.preventDefault();

    if (!selectedProperty || !selectedTenant || !month || !year || !dueDate) {
      setError("Please fill in all required fields.");
      return;
    }

    if (Number(month) < 1 || Number(month) > 12 || Number(year) < 2000) {
      setError("Please enter a valid billing month and year.");
      return;
    }

    try {
      setCreatingRent(true);
      setError("");
      setSuccess("");

      await apiClient.post(
        `/rent/${selectedProperty}/tenants/${selectedTenant}`,
        {
          month: Number(month),
          year: Number(year),
          dueDate,
        },
      );

      setShowCreateModal(false);
      setSelectedTenant("");
      setDueDate("");
      setMonthDropdownOpen(false);
      setSuccess("Rent record created successfully.");

      await fetchRents(selectedProperty);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create rent record.");
    } finally {
      setCreatingRent(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 text-stone-900 dark:bg-neutral-950 dark:text-stone-100 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Rent Management</h1>

            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Track rent collection and outstanding payments.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="rent-property"
              className="mb-1 block text-sm font-medium"
            >
              Select property
            </label>

            <select
              id="rent-property"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              disabled={loadingProperties || properties.length === 0}
              className="w-full rounded-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {properties.length === 0 && (
                <option value="">No properties available</option>
              )}

              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.propertyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xs border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-xs border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
          >
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Total Rent",
              value: summary.totalRent,
              description: "Total billed rent",
            },
            {
              title: "Collected",
              value: summary.collected,
              description: "Amount received",
            },
            {
              title: "Pending",
              value: summary.pending,
              description: "Amount remaining",
            },
            {
              title: "Overdue",
              value: summary.overdue,
              description: "Remaining overdue amount",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xs border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {card.title}
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(card.value)}
              </p>

              <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Rent records */}
        <div className="overflow-hidden rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-5 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Rent Records</h2>

              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {rents.length} record{rents.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                disabled={!selectedProperty || loadingProperties}
                className="rounded-xs bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Create Rent
              </button>

              <button
                type="button"
                disabled={!selectedProperty || loadingRents}
                onClick={() => fetchRents(selectedProperty)}
                className="rounded-xs bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {loadingProperties || loadingRents ? (
            <div className="p-10 text-center text-sm text-stone-500 dark:text-stone-400">
              Loading rent records...
            </div>
          ) : properties.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No properties found</p>

              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Add a property before managing its rent.
              </p>
            </div>
          ) : rents.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No rent records yet</p>

              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Create a rent record for an active tenant to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-neutral-800 dark:text-stone-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Tenant</th>
                    <th className="px-5 py-4 font-medium">Unit</th>
                    <th className="px-5 py-4 font-medium">Month</th>
                    <th className="px-5 py-4 font-medium">Rent</th>
                    <th className="px-5 py-4 font-medium">Paid</th>
                    <th className="px-5 py-4 font-medium">Remaining</th>
                    <th className="px-5 py-4 font-medium">Due Date</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Payments</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-200 dark:divide-neutral-800">
                  {rents.map((rent) => {
                    const amount = Number(rent.amount) || 0;
                    const paid = Number(rent.paidAmount) || 0;
                    const remaining = Math.max(amount - paid, 0);

                    return (
                      <tr
                        key={rent._id}
                        className="transition hover:bg-stone-50 dark:hover:bg-neutral-800/60"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {rent.tenant?.fullName || "Unknown tenant"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {rent.unit?.unitName || "—"}
                        </td>

                        <td className="px-5 py-4">
                          {formatMonth(rent.month, rent.year)}
                        </td>

                        <td className="px-5 py-4">{formatCurrency(amount)}</td>

                        <td className="px-5 py-4 text-green-700 dark:text-green-400">
                          {formatCurrency(paid)}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {formatCurrency(remaining)}
                        </td>

                        <td className="px-5 py-4">
                          {formatDate(rent.dueDate)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-xs px-2.5 py-1 text-xs font-medium capitalize ${statusClasses[rent.status] ||
                              statusClasses.pending
                              }`}
                          >
                            {rent.status || "pending"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => openPaymentHistory(rent)}
                            className="rounded-xs border border-stone-300 px-3 py-1.5 text-xs font-medium transition hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            View Payments
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Rent Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !creatingRent) {
              setShowCreateModal(false);
              setMonthDropdownOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-rent-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xs border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="create-rent-title" className="text-xl font-semibold">
                  Create Rent
                </h2>

                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Create a monthly rent record for an active tenant.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setMonthDropdownOpen(false);
                }}
                disabled={creatingRent}
                className="text-2xl text-stone-500 hover:text-stone-900 disabled:opacity-50 dark:hover:text-white"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRent} className="space-y-4">
              {/* Tenant */}
              <div>
                <label
                  htmlFor="rent-tenant"
                  className="mb-1 block text-sm font-medium"
                >
                  Tenant
                </label>

                <select
                  id="rent-tenant"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  required
                  disabled={loadingTenants || tenants.length === 0}
                  className="w-full rounded-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="">
                    {loadingTenants ? "Loading tenants..." : "Select tenant"}
                  </option>

                  {tenants.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.fullName} — {tenant.unit?.unitName || "Unit"}
                    </option>
                  ))}
                </select>

                {!loadingTenants && tenants.length === 0 && (
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    No active tenants found for this property.
                  </p>
                )}
              </div>

              {/* Custom scrollable month dropdown */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Billing Month
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMonthDropdownOpen((open) => !open)}
                    disabled={creatingRent}
                    aria-expanded={monthDropdownOpen}
                    aria-haspopup="listbox"
                    className="flex w-full items-center justify-between rounded-xs border border-stone-300 bg-white px-3 py-2 text-left text-sm outline-none transition focus:border-yellow-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    <span>{MONTHS[month - 1]}</span>

                    <svg
                      className={`h-4 w-4 transition-transform ${monthDropdownOpen ? "rotate-180" : ""
                        }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {monthDropdownOpen && (
                    <div className="absolute z-[60] mt-1 w-full overflow-hidden rounded-xs border border-stone-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      <div
                        role="listbox"
                        aria-label="Billing month"
                        className="month-dropdown-scroll"
                      >
                        {MONTHS.map((monthName, index) => {
                          const monthNumber = index + 1;
                          const isSelected = month === monthNumber;

                          return (
                            <button
                              key={monthName}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setMonth(monthNumber);
                                setMonthDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${isSelected
                                ? "bg-yellow-400 font-medium text-stone-900"
                                : "text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-neutral-800"
                                }`}
                            >
                              <span>{monthName}</span>

                              {isSelected && (
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="m5 12 4 4L19 6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing year */}
              <div>
                <label
                  htmlFor="rent-year"
                  className="mb-1 block text-sm font-medium"
                >
                  Billing Year
                </label>

                <input
                  id="rent-year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2000"
                  required
                  className="w-full rounded-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>

              {/* Due date */}
              <div>
                <label
                  htmlFor="rent-due-date"
                  className="mb-1 block text-sm font-medium"
                >
                  Due Date
                </label>

                <input
                  id="rent-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full rounded-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>

              {/* Modal actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setMonthDropdownOpen(false);
                  }}
                  disabled={creatingRent}
                  className="rounded-xs border border-stone-300 px-4 py-2 text-sm transition hover:bg-stone-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingRent || loadingTenants || tenants.length === 0
                  }
                  className="rounded-xs bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingRent ? "Creating..." : "Create Rent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {selectedRent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePaymentHistory();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-history-title"
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xs border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="payment-history-title"
                  className="text-xl font-semibold"
                >
                  Payment History
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {selectedRent.tenant?.fullName || "Unknown tenant"} ·{" "}
                  {formatMonth(selectedRent.month, selectedRent.year)}
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentHistory}
                disabled={loadingPayments}
                className="text-2xl text-stone-500 hover:text-stone-900 disabled:opacity-50 dark:hover:text-white"
                aria-label="Close payment history"
              >
                &times;
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xs border border-stone-200 p-4 dark:border-neutral-800">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Rent Amount
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(Number(selectedRent.amount) || 0)}
                </p>
              </div>
              <div className="rounded-xs border border-stone-200 p-4 dark:border-neutral-800">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Total Paid
                </p>
                <p className="mt-1 text-lg font-semibold text-green-700 dark:text-green-400">
                  {formatCurrency(Number(selectedRent.paidAmount) || 0)}
                </p>
              </div>
              <div className="rounded-xs border border-stone-200 p-4 dark:border-neutral-800">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Remaining
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(
                    Math.max(
                      (Number(selectedRent.amount) || 0) -
                      (Number(selectedRent.paidAmount) || 0),
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>

            {paymentError && (
              <div
                role="alert"
                className="mb-4 rounded-xs border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                {paymentError}
              </div>
            )}

            {loadingPayments ? (
              <div className="p-8 text-center text-sm text-stone-500 dark:text-stone-400">
                Loading payment history...
              </div>
            ) : paymentError && rentPayments.length === 0 ? null : rentPayments.length === 0 ? (
              <div className="rounded-xs border border-stone-200 p-8 text-center dark:border-neutral-800">
                <p className="font-medium">No payments recorded</p>
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                  Transactions for this rent record will appear here after a
                  payment is recorded.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xs border border-stone-200 dark:border-neutral-800">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-neutral-800 dark:text-stone-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Payment Date</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Transaction ID</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-neutral-800">
                    {rentPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-4 py-3">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(Number(payment.amount) || 0)}
                        </td>
                        <td className="break-all px-4 py-3 text-xs">
                          {payment.razorpayPaymentId ||
                            payment.razorpayOrderId ||
                            "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-xs px-2.5 py-1 text-xs font-medium capitalize ${payment.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                              : payment.status === "failed"
                                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                : "bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-stone-300"
                              }`}
                          >
                            {payment.status || "created"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {payment.status === "paid" ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(payment)}
                              disabled={downloadingReceiptId === payment._id}
                              className="rounded-xs bg-yellow-400 px-3 py-2 text-xs font-medium text-stone-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {downloadingReceiptId === payment._id
                                ? "Downloading..."
                                : "Download Receipt"}
                            </button>
                          ) : (
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              Not available
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closePaymentHistory}
                disabled={loadingPayments}
                className="rounded-xs bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rent;
