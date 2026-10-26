
import React, { useEffect, useState } from "react";
import apiClient from "../../ApiClient/interceptor.js"
import { Pencil, Trash2, X, AlertTriangle } from "lucide-react";

const emptyProperty = {
    propertyName: "",
    address: "",
};

const emptyUnit = {
    unitName: "",
    unitType: "residential",
    rent: "",
};

const emptyTenant = {
    fullName: "",
    address: "",
    aadhaarNumber: "",
    username: "",
    email: "",
    password: "",
}

const Property = () => {
    // Property state
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [property, setProperty] = useState(emptyProperty);

    // Property modal state
    const [propertyModalOpen, setPropertyModalOpen] = useState(false);
    const [isEditingProperty, setIsEditingProperty] = useState(false);

    // Unit state
    const [units, setUnits] = useState([]);
    const [unit, setUnit] = useState(emptyUnit);
    const [selectedUnit, setSelectedUnit] = useState(null);

    // Unit modal state
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [isEditingUnit, setIsEditingUnit] = useState(false);

    // tenant state
    const [tenant, setTenant] = useState(emptyTenant)

    // Tenant modal state
    const [tenantModalOpen, setTenantModalOpen] = useState(false);
    const [tenantDetailsOpen, setTenantDetailsOpen] = useState(false);
    const [tenantDetails, setTenantDetails] = useState(null);
    const [tenantDetailsLoading, setTenantDetailsLoading] = useState(false);
    const [tenantDetailsError, setTenantDetailsError] = useState("");

    // Loading and messages
    const [loading, setLoading] = useState(true);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [unitError, setUnitError] = useState("");
    const [tenantError, setTenantError] = useState("");
    const [success, setSuccess] = useState("");
    const [confirmModal, setConfirmModal] = useState({ open: false, type: "", id: null, title: "", message: "" });
    const [deleting, setDeleting] = useState(false);

    // Fetch all properties
    const getProperties = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiClient.get("/property/");
            const data = response.data.data || [];

            setProperties(data);

            setSelectedProperty((current) =>
                data.find((item) => item._id === current?._id) || null
            );
        } catch (err) {
            if (err.response?.status === 404) {
                setProperties([]);
                setSelectedProperty(null);
            } else {
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch properties."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProperties();
    }, []);

    // Fetch units belonging to the selected property
    const getUnits = async (propertyId) => {
        if (!propertyId) {
            setUnits([]);
            return;
        }

        try {
            setUnitsLoading(true);
            setUnitError("");

            const response = await apiClient.get(
                `/property/${propertyId}/units`
            );

            setUnits(response.data.data || []);
        } catch (err) {
            if (err.response?.status === 404) {
                setUnits([]);
            } else {
                setUnits([]);
                setUnitError(
                    err.response?.data?.message ||
                    "Failed to fetch units."
                );
            }
        } finally {
            setUnitsLoading(false);
        }
    };

    // Fetch units whenever the selected property changes
    useEffect(() => {
        setUnits([]);
        setUnitError("");

        if (selectedProperty?._id) {
            getUnits(selectedProperty._id);
        }
    }, [selectedProperty?._id]);

    // Property form input
    const handleChange = (e) => {
        setProperty((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    // Unit form input
    const handleUnitChange = (e) => {
        setUnit((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    // Open add property modal
    const openAddForm = () => {
        setProperty({ ...emptyProperty });
        setIsEditingProperty(false);
        setError("");
        setPropertyModalOpen(true);
    };

    // Open edit property modal
    const openEditForm = (item) => {
        setProperty({
            propertyName: item.propertyName,
            address: item.address,
        });

        setSelectedProperty(item);
        setIsEditingProperty(true);
        setError("");
        setPropertyModalOpen(true);
    };

    // Close property modal
    const closeForm = () => {
        if (submitting) return;

        setPropertyModalOpen(false);
        setProperty({ ...emptyProperty });
        setError("");
    };

    // Add or update property
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = {
            propertyName: property.propertyName.trim(),
            address: property.address.trim(),
        };

        if (!formData.propertyName || !formData.address) {
            setError("Please enter both property name and address.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            if (isEditingProperty && selectedProperty) {
                await apiClient.put(
                    `/property/${selectedProperty._id}`,
                    formData
                );
            } else {
                await apiClient.post("/property/", formData);
            }

            setPropertyModalOpen(false);
            setProperty({ ...emptyProperty });

            await getProperties();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                `Failed to ${isEditingProperty ? "update" : "add"} property.`
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Open a custom confirmation modal before deleting a property
    const handleDelete = (propertyId) => {
        const item = properties.find((propertyItem) => propertyItem._id === propertyId);
        setConfirmModal({
            open: true,
            type: "property",
            id: propertyId,
            title: "Delete property?",
            message: `Are you sure you want to delete "${item?.propertyName || "this property"}"? This action cannot be undone.`,
        });
    };

    // Open a custom confirmation modal before deleting a unit
    const handleDeleteUnit = (unitId) => {
        if (!selectedProperty?._id) return;
        const item = units.find((unitItem) => unitItem._id === unitId);
        setConfirmModal({
            open: true,
            type: "unit",
            id: unitId,
            title: "Delete unit?",
            message: `Are you sure you want to delete "${item?.unitName || "this unit"}"? This action cannot be undone.`,
        });
    };

    const closeConfirmModal = () => {
        if (deleting) return;
        setConfirmModal({ open: false, type: "", id: null, title: "", message: "" });
    };

    const confirmDelete = async () => {
        if (!confirmModal.id || !confirmModal.type) return;

        try {
            setDeleting(true);
            setError("");
            setUnitError("");
            setSuccess("");

            if (confirmModal.type === "property") {
                await apiClient.delete(`/property/${confirmModal.id}`);

                if (selectedProperty?._id === confirmModal.id) {
                    setSelectedProperty(null);
                    setUnits([]);
                }

                setConfirmModal({ open: false, type: "", id: null, title: "", message: "" });
                await getProperties();
            } else if (confirmModal.type === "unit") {
                await apiClient.delete(
                    `/property/${selectedProperty._id}/units/${confirmModal.id}`
                );

                setConfirmModal({ open: false, type: "", id: null, title: "", message: "" });
                setSuccess("Unit deleted successfully!");
                await getUnits(selectedProperty._id);
            }
        } catch (err) {
            const message = err.response?.data?.message ||
                (confirmModal.type === "property"
                    ? "Failed to delete property."
                    : "Failed to delete unit.");

            if (confirmModal.type === "property") setError(message);
            else setUnitError(message);
        } finally {
            setDeleting(false);
        }
    };

    // Select or deselect property
    const selectProperty = (item) => {
        setSelectedProperty(item);
        setSuccess("");
    };

    const deselectProperty = () => {
        setSelectedProperty(null);
        setUnits([]);
        setSuccess("");
    };

    // Open add unit modal
    const openAddUnitForm = () => {
        if (!selectedProperty) return;

        setUnit({ ...emptyUnit });
        setSelectedUnit(null);
        setIsEditingUnit(false);
        setUnitError("");
        setSuccess("");
        setUnitModalOpen(true);
    };

    // Open edit unit modal
    const openEditUnitForm = (item) => {
        setUnit({
            unitName: item.unitName,
            unitType: item.unitType,
            rent: String(item.rent),
        });

        setSelectedUnit(item);
        setIsEditingUnit(true);
        setUnitError("");
        setSuccess("");
        setUnitModalOpen(true);
    };

    // Close unit modal
    const closeUnitForm = () => {
        if (submitting) return;

        setUnitModalOpen(false);
        setUnit({ ...emptyUnit });
        setSelectedUnit(null);
        setUnitError("");
    };

    // Add or update unit
    const handleUnitSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProperty?._id) {
            setUnitError("Please select a property first.");
            return;
        }

        const formData = {
            unitName: unit.unitName.trim(),
            unitType: unit.unitType,
            rent: Number(unit.rent),
        };

        if (!formData.unitName) {
            setUnitError("Please enter a unit name.");
            return;
        }

        if (!["residential", "commercial"].includes(formData.unitType)) {
            setUnitError("Please select a valid unit type.");
            return;
        }

        if (
            unit.rent === "" ||
            !Number.isFinite(formData.rent) ||
            formData.rent <= 0
        ) {
            setUnitError("Rent must be greater than zero.");
            return;
        }

        try {
            setSubmitting(true);
            setUnitError("");
            setSuccess("");

            if (isEditingUnit && selectedUnit) {
                await apiClient.put(
                    `/property/${selectedProperty._id}/units/${selectedUnit._id}`,
                    formData
                );

                setSuccess("Unit updated successfully!");
            } else {
                await apiClient.post(
                    `/property/${selectedProperty._id}/units`,
                    formData
                );

                setSuccess("Unit added successfully!");
            }

            setUnitModalOpen(false);
            setUnit({ ...emptyUnit });
            setSelectedUnit(null);

            await getUnits(selectedProperty._id);
        } catch (err) {
            setUnitError(
                err.response?.data?.message ||
                `Failed to ${isEditingUnit ? "update" : "add"} unit.`
            );
        } finally {
            setSubmitting(false);
        }
    };



    // Tenant form input
    const handleTenantChange = (e) => {
        setTenant((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    // Open add Tenant modal

    const openAddTenantForm = (item) => {
        if (!item || item.status !== "available") return;

        setSelectedUnit(item);
        setTenant({ ...emptyTenant });
        setTenantError("");
        setSuccess("");
        setTenantModalOpen(true);
    };

    // Find and show the active tenant assigned to an occupied unit
    const openTenantDetails = async (unitItem) => {
        if (!selectedProperty?._id || !unitItem?._id) return;

        setTenantDetails(null);
        setTenantDetailsError("");
        setTenantDetailsLoading(true);
        setTenantDetailsOpen(true);

        try {
            const response = await apiClient.get(
                `/property/${selectedProperty._id}/tenants`
            );
            const tenantList = response.data.data || [];
            const matchingTenant = tenantList.find((entry) => {
                const tenantUnitId = entry.unit?._id || entry.unit;
                return String(tenantUnitId) === String(unitItem._id) && entry.isActive !== false;
            });

            if (!matchingTenant) {
                setTenantDetailsError("No active tenant was found for this unit.");
                return;
            }

            setTenantDetails(matchingTenant);
        } catch (err) {
            setTenantDetailsError(
                err.response?.data?.message || "Failed to load tenant details."
            );
        } finally {
            setTenantDetailsLoading(false);
        }
    };

    const closeTenantDetails = () => {
        setTenantDetailsOpen(false);
        setTenantDetails(null);
        setTenantDetailsError("");
    };

    // Close Tenant modal
    const closeTenantForm = () => {
        if (submitting) return;

        setTenantModalOpen(false);
        setTenant({ ...emptyTenant });
        setSelectedUnit(null);
        setTenantError("");
    };

    // Register a tenant for the selected available unit
    const handleTenantSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProperty?._id || !selectedUnit?._id) {
            setTenantError("Please select a property and an available unit first.");
            return;
        }

        const aadhaarNumber = tenant.aadhaarNumber.trim();

        const formData = {
            fullName: tenant.fullName.trim(),
            address: tenant.address.trim(),
            aadhaarNumber,
            username: tenant.username.trim(),
            email: tenant.email.trim(),
            password: tenant.password,
        };

        if (
            !formData.fullName ||
            !formData.address ||
            !formData.username ||
            !formData.email ||
            !formData.password
        ) {
            setTenantError("Please fill in all required fields.");
            return;
        }

        if (!/^\d{12}$/.test(aadhaarNumber)) {
            setTenantError("Aadhaar number must contain exactly 12 digits.");
            return;
        }

        try {
            setSubmitting(true);
            setTenantError("");
            setSuccess("");

            await apiClient.post(
                `/property/${selectedProperty._id}/units/${selectedUnit._id}/tenants`,
                formData
            );

            setTenantModalOpen(false);
            setTenant({ ...emptyTenant });
            setSelectedUnit(null);
            setSuccess("Tenant registered successfully!");

            await getUnits(selectedProperty._id);
        } catch (err) {
            setTenantError(
                err.response?.data?.message || "Failed to register tenant."
            );
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="min-h-full w-full bg-[#faf9f6] p-4 transition-colors duration-300 dark:bg-[#111111] md:p-8" >
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center" onClick={deselectProperty}>
                <div className="m-2">
                    <h1 className="my-4 text-3xl font-semibold text-gray-900 dark:text-white md:text-4xl">
                        Good homes. Better managed.
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400">
                        Your properties, rental units and occupancy in one place.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="whitespace-nowrap rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black transition hover:bg-yellow-400"
                >
                    + Add Property
                </button>
            </div>

            {/* Properties Section */}
            <div className="mt-10">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Properties
                    </h2>

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {properties.length}{" "}
                        {properties.length === 1 ? "property" : "properties"}
                    </span>
                </div>

                {error && !propertyModalOpen && (
                    <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="py-10 text-center text-gray-500 dark:text-gray-400">
                        Loading properties...
                    </p>
                ) : properties.length === 0 ? (
                    <div className="rounded-xs border border-gray-200 bg-white p-10 text-center dark:border-stone-800 dark:bg-[#1b1b1b]">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            No properties yet
                        </h3>

                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Add your first property to get started.
                        </p>

                        <button
                            type="button"
                            onClick={openAddForm}
                            className="mt-5 rounded-lg bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400"
                        >
                            + Add Your First Property
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {properties.map((item) => {
                            const isSelected =
                                selectedProperty?._id === item._id;

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => selectProperty(item)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            selectProperty(item);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isSelected}
                                    className={`w-full cursor-pointer rounded-xs border p-6 text-left shadow-sm transition hover:border-yellow-400 hover:shadow-md ${isSelected
                                        ? "border-yellow-400 ring-2 ring-yellow-400/30"
                                        : "border-gray-200 dark:border-stone-800"
                                        } bg-white dark:bg-[#1b1b1b]`}
                                >
                                    <div className="mb-4">
                                        {isSelected && (
                                            <span className="rounded-xs bg-yellow-300 px-2 py-1 text-xs font-medium text-black">
                                                Selected
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="break-words text-lg font-semibold text-gray-900 dark:text-white">
                                        {item.propertyName}
                                    </h3>

                                    <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-400">
                                        {item.address}
                                    </p>

                                    <div className="mt-4 flex">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditForm(item);
                                            }}
                                            aria-label={`Edit ${item.propertyName}`}
                                            title="Edit property"
                                            className="mx-0 my-1 inline-flex m-1 items-center justify-center rounded-xs border border-black bg-yellow-300 p-2 text-gray-900 transition hover:bg-yellow-300 hover:text-black dark:text-gray-900 dark:hover:bg-yellow-400"
                                        >
                                            <Pencil size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item._id);
                                            }}
                                            aria-label={`Delete ${item.propertyName}`}
                                            title="Delete property"
                                            className="mx-1 my-1 inline-flex items-center justify-center rounded-xs border border-red-200 p-2 text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Selected Property */}
                {selectedProperty && (
                    <div className="mt-6 border-b border-gray-200 pb-5 dark:border-stone-800">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {selectedProperty.propertyName}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {selectedProperty.address}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={deselectProperty}
                                    className="rounded-xs border border-yellow-400 px-5 py-3 font-medium text-black transition hover:bg-gray-100 dark:border-yellow-300 dark:text-white dark:hover:bg-stone-800"
                                >
                                    Deselect Property
                                </button>

                                <button
                                    type="button"
                                    onClick={openAddUnitForm}
                                    className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black transition hover:bg-yellow-400"
                                >
                                    + Add Unit
                                </button>
                            </div>
                        </div>

                        {/* Unit Messages */}
                        {unitError && !unitModalOpen && (
                            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                                {unitError}
                            </p>
                        )}

                        {success && (
                            <p className="mt-4 text-sm text-green-700 dark:text-green-400">
                                {success}
                            </p>
                        )}


                        {/* Units List */}
                        <div className="mt-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Units
                                </h3>

                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {units.length} {units.length === 1 ? "unit" : "units"}
                                </span>
                            </div>

                            {unitsLoading ? (
                                <p className="py-6 text-gray-500 dark:text-gray-400">
                                    Loading units...
                                </p>
                            ) : units.length === 0 ? (
                                <div className="rounded-xs border border-gray-200 bg-white p-6 dark:border-stone-800 dark:bg-[#1b1b1b]">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No units added to this property yet.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={openAddUnitForm}
                                        className="mt-4 rounded-xs bg-yellow-300 px-4 py-2 font-medium text-black hover:bg-yellow-400"
                                    >
                                        + Add First Unit
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xs border border-gray-200 dark:border-stone-800">
                                    {/* Table Header */}
                                    <div className="grid min-w-[800px] grid-cols-[2fr_1.4fr_1.4fr_1.2fr_1fr] items-center gap-4 border-b border-gray-200 bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 dark:border-stone-800 dark:bg-[#1b1b1b] dark:text-gray-300">
                                        <span>Unit Name</span>
                                        <span className="text-center">Type</span>
                                        <span className="text-center">Monthly Rent</span>
                                        <span className="text-center">Status</span>
                                        <span className="text-right">Actions</span>
                                    </div>

                                    {/* Unit Rows */}
                                    {units.map((item, index) => (
                                        <div
                                            key={item._id}
                                            className={`grid min-w-[800px] grid-cols-[2fr_1.4fr_1.4fr_1.2fr_1fr] items-center gap-4 bg-white px-6 py-4 transition hover:bg-yellow-50 dark:bg-[#151515] dark:hover:bg-[#222222] ${index !== units.length - 1
                                                ? "border-b border-gray-200 dark:border-stone-800"
                                                : ""
                                                }`}
                                        >
                                            {/* Unit Name */}
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {item.unitName}
                                            </span>

                                            {/* Type */}
                                            <span className="text-center text-sm capitalize text-gray-600 dark:text-gray-400">
                                                {item.unitType}
                                            </span>

                                            {/* Monthly Rent */}
                                            <span className="text-center text-sm font-medium text-gray-900 dark:text-white">
                                                ₹{Number(item.rent).toLocaleString("en-IN")}
                                            </span>

                                            {/* Status */}
                                            <div className="flex justify-center">
                                                <span
                                                    className={`inline-block rounded-xs px-2 py-1 text-xs font-medium ${item.status === "available"
                                                        ? "bg-green-100 text-green-800"
                                                        : item.status === "occupied"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap justify-end gap-1">
                                                {item.status === "available" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openAddTenantForm(item)}
                                                        className="rounded-xs bg-yellow-300 px-3 py-1 text-sm font-medium text-black hover:bg-yellow-400"
                                                    >
                                                        Add Tenant
                                                    </button>
                                                )}
                                                {item.status === "occupied" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openTenantDetails(item)}
                                                        className="rounded-xs border border-black bg-yellow-200 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-yellow-300 dark:text-gray-900 dark:hover:bg-yellow-400"
                                                    >
                                                        View Tenant
                                                    </button>
                                                )}
                                                <div className="p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditUnitForm(item)}
                                                        aria-label={`Edit ${item.unitName}`}
                                                        title="Edit unit"
                                                        className="inline-flex m-1 items-center justify-center rounded-xs border border-black bg-yellow-300 p-2 text-gray-900 transition hover:bg-yellow-300 hover:text-black dark:text-gray-900 dark:hover:bg-yellow-400"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteUnit(item._id)}
                                                        aria-label={`Delete ${item.unitName}`}
                                                        title="Delete unit"
                                                        className="inline-flex items-center justify-center rounded-xs border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* Add / Edit Property Modal */}
            {propertyModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={closeForm}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="property-form-title"
                        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] md:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2
                                    id="property-form-title"
                                    className="text-2xl font-semibold text-gray-900 dark:text-white"
                                >
                                    {isEditingProperty ? "Edit Property" : "Add New Property"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Enter your property's basic details.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={submitting}
                                aria-label="Close form"
                                className="rounded-lg p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50 dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-5">
                                <label
                                    htmlFor="propertyName"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Property Name
                                </label>

                                <input
                                    id="propertyName"
                                    name="propertyName"
                                    type="text"
                                    value={property.propertyName}
                                    onChange={handleChange}
                                    placeholder="e.g. Green Valley Apartments"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="address"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Property Address
                                </label>

                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    value={property.address}
                                    onChange={handleChange}
                                    placeholder="Enter property address"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            {error && (
                                <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="rounded-xs border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-yellow-300 dark:text-gray-200 dark:hover:bg-stone-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting
                                        ? "Saving..."
                                        : isEditingProperty
                                            ? "Update Property"
                                            : "Save Property"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add / Edit Unit Modal */}
            {unitModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={closeUnitForm}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="unit-form-title"
                        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] md:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2
                                    id="unit-form-title"
                                    className="text-2xl font-semibold text-gray-900 dark:text-white"
                                >
                                    {isEditingUnit ? "Edit Unit" : "Add New Unit"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Property: {selectedProperty?.propertyName}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeUnitForm}
                                disabled={submitting}
                                aria-label="Close unit form"
                                className="rounded-lg p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50 dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUnitSubmit}>
                            <div className="mb-5">
                                <label
                                    htmlFor="unitName"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Unit Name
                                </label>

                                <input
                                    id="unitName"
                                    name="unitName"
                                    type="text"
                                    value={unit.unitName}
                                    onChange={handleUnitChange}
                                    placeholder="e.g. Flat 101"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-5">
                                <label
                                    htmlFor="unitType"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Unit Type
                                </label>

                                <select
                                    id="unitType"
                                    name="unitType"
                                    value={unit.unitType}
                                    onChange={handleUnitChange}
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:focus:ring-yellow-400/20"
                                >
                                    <option value="residential">Residential</option>
                                    <option value="commercial">Commercial</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="rent"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Monthly Rent (₹)
                                </label>

                                <input
                                    id="rent"
                                    name="rent"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={unit.rent}
                                    onChange={handleUnitChange}
                                    placeholder="e.g. 12000"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            {unitError && (
                                <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                                    {unitError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeUnitForm}
                                    disabled={submitting}
                                    className="rounded-xs border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-yellow-300 dark:text-gray-200 dark:hover:bg-stone-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting
                                        ? "Saving..."
                                        : isEditingUnit
                                            ? "Update Unit"
                                            : "Save Unit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* tenant modal */}
            {tenantModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-4"
                    onClick={closeTenantForm}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tenant-form-title"
                        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] sm:max-h-[calc(100dvh-2rem)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-stone-800 sm:p-6">
                            <div className="min-w-0">
                                <h2
                                    id="tenant-form-title"
                                    className="text-2xl p-2 font-semibold w-full text-gray-900 dark:text-white"
                                >
                                    Add Tenant
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Unit: {selectedUnit?.unitName}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeTenantForm}
                                disabled={submitting}
                                aria-label="Close Tenant form"
                                className="rounded-lg p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50 dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleTenantSubmit} className="min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 md:pt-5">
                            <div className="mb-5">
                                <label
                                    htmlFor="fullName"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Full Name
                                </label>

                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={tenant.fullName}
                                    onChange={handleTenantChange}
                                    placeholder="e.g. Harneet Singh"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-5">
                                <label
                                    htmlFor="username"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Username
                                </label>

                                <input
                                    id="username"
                                    name="username"
                                    value={tenant.username}
                                    onChange={handleTenantChange}
                                    required
                                    placeholder="Enter tenant's Username"
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="address"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Address
                                </label>

                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    value={tenant.address}
                                    onChange={handleTenantChange}
                                    placeholder="Enter your address"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="aadhaarNumber"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Aadhaar Number
                                </label>

                                <input
                                    id="aadhaarNumber"
                                    name="aadhaarNumber"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{12}"
                                    maxLength={12}
                                    value={tenant.aadhaarNumber}
                                    onChange={handleTenantChange}
                                    placeholder="Enter 12-digit Aadhaar number"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Email
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={tenant.email}
                                    onChange={handleTenantChange}
                                    placeholder="e.g. example@gmail.com"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Password
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={tenant.password}
                                    onChange={handleTenantChange}
                                    placeholder="e.g. Enter tenant's password"
                                    required
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            {tenantError && (
                                <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                                    {tenantError}
                                </p>
                            )}

                            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeTenantForm}
                                    disabled={submitting}
                                    className="rounded-xs border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-yellow-300 dark:text-gray-200 dark:hover:bg-stone-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Save Tenant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Tenant Details Modal */}
            {tenantDetailsOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-4"
                    onClick={closeTenantDetails}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tenant-details-title"
                        className="my-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] sm:p-7"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 id="tenant-details-title" className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    Tenant Details
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {selectedProperty?.propertyName} · {tenantDetails?.unit?.unitName || selectedUnit?.unitName || "Occupied unit"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeTenantDetails}
                                aria-label="Close tenant details"
                                className="rounded-lg p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        {tenantDetailsLoading ? (
                            <p className="py-8 text-center text-gray-500 dark:text-gray-400">Loading tenant details...</p>
                        ) : tenantDetailsError ? (
                            <p className="rounded-xs bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                {tenantDetailsError}
                            </p>
                        ) : tenantDetails ? (
                            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                                {[
                                    ["Full Name", tenantDetails.fullName],
                                    ["Username", tenantDetails.user?.username || tenantDetails.username],
                                    ["Email", tenantDetails.user?.email || tenantDetails.email],
                                    ["Address", tenantDetails.address],
                                    ["Aadhaar Number", tenantDetails.aadhaarNumber],
                                    ["Unit", tenantDetails.unit?.unitName],
                                    ["Monthly Rent", tenantDetails.unit?.rent != null ? `₹${Number(tenantDetails.unit.rent).toLocaleString("en-IN")}` : "—"],
                                ].filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => (
                                    <div key={label} className="min-w-0 border-b border-gray-100 pb-3 dark:border-stone-800">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                                        <p className="mt-1 break-words text-sm text-gray-900 dark:text-white">{value}</p>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={closeTenantDetails}
                                className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom delete confirmation modal */}
            {confirmModal.open && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={closeConfirmModal}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-delete-title"
                        aria-describedby="confirm-delete-message"
                        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-700 dark:bg-[#1b1b1b]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                <AlertTriangle size={22} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 id="confirm-delete-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {confirmModal.title}
                                </h2>
                                <p id="confirm-delete-message" className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    {confirmModal.message}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeConfirmModal}
                                disabled={deleting}
                                aria-label="Close confirmation"
                                className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-stone-800"
                            >
                                <X size={19} />
                            </button>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeConfirmModal}
                                disabled={deleting}
                                className="rounded-xs border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 rounded-xs bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Trash2 size={16} />
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Property;