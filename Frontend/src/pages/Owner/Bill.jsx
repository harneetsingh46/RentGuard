import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Download, LoaderCircle } from "lucide-react";
import apiClient from "../../ApiClient/interceptor";
import toast from "react-hot-toast";
import Pagination from "../../common/Pagination";

const PAGE_SIZE = 10;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "other", label: "Other" },
];

const emptyForm = () => ({
  unitId: "",
  tenantId: "",
  billName: "",
  category: "rent",
  amount: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  startDate: "",
  endDate: "",
  dueDate: "",
});

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatMonth = (month, year) => {
  if (!month || !year) return "—";
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const renderStatusBadge = (status) => {
  const normalized = status?.toLowerCase() || "unpaid";
  if (normalized === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
        Paid
      </span>
    );
  }
  if (normalized === "reserved") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
        In Checkout
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
      Unpaid
    </span>
  );
};

const inputClass =
  "w-full rounded-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-neutral-700 dark:bg-neutral-950";

const Bill = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState(searchParams.get("tenantId") || "all");
  const [error, setError] = useState("");
  const [receiptLoadingId, setReceiptLoadingId] = useState(null);
  const [receiptActionType, setReceiptActionType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // View or download receipt for a paid bill
  const handleReceiptAction = async (bill, action = "download") => {
    if (!bill?._id || !selectedProperty || receiptLoadingId) return;

    let blobUrl;
    try {
      setReceiptLoadingId(bill._id);
      setReceiptActionType(action);

      const response = await apiClient.get(
        `/payment/property/${selectedProperty}/bill/${bill._id}/receipt`,
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });
      blobUrl = window.URL.createObjectURL(pdfBlob);

      if (action === "view") {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        const safeName = (bill.billName || "receipt")
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        link.download = `RentGuard-Receipt-${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Receipt downloaded successfully.");
      }

      window.setTimeout(() => {
        if (blobUrl) window.URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch (err) {
      console.error("Receipt action error:", err);
      toast.error(
        action === "view"
          ? "Unable to open receipt. Please try again."
          : "Unable to download receipt. Please try again."
      );
    } finally {
      setReceiptLoadingId(null);
      setReceiptActionType(null);
    }
  };

  // Load owner's properties.
  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      setError("");
      const response = await apiClient.get("/property/");
      const list = response.data.data || [];
      setProperties(list);

      const targetPropertyId = searchParams.get("propertyId");
      if (list.length) {
        if (targetPropertyId && list.some((p) => p._id === targetPropertyId)) {
          setSelectedProperty(targetPropertyId);
        } else {
          setSelectedProperty((current) =>
            list.some((property) => property._id === current)
              ? current
              : list[0]._id
          );
        }
      } else {
        setSelectedProperty("");
        setTenants([]);
        setBills([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load properties.");
    } finally {
      setLoadingProperties(false);
    }
  };

  // Load active tenants. The tenant endpoint should populate each tenant's unit.
  const fetchTenants = async (propertyId) => {
    if (!propertyId) {
      setTenants([]);
      return;
    }

    try {
      setLoadingTenants(true);
      const response = await apiClient.get(`/property/${propertyId}/tenants`);
      setTenants(response.data.data || []);
    } catch (err) {
      setTenants([]);
      toast.error(err.response?.data?.message || "Failed to load tenants.");
    } finally {
      setLoadingTenants(false);
    }
  };

  // Load bills for the selected property.
  const fetchBills = async (propertyId) => {
    if (!propertyId) {
      setBills([]);
      return;
    }

    try {
      setLoadingBills(true);
      setError("");
      const response = await apiClient.get(`/bill/${propertyId}`);
      setBills(response.data.data || []);
    } catch (err) {
      setBills([]);
      setError(err.response?.data?.message || "Failed to load bills.");
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (!selectedProperty) {
      setTenants([]);
      setBills([]);
      return;
    }

    fetchTenants(selectedProperty);
    fetchBills(selectedProperty);
  }, [selectedProperty]);

  // Handle URL params for deep-linking (e.g., from Tenant management)
  useEffect(() => {
    const urlTenantId = searchParams.get("tenantId");
    const urlAction = searchParams.get("action");

    if (urlTenantId) {
      setTenantFilter(urlTenantId);
    }

    if (urlAction === "create" && urlTenantId && tenants.length > 0) {
      const targetTenant = tenants.find((t) => String(t._id) === String(urlTenantId));
      if (targetTenant) {
        const unitId = targetTenant.unit?._id || targetTenant.unit || "";
        const unitRent = targetTenant.unit?.rent;
        setEditingBill(null);
        setForm({
          ...emptyForm(),
          tenantId: targetTenant._id,
          unitId,
          amount: String(unitRent ?? ""),
        });
        setShowModal(true);
      }
    }
  }, [searchParams, tenants]);

  // Build the unit list from active tenants' populated unit references.
  const units = useMemo(() => {
    const unique = new Map();
    tenants.forEach((tenant) => {
      const unit = tenant.unit;
      if (unit && unit._id) unique.set(unit._id, unit);
    });
    return Array.from(unique.values());
  }, [tenants]);

  const availableTenants = useMemo(
    () =>
      form.unitId
        ? tenants.filter(
            (tenant) =>
              String(tenant.unit?._id || tenant.unit) === String(form.unitId)
          )
        : tenants,
    [tenants, form.unitId]
  );

  const selectedUnit = useMemo(
    () => units.find((unit) => String(unit._id) === String(form.unitId)),
    [units, form.unitId]
  );

  // Auto-connect tenant and unit bi-directionally
  const handleTenantChange = (tenantId) => {
    const selectedTenant = tenants.find((t) => String(t._id) === String(tenantId));
    if (selectedTenant) {
      const unitId = selectedTenant.unit?._id || selectedTenant.unit || "";
      const unit = units.find((u) => String(u._id) === String(unitId));
      setForm((current) => ({
        ...current,
        tenantId,
        unitId,
        amount:
          current.category === "rent"
            ? String(unit?.rent ?? current.amount)
            : current.amount,
      }));
    } else {
      setForm((current) => ({ ...current, tenantId: "" }));
    }
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find((u) => String(u._id) === String(unitId));
    const tenantInUnit = tenants.find(
      (t) => String(t.unit?._id || t.unit) === String(unitId)
    );
    setForm((current) => ({
      ...current,
      unitId,
      tenantId: tenantInUnit ? tenantInUnit._id : "",
      amount:
        current.category === "rent"
          ? String(unit?.rent ?? current.amount)
          : current.amount,
    }));
  };

  const filteredBills = useMemo(
    () =>
      bills.filter((bill) => {
        const matchesCategory =
          categoryFilter === "all" || bill.category === categoryFilter;
        const billTenantId = bill.tenant?._id || bill.tenant;
        const matchesTenant =
          tenantFilter === "all" || String(billTenantId) === String(tenantFilter);
        return matchesCategory && matchesTenant;
      }),
    [bills, categoryFilter, tenantFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBills = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredBills.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredBills, safePage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const summary = useMemo(
    () => ({
      count: filteredBills.length,
      total: filteredBills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0),
      rent: filteredBills
        .filter((bill) => bill.category === "rent")
        .reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0),
      utilities: filteredBills
        .filter((bill) => ["electricity", "water"].includes(bill.category))
        .reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0),
    }),
    [filteredBills]
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateModal = async () => {
    setEditingBill(null);
    setForm(emptyForm());
    setError("");
    setShowModal(true);
    if (!tenants.length) await fetchTenants(selectedProperty);
  };

  const openEditModal = (bill) => {
    setEditingBill(bill);
    setForm({
      unitId: bill.unit?._id || bill.unit || "",
      tenantId: bill.tenant?._id || bill.tenant || "",
      billName: bill.billName || "",
      category: bill.category || "other",
      amount: String(bill.amount ?? ""),
      month: String(bill.month ?? new Date().getMonth() + 1),
      year: String(bill.year ?? new Date().getFullYear()),
      startDate: bill.startDate ? new Date(bill.startDate).toISOString().slice(0, 10) : "",
      endDate: bill.endDate ? new Date(bill.endDate).toISOString().slice(0, 10) : "",
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 10) : "",
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingBill(null);
    setForm(emptyForm());
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !selectedProperty ||
      !form.unitId ||
      !form.tenantId ||
      !form.billName.trim() ||
      !form.category ||
      form.amount === "" ||
      !form.month ||
      !form.year ||
      !form.startDate ||
      !form.endDate ||
      !form.dueDate
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const amount = Number(form.amount);
    const month = Number(form.month);
    const year = Number(form.year);
    const startDate = new Date(`${form.startDate}T00:00:00`);
    const endDate = new Date(`${form.endDate}T00:00:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setError("Select a valid billing month.");
      return;
    }

    if (!Number.isInteger(year) || year < 2000) {
      setError("Enter a valid billing year.");
      return;
    }

    const payload = {
      billName: form.billName.trim(),
      category: form.category,
      amount,
      month,
      year,
      startDate: form.startDate,
      endDate: form.endDate,
      dueDate: form.dueDate,
    };

    try {
      setSaving(true);
      setError("");

      if (editingBill) {
        await apiClient.put(
          `/bill/${selectedProperty}/${editingBill._id}`,
          payload
        );
        toast.success("Bill updated successfully.");
      } else {
        await apiClient.post(
          `/bill/${selectedProperty}/units/${form.unitId}/tenants/${form.tenantId}`,
          payload
        );
        toast.success("Bill created successfully.");
      }

      setShowModal(false);
      setEditingBill(null);
      setForm(emptyForm());
      await fetchBills(selectedProperty);
    } catch (err) {
      const message = err.response?.data?.message || "Unable to save bill.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 p-4 text-stone-900 dark:text-stone-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Bill Management</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Create and manage rent, electricity, water and other bills.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label htmlFor="bill-property" className="mb-1 block text-sm font-medium">
              Select property
            </label>
            <select
              id="bill-property"
              value={selectedProperty}
              onChange={(event) => {
                setSelectedProperty(event.target.value);
                setCurrentPage(1);
              }}
              disabled={loadingProperties || properties.length === 0}
              className={inputClass}
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

        {error && !showModal && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xs border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              &times;
            </button>
          </div>
        )}

        <div className="mb-6 rounded-xs border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-stone-300">
          Manage tenant billing and track payments. Status updates automatically in real-time when tenants complete payment.
        </div>

        <section className="overflow-hidden rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-5 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Bills</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {filteredBills.length} bill{filteredBills.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter bills by tenant"
                value={tenantFilter}
                onChange={(event) => {
                  setTenantFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className={inputClass + " sm:w-44"}
              >
                <option value="all">All tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.fullName}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter bills by category"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className={inputClass + " sm:w-44"}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => fetchBills(selectedProperty)}
                disabled={!selectedProperty || loadingBills}
                className="rounded-xs border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                disabled={!selectedProperty || loadingProperties}
                className="rounded-xs bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Create Bill
              </button>
            </div>
          </div>

          {loadingProperties || loadingBills ? (
            <div className="p-10 text-center text-sm text-stone-500 dark:text-stone-400">
              Loading bills...
            </div>
          ) : properties.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No properties found</p>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Add a property before creating bills.
              </p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No bills found</p>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Create a bill for an active tenant to see it here.
              </p>
            </div>
          ) : (
            <>
            <div className="space-y-3 p-3 md:hidden">
              {paginatedBills.map((bill) => (
                <article key={bill._id} className="rounded-xs border border-stone-200 p-4 dark:border-neutral-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{bill.billName}</p>
                      <p className="mt-1 text-xs text-stone-500">{bill.tenant?.fullName || "Tenant"} · {bill.unit?.unitName || "—"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-xs capitalize dark:bg-neutral-800">{bill.category}</span>
                      {renderStatusBadge(bill.paymentStatus)}
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-stone-200 pt-3 dark:border-neutral-800">
                    <div className="text-xs text-stone-500">
                      <p>{formatMonth(bill.month, bill.year)}</p>
                      <p>Start: {formatDate(bill.startDate)}</p>
                      <p>End: {formatDate(bill.endDate)}</p>
                      <p>Due {formatDate(bill.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currency(bill.amount)}</p>
                      {bill.paymentStatus === "paid" ? (
                        <div className="mt-2 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReceiptAction(bill, "view")}
                            disabled={receiptLoadingId === bill._id}
                            title="View receipt in new tab"
                            className="inline-flex items-center gap-1 rounded-xs border border-stone-300 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-neutral-700 dark:text-stone-200"
                          >
                            {receiptLoadingId === bill._id && receiptActionType === "view" ? (
                              <LoaderCircle size={12} className="animate-spin text-stone-600 dark:text-stone-300" />
                            ) : (
                              <Eye size={12} />
                            )}
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReceiptAction(bill, "download")}
                            disabled={receiptLoadingId === bill._id}
                            title="Download receipt PDF"
                            className="inline-flex items-center gap-1 rounded-xs bg-yellow-400 px-2 py-1 text-xs font-medium text-stone-900 hover:bg-yellow-500 disabled:opacity-50"
                          >
                            {receiptLoadingId === bill._id && receiptActionType === "download" ? (
                              <LoaderCircle size={12} className="animate-spin text-black" />
                            ) : (
                              <Download size={12} />
                            )}
                            <span>Receipt</span>
                          </button>
                        </div>
                      ) : bill.paymentStatus === "reserved" ? (
                        <span className="mt-2 inline-block text-xs font-medium text-amber-600 dark:text-amber-400" title="Locked while tenant is in checkout">
                          In Checkout
                        </span>
                      ) : (
                        <button type="button" onClick={() => openEditModal(bill)} className="mt-2 rounded-xs border border-stone-300 px-3 py-1.5 text-xs font-medium dark:border-neutral-700">Edit</button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-neutral-800 dark:text-stone-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Bill</th>
                    <th className="px-5 py-4 font-medium">Category</th>
                    <th className="px-5 py-4 font-medium">Tenant</th>
                    <th className="px-5 py-4 font-medium">Unit</th>
                    <th className="px-5 py-4 font-medium">Billing Month</th>
                    <th className="px-5 py-4 font-medium">Start Date</th>
                    <th className="px-5 py-4 font-medium">End Date</th>
                    <th className="px-5 py-4 font-medium">Amount</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Due Date</th>
                    <th className="px-5 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-neutral-800">
                  {paginatedBills.map((bill) => (
                    <tr key={bill._id} className="transition hover:bg-stone-50 dark:hover:bg-neutral-800/60">
                      <td className="px-5 py-4 font-medium">{bill.billName}</td>
                      <td className="px-5 py-4 capitalize">{bill.category}</td>
                      <td className="px-5 py-4">
                        {bill.tenant?.fullName || "Tenant"}
                        <p className="text-xs text-stone-500">{bill.tenant?.phone || ""}</p>
                      </td>
                      <td className="px-5 py-4">{bill.unit?.unitName || "—"}</td>
                      <td className="px-5 py-4">{formatMonth(bill.month, bill.year)}</td>
                      <td className="px-5 py-4">{formatDate(bill.startDate)}</td>
                      <td className="px-5 py-4">{formatDate(bill.endDate)}</td>
                      <td className="px-5 py-4 font-medium">{currency(bill.amount)}</td>
                      <td className="px-5 py-4">{renderStatusBadge(bill.paymentStatus)}</td>
                      <td className="px-5 py-4">{formatDate(bill.dueDate)}</td>
                      <td className="px-5 py-4">
                        {bill.paymentStatus === "paid" ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReceiptAction(bill, "view")}
                              disabled={receiptLoadingId === bill._id}
                              title="View receipt in new tab"
                              className="inline-flex items-center gap-1 rounded-xs border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-stone-200 dark:hover:bg-neutral-700"
                            >
                              {receiptLoadingId === bill._id && receiptActionType === "view" ? (
                                <LoaderCircle size={13} className="animate-spin text-stone-600 dark:text-stone-300" />
                              ) : (
                                <Eye size={13} />
                              )}
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReceiptAction(bill, "download")}
                              disabled={receiptLoadingId === bill._id}
                              title="Download receipt PDF"
                              className="inline-flex items-center gap-1 rounded-xs bg-yellow-400 px-2.5 py-1.5 text-xs font-medium text-stone-900 hover:bg-yellow-500 disabled:opacity-50"
                            >
                              {receiptLoadingId === bill._id && receiptActionType === "download" ? (
                                <LoaderCircle size={13} className="animate-spin text-black" />
                              ) : (
                                <Download size={13} />
                              )}
                              <span>Receipt</span>
                            </button>
                          </div>
                        ) : bill.paymentStatus === "reserved" ? (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400" title="Locked while tenant is in checkout">
                            In Checkout
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openEditModal(bill)}
                            className="rounded-xs border border-stone-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={safePage}
              totalItems={filteredBills.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
            </>
          )}
        </section>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-modal-title"
            className="my-auto flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-h-[92dvh]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200 p-5 dark:border-neutral-800">
              <div>
                <h2 id="bill-modal-title" className="text-xl font-semibold">
                  {editingBill ? "Update Bill" : "Create Bill"}
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {editingBill
                    ? "Update the bill details."
                    : "Select a property, unit and tenant, then enter the bill details."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-2xl text-stone-500 hover:text-stone-900 disabled:opacity-50 dark:hover:text-white"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div role="alert" className="rounded-xs border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                  </div>
                )}

                {!editingBill && (
                  <>
                    <div>
                      <label htmlFor="bill-modal-property" className="mb-1 block text-sm font-medium">
                        Property
                      </label>
                      <select
                        id="bill-modal-property"
                        required
                        value={selectedProperty}
                        disabled={loadingProperties || properties.length === 0}
                        onChange={(event) => {
                          const propertyId = event.target.value;
                          setSelectedProperty(propertyId);
                          setForm((current) => ({
                            ...current,
                            unitId: "",
                            tenantId: "",
                          }));
                        }}
                        className={inputClass}
                      >
                        <option value="">Select property</option>
                        {properties.map((property) => (
                          <option key={property._id} value={property._id}>
                            {property.propertyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="bill-tenant" className="mb-1 block text-sm font-medium">
                          Tenant
                        </label>
                        <select
                          id="bill-tenant"
                          required
                          value={form.tenantId}
                          disabled={loadingTenants || tenants.length === 0}
                          onChange={(event) => handleTenantChange(event.target.value)}
                          className={inputClass}
                        >
                          <option value="">
                            {loadingTenants
                              ? "Loading tenants..."
                              : tenants.length === 0
                              ? "No active tenants found"
                              : "Select tenant"}
                          </option>
                          {tenants.map((tenant) => (
                            <option key={tenant._id} value={tenant._id}>
                              {tenant.fullName} {tenant.unit?.unitName ? `(${tenant.unit.unitName})` : ""}
                            </option>
                          ))}
                        </select>
                        {!loadingTenants && tenants.length === 0 && (
                          <p className="mt-1 text-xs text-stone-500">
                            No active tenants in this property.
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="bill-unit" className="mb-1 block text-sm font-medium">
                          Unit
                        </label>
                        <select
                          id="bill-unit"
                          required
                          value={form.unitId}
                          disabled={loadingTenants || units.length === 0}
                          onChange={(event) => handleUnitChange(event.target.value)}
                          className={inputClass}
                        >
                          <option value="">
                            {loadingTenants ? "Loading units..." : "Select unit"}
                          </option>
                          {units.map((unit) => (
                            <option key={unit._id} value={unit._id}>
                              {unit.unitName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="bill-name" className="mb-1 block text-sm font-medium">
                    Bill name
                  </label>
                  <input
                    id="bill-name"
                    type="text"
                    required
                    maxLength={100}
                    value={form.billName}
                    onChange={(event) => updateForm("billName", event.target.value)}
                    placeholder="e.g. November Electricity Bill"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bill-category" className="mb-1 block text-sm font-medium">
                      Category
                    </label>
                    <select
                      id="bill-category"
                      required
                      value={form.category}
                      onChange={(event) => {
                        const category = event.target.value;
                        setForm((current) => ({
                          ...current,
                          category,
                          amount:
                            category === "rent"
                              ? String(selectedUnit?.rent ?? "")
                              : current.amount,
                        }));
                      }}
                      className={inputClass}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="bill-amount" className="mb-1 block text-sm font-medium">
                      Amount (₹)
                    </label>
                    <input
                      id="bill-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={form.amount}
                      onChange={(event) => updateForm("amount", event.target.value)}
                      placeholder={
                        form.category === "rent"
                          ? "Automatically filled from unit rent"
                          : "Enter amount"
                      }
                      className={`${inputClass} ${
                        form.category === "rent"
                          ? "bg-stone-100 dark:bg-neutral-800"
                          : ""
                      }`}
                    />
                    {form.category === "rent" && (
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        Rent is taken automatically from the selected unit.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bill-month" className="mb-1 block text-sm font-medium">
                      Billing month
                    </label>
                    <select
                      id="bill-month"
                      required
                      value={form.month}
                      onChange={(event) => updateForm("month", event.target.value)}
                      className={inputClass}
                    >
                      {MONTHS.map((monthName, index) => (
                        <option key={monthName} value={index + 1}>
                          {monthName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="bill-year" className="mb-1 block text-sm font-medium">
                      Billing year
                    </label>
                    <input
                      id="bill-year"
                      type="number"
                      min="2000"
                      required
                      value={form.year}
                      onChange={(event) => updateForm("year", event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bill-start-date" className="mb-1 block text-sm font-medium">
                      Bill start date
                    </label>
                    <input
                      id="bill-start-date"
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(event) => updateForm("startDate", event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="bill-end-date" className="mb-1 block text-sm font-medium">
                      Bill end date
                    </label>
                    <input
                      id="bill-end-date"
                      type="date"
                      required
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={(event) => updateForm("endDate", event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bill-due-date" className="mb-1 block text-sm font-medium">
                    Due date
                  </label>
                  <input
                    id="bill-due-date"
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(event) => updateForm("dueDate", event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-4 dark:border-neutral-800 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xs border border-stone-300 px-4 py-2.5 text-sm hover:bg-stone-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || (!editingBill && (loadingTenants || !tenants.length))}
                    className="rounded-xs bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingBill ? "Update Bill" : "Create Bill"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bill;
