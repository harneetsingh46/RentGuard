import React, { useEffect, useState } from "react";
import apiClient from "../../ApiClient/interceptor.js";
import { notify } from "../../utils/notify";
import { X, LoaderCircle } from "lucide-react";

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const AddTenantModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialPropertyId = "",
  initialUnitId = "",
}) => {
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    aadhaarNumber: "",
    address: "",
    moveInDate: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize and fetch properties on open
  useEffect(() => {
    if (!isOpen) return;

    setSelectedPropertyId(initialPropertyId || "");
    setSelectedUnitId(initialUnitId || "");
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      aadhaarNumber: "",
      address: "",
      moveInDate: "",
    });
    setErrors({});

    const fetchProperties = async () => {
      try {
        setPropertiesLoading(true);
        const res = await apiClient.get("/property/");
        setProperties(res.data.data || []);
      } catch (err) {
        notify.error("Failed to load properties.");
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchProperties();
  }, [isOpen, initialPropertyId, initialUnitId]);

  // Fetch available units when property changes
  useEffect(() => {
    if (!isOpen || !selectedPropertyId) {
      setUnits([]);
      setSelectedUnitId("");
      return;
    }

    const fetchUnits = async () => {
      try {
        setUnitsLoading(true);
        const res = await apiClient.get(`/property/${selectedPropertyId}/units`);
        const allUnits = res.data.data || [];
        // Only units with status "available" (or currently preselected unit)
        const available = allUnits.filter(
          (u) => u.status === "available" || u._id === initialUnitId
        );
        setUnits(available);

        // Keep initialUnitId if valid, otherwise clear
        if (initialUnitId && available.some((u) => u._id === initialUnitId)) {
          setSelectedUnitId(initialUnitId);
        } else {
          setSelectedUnitId("");
        }
      } catch (err) {
        setUnits([]);
        setSelectedUnitId("");
      } finally {
        setUnitsLoading(false);
      }
    };

    fetchUnits();
  }, [isOpen, selectedPropertyId, initialUnitId]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!selectedPropertyId) {
      newErrors.propertyId = "Please select a property.";
    }

    if (!selectedUnitId) {
      newErrors.unitId = "Please select a unit.";
    }

    const trimmedName = formData.fullName.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      newErrors.fullName = "Full name must be between 2 and 100 characters.";
    }

    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    const digitsPhone = formData.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digitsPhone)) {
      newErrors.phone =
        "Phone number must be a valid 10-digit Indian mobile number.";
    }

    const digitsAadhaar = formData.aadhaarNumber.replace(/\D/g, "");
    if (!/^[2-9]\d{11}$/.test(digitsAadhaar)) {
      newErrors.aadhaarNumber =
        "Aadhaar number must contain 12 valid digits (first digit 2-9).";
    }

    const trimmedAddress = formData.address.trim();
    if (
      trimmedAddress &&
      (trimmedAddress.length < 5 || trimmedAddress.length > 250)
    ) {
      newErrors.address = "Address must be between 5 and 250 characters.";
    }

    if (formData.moveInDate) {
      const today = getTodayStr();
      if (formData.moveInDate < today) {
        newErrors.moveInDate = "Move-in date cannot be in the past.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const body = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ""),
        aadhaarNumber: formData.aadhaarNumber.replace(/\D/g, ""),
        address: formData.address.trim(),
      };

      if (formData.moveInDate) {
        body.moveInDate = formData.moveInDate;
      }

      await apiClient.post(
        `/property/${selectedPropertyId}/units/${selectedUnitId}/tenants`,
        body
      );

      notify.success("Tenant added successfully.");
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        notify.error(
          err.response?.data?.message ||
            "An active tenant with this Aadhaar, phone, or unit already exists."
        );
      } else {
        notify.error(
          err.response?.data?.message || "Failed to register tenant."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tenant-modal-title"
        className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="add-tenant-modal-title"
              className="text-2xl font-semibold text-gray-900 dark:text-white"
            >
              Add New Tenant
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Directly assign an active tenant to an available unit.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="rounded-sm p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50 dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Property Select */}
          <div className="mb-4">
            <label
              htmlFor="tenant-property-select"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Property *
            </label>
            <select
              id="tenant-property-select"
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                if (errors.propertyId) {
                  setErrors((prev) => ({ ...prev, propertyId: "" }));
                }
              }}
              disabled={submitting || propertiesLoading || Boolean(initialPropertyId)}
              className={inputClass}
            >
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.propertyName}
                </option>
              ))}
            </select>
            {errors.propertyId && (
              <p className="mt-1 text-xs text-red-500">{errors.propertyId}</p>
            )}
          </div>

          {/* Unit Select */}
          <div className="mb-4">
            <label
              htmlFor="tenant-unit-select"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Unit *
            </label>
            <select
              id="tenant-unit-select"
              value={selectedUnitId}
              onChange={(e) => {
                setSelectedUnitId(e.target.value);
                if (errors.unitId) {
                  setErrors((prev) => ({ ...prev, unitId: "" }));
                }
              }}
              disabled={
                submitting ||
                unitsLoading ||
                !selectedPropertyId ||
                Boolean(initialUnitId)
              }
              className={inputClass}
            >
              {!selectedPropertyId ? (
                <option value="">Pick a property first</option>
              ) : unitsLoading ? (
                <option value="">Loading units...</option>
              ) : units.length === 0 ? (
                <option value="">No available units</option>
              ) : (
                <>
                  <option value="">Select an available unit</option>
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.unitName} (₹{Number(u.rent).toLocaleString("en-IN")}/mo)
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.unitId && (
              <p className="mt-1 text-xs text-red-500">{errors.unitId}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label
              htmlFor="tenant-fullName"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Full Name *
            </label>
            <input
              id="tenant-fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="e.g. John Doe"
              disabled={submitting}
              className={inputClass}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="tenant-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Email Address *
            </label>
            <input
              id="tenant-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="e.g. tenant@example.com"
              disabled={submitting}
              className={inputClass}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone & Aadhaar Row */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tenant-phone"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                Mobile Phone (10 digits) *
              </label>
              <input
                id="tenant-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                value={formData.phone}
                onChange={(e) =>
                  handleInputChange(
                    "phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="9876543210"
                disabled={submitting}
                className={inputClass}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="tenant-aadhaar"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                Aadhaar Number (12 digits) *
              </label>
              <input
                id="tenant-aadhaar"
                type="text"
                inputMode="numeric"
                maxLength={12}
                required
                value={formData.aadhaarNumber}
                onChange={(e) =>
                  handleInputChange(
                    "aadhaarNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 12)
                  )
                }
                placeholder="Enter Tenant's Aadhaar Number"
                disabled={submitting}
                className={inputClass}
                autoComplete="off"
              />
              {errors.aadhaarNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.aadhaarNumber}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <label
              htmlFor="tenant-address"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Permanent Address <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="tenant-address"
              rows={2}
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="e.g. Flat 12, Park Street, Kolkata"
              disabled={submitting}
              className={inputClass}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Move-in Date */}
          <div className="mb-6">
            <label
              htmlFor="tenant-moveInDate"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Move-in Date <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="tenant-moveInDate"
              type="date"
              min={getTodayStr()}
              value={formData.moveInDate}
              onChange={(e) => handleInputChange("moveInDate", e.target.value)}
              disabled={submitting}
              className={inputClass}
            />
            {errors.moveInDate && (
              <p className="mt-1 text-xs text-red-500">{errors.moveInDate}</p>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xs border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || (units.length === 0 && Boolean(selectedPropertyId))}
              className="inline-flex items-center justify-center gap-2 rounded-xs bg-yellow-300 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Adding Tenant...
                </>
              ) : (
                "Add Tenant"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTenantModal;
