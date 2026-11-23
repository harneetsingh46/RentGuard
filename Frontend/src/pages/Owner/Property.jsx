
import React, { useEffect, useState } from "react";
import apiClient from "../../ApiClient/interceptor.js"
import { useAuth } from "../../context/AuthContext";
import { Pencil, Trash2, X, AlertTriangle, Search, Eye } from "lucide-react";
import toast from "react-hot-toast";
import AddTenantModal from "./AddTenantModal.jsx";

const emptyProperty = {
    propertyName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
};

const INDIAN_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
];

const emptyUnit = {
    unitName: "",
    unitType: "residential",
    rent: "",
};

const QUICK_FACILITIES = [
    "Parking",
    "Wi-Fi",
    "Lift",
    "Furnished",
    "Air conditioning",
    "Power backup",
    "Water supply",
    "Balcony",
    "Security",
    "Gas pipeline",
];


const Property = () => {
    const { user } = useAuth();
    const verificationStatus = user?.verificationStatus || "pending";
    const isApproved = verificationStatus === "approved";

    // Property state
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [property, setProperty] = useState(emptyProperty);
    const [propertySearch, setPropertySearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(propertySearch);
        }, 400);
        return () => clearTimeout(timer);
    }, [propertySearch]);

    // Property modal state
    const [propertyModalOpen, setPropertyModalOpen] = useState(false);
    const [isEditingProperty, setIsEditingProperty] = useState(false);
    const [propertyErrors, setPropertyErrors] = useState({});

    // Unit state
    const [units, setUnits] = useState([]);
    const [unit, setUnit] = useState(emptyUnit);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [existingImages, setExistingImages] = useState([]);
    const [removedImageIds, setRemovedImageIds] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [description, setDescription] = useState("");
    const [facilities, setFacilities] = useState([]);
    const [customFacility, setCustomFacility] = useState("");

    // Unit modal state
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [isEditingUnit, setIsEditingUnit] = useState(false);

    // Tenant details modal state
    const [tenantDetailsOpen, setTenantDetailsOpen] = useState(false);
    const [tenantDetails, setTenantDetails] = useState(null);
    const [tenantDetailsLoading, setTenantDetailsLoading] = useState(false);
    const [tenantDetailsError, setTenantDetailsError] = useState("");
    const [addTenantModal, setAddTenantModal] = useState({
        open: false,
        propertyId: null,
        unitId: null,
    });

    // Loading and messages
    const [loading, setLoading] = useState(true);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [, setErrorState] = useState("");
    const [, setUnitErrorState] = useState("");
    const [, setSuccessState] = useState("");

    // Keep existing validation logic while showing all messages as toast notifications.
    const setError = (message) => {
        setErrorState(message);
        if (message) toast.error(message);
    };
    const setUnitError = (message) => {
        setUnitErrorState(message);
        if (message) toast.error(message);
    };
    const setSuccess = (message) => {
        setSuccessState(message);
        if (message) toast.success(message);
    };
    const [confirmModal, setConfirmModal] = useState({ open: false, type: "", id: null, title: "", message: "" });
    const [deleting, setDeleting] = useState(false);

    // Fetch all properties
    const getProperties = async () => {
        try {
            setError("");

            const response = await apiClient.get("/property/", {
                params: { search: debouncedSearch || undefined },
            });
            const data = response.data.data || [];

            setProperties(data);

            setSelectedProperty((current) => {
                if (!current) return null;
                const match = data.find((item) => item._id === current._id);
                return match || null;
            });
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
    }, [debouncedSearch]);

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
        const { name, value } = e.target;
        const sanitizedValue =
            name === "pincode" ? value.replace(/\D/g, "").slice(0, 6) : value;

        setProperty((current) => ({
            ...current,
            [name]: sanitizedValue,
        }));

        if (propertyErrors[name]) {
            setPropertyErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    // Unit form input
    const handleUnitChange = (e) => {
        setUnit((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    const clearNewImages = () => {
        newImages.forEach((item) => {
            if (item.preview) URL.revokeObjectURL(item.preview);
        });
        setNewImages([]);
    };

    const handleRemoveExistingImage = (imgToRemove) => {
        setExistingImages((prev) =>
            prev.filter((img) => img.publicId !== imgToRemove.publicId)
        );
        if (imgToRemove.publicId) {
            setRemovedImageIds((prev) => [...prev, imgToRemove.publicId]);
        }
    };

    const handleRemoveNewImage = (indexToRemove) => {
        setNewImages((prev) => {
            const target = prev[indexToRemove];
            if (target?.preview) URL.revokeObjectURL(target.preview);
            return prev.filter((_, idx) => idx !== indexToRemove);
        });
    };

    const handleUnitImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        const currentTotal = existingImages.length + newImages.length;

        if (currentTotal + files.length > 5) {
            setUnitError("You can upload a maximum of 5 images per unit.");
            e.target.value = "";
            return;
        }

        const added = [];
        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                setUnitError("Please select only JPG, PNG, or WebP images.");
                e.target.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setUnitError("Each image size must be less than 5 MB.");
                e.target.value = "";
                return;
            }

            added.push({
                file,
                preview: URL.createObjectURL(file),
            });
        }

        setNewImages((prev) => [...prev, ...added]);
        setUnitError("");
        e.target.value = "";
    };

    const toggleQuickFacility = (fac) => {
        setFacilities((prev) => {
            const exists = prev.some(
                (item) => item.toLowerCase() === fac.toLowerCase()
            );
            if (exists) {
                return prev.filter(
                    (item) => item.toLowerCase() !== fac.toLowerCase()
                );
            }
            if (prev.length >= 15) {
                setUnitError("You can add at most 15 facilities.");
                return prev;
            }
            setUnitError("");
            return [...prev, fac];
        });
    };

    const handleAddCustomFacility = (e) => {
        if (e) e.preventDefault();
        const trimmed = customFacility.trim().slice(0, 30);
        if (!trimmed) return;
        if (facilities.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
            setUnitError("Facility already added.");
            return;
        }
        if (facilities.length >= 15) {
            setUnitError("You can add at most 15 facilities.");
            return;
        }
        setFacilities((prev) => [...prev, trimmed]);
        setCustomFacility("");
        setUnitError("");
    };

    const handleRemoveFacility = (fac) => {
        setFacilities((prev) => prev.filter((item) => item !== fac));
    };

    // Open add property modal
    const openAddForm = () => {
        if (!isApproved) return;

        setProperty({ ...emptyProperty });
        setPropertyErrors({});
        setIsEditingProperty(false);
        setError("");
        setPropertyModalOpen(true);
    };

    // Open edit property modal
    const openEditForm = (item) => {
        if (!isApproved) return;

        const line1 =
            item.addressLine1 || (item.address ? item.address : "");

        setProperty({
            propertyName: item.propertyName || "",
            addressLine1: line1,
            addressLine2: item.addressLine2 || "",
            city: item.city || "",
            state: item.state || "",
            pincode: item.pincode || "",
        });

        setSelectedProperty(item);
        setPropertyErrors({});
        setIsEditingProperty(true);
        setError("");
        setPropertyModalOpen(true);
    };

    // Close property modal
    const closeForm = () => {
        if (submitting) return;

        setPropertyModalOpen(false);
        setProperty({ ...emptyProperty });
        setPropertyErrors({});
        setError("");
    };

    // Add or update property
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isApproved) {
            setError("Your owner account must be approved before you can manage properties.");
            return;
        }

        const fieldErrors = {};

        if (!property.propertyName.trim()) {
            fieldErrors.propertyName = "Property name is required.";
        }

        if (!property.addressLine1.trim()) {
            fieldErrors.addressLine1 = "Address line 1 is required.";
        }

        if (!property.city.trim()) {
            fieldErrors.city = "City is required.";
        }

        if (!property.state.trim()) {
            fieldErrors.state = "State is required.";
        }

        if (!property.pincode.trim()) {
            fieldErrors.pincode = "Pincode is required.";
        } else if (!/^[1-9]\d{5}$/.test(property.pincode.trim())) {
            fieldErrors.pincode = "Pincode must be a 6-digit number not starting with 0.";
        }

        if (Object.keys(fieldErrors).length > 0) {
            setPropertyErrors(fieldErrors);
            return;
        }

        const formData = {
            propertyName: property.propertyName.trim(),
            addressLine1: property.addressLine1.trim(),
            addressLine2: property.addressLine2.trim(),
            city: property.city.trim(),
            state: property.state.trim(),
            pincode: property.pincode.trim(),
        };

        try {
            setSubmitting(true);
            setError("");
            setPropertyErrors({});

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
            setPropertyErrors({});
            setSuccess(
                isEditingProperty
                    ? "Property updated successfully!"
                    : "Property added successfully!"
            );

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
        if (!isApproved) return;

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
        if (!isApproved || !selectedProperty?._id) return;
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
        if (!isApproved || !confirmModal.id || !confirmModal.type) return;

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
                setSuccess("Property deleted successfully!");
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
        if (!isApproved || !selectedProperty) return;

        setUnit({ ...emptyUnit });
        clearNewImages();
        setExistingImages([]);
        setRemovedImageIds([]);
        setDescription("");
        setFacilities([]);
        setCustomFacility("");
        setSelectedUnit(null);
        setIsEditingUnit(false);
        setUnitError("");
        setSuccess("");
        setUnitModalOpen(true);
    };

    // Open edit unit modal
    const openEditUnitForm = (item) => {
        if (!isApproved) return;

        setUnit({
            unitName: item.unitName,
            unitType: item.unitType,
            rent: String(item.rent),
        });

        setDescription(item.description || "");
        setFacilities(Array.isArray(item.facilities) ? [...item.facilities] : []);
        setCustomFacility("");
        setSelectedUnit(item);
        setIsEditingUnit(true);
        setUnitError("");
        setSuccess("");
        setUnitModalOpen(true);
        clearNewImages();
        const imgs = Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : item.image?.url
                ? [item.image]
                : [];
        setExistingImages(imgs);
        setRemovedImageIds([]);
    };

    // Close unit modal
    const closeUnitForm = () => {
        if (submitting) return;

        setUnitModalOpen(false);
        setUnit({ ...emptyUnit });
        setSelectedUnit(null);
        setUnitError("");
        clearNewImages();
        setExistingImages([]);
        setRemovedImageIds([]);
        setDescription("");
        setFacilities([]);
        setCustomFacility("");
    };

    // Add or update unit
    const handleUnitSubmit = async (e) => {
        e.preventDefault();

        if (!isApproved) {
            setUnitError("Your owner account must be approved before you can manage units.");
            return;
        }

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

            const unitFormData = new FormData();
            unitFormData.append("unitName", formData.unitName);
            unitFormData.append("unitType", formData.unitType);
            unitFormData.append("rent", String(formData.rent));
            unitFormData.append("description", description.trim());
            unitFormData.append("facilities", JSON.stringify(facilities));

            newImages.forEach(({ file }) => {
                unitFormData.append("images", file);
            });

            if (isEditingUnit && selectedUnit) {
                unitFormData.append("removeImages", JSON.stringify(removedImageIds));
                await apiClient.put(
                    `/property/${selectedProperty._id}/units/${selectedUnit._id}`,
                    unitFormData
                );

                setSuccess("Unit updated successfully!");
            } else {
                await apiClient.post(
                    `/property/${selectedProperty._id}/units`,
                    unitFormData
                );

                setSuccess("Unit added successfully!");
            }

            setUnitModalOpen(false);
            setUnit({ ...emptyUnit });
            setSelectedUnit(null);
            clearNewImages();
            setExistingImages([]);
            setRemovedImageIds([]);
            setDescription("");
            setFacilities([]);
            setCustomFacility("");

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

    return (
        <div className="w-full bg-[#f2f2f1] p-4 dark:bg-[#101010] md:p-8 pb-12" >
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
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
                    disabled={!isApproved}
                    title={!isApproved ? "Available after owner verification" : "Add property"}
                    className="whitespace-nowrap rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    + Add Property
                </button>
            </div>

            {/* OWNER VERIFICATION STATUS */}
            {!isApproved && (
                <div
                    className={`mt-6 rounded-xs border p-5 ${verificationStatus === "rejected"
                        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                        : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                        }`}
                    role="status"
                >
                    <h2
                        className={`text-lg font-semibold ${verificationStatus === "rejected"
                            ? "text-red-700 dark:text-red-300"
                            : "text-amber-800 dark:text-amber-300"
                            }`}
                    >
                        {verificationStatus === "rejected"
                            ? "Owner Verification Rejected"
                            : "Your Account Is Under Verification"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                        {verificationStatus === "rejected"
                            ? "Your owner verification was not approved. Please contact the RentGuard support team for assistance."
                            : "Thank you for registering with RentGuard. Our team is reviewing your details. Once verification is complete, our team will reach out to you. You will be able to add and manage properties after approval."}
                    </p>

                    {verificationStatus !== "rejected" && (
                        <p className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-300">
                            Property and unit management is temporarily unavailable until your account is approved.
                        </p>
                    )}
                </div>
            )}

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

                {/* Search input */}
                <div className="relative mb-5 max-w-xl">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                    <input
                        type="text"
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                        placeholder="Search properties by name or address..."
                        className="w-full rounded-xs border border-gray-300 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                    />
                    {propertySearch && (
                        <button
                            type="button"
                            onClick={() => setPropertySearch("")}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {loading ? (
                    <p className="py-10 text-center text-gray-500 dark:text-gray-400">
                        Loading properties...
                    </p>
                ) : properties.length === 0 ? (
                    debouncedSearch.trim() ? (
                        <div className="rounded-xs border border-gray-200 bg-white p-10 text-center dark:border-stone-800 dark:bg-[#1b1b1b]">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                No properties match "{debouncedSearch}".
                            </h3>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">
                                Try searching with a different property name or address.
                            </p>
                        </div>
                    ) : (
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
                                disabled={!isApproved}
                                title={!isApproved ? "Available after owner verification" : "Add property"}
                                className="mt-5 rounded-sm bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                + Add Your First Property
                            </button>
                        </div>
                    )
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
                                            disabled={!isApproved}
                                            aria-label={`Edit ${item.propertyName}`}
                                            title="Edit property"
                                            className="mx-0 my-1 inline-flex m-1 items-center justify-center rounded-xs border border-black bg-yellow-300 p-2 text-gray-900 transition hover:bg-yellow-300 hover:text-black dark:text-gray-900 dark:hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Pencil size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item._id);
                                            }}
                                            disabled={!isApproved}
                                            aria-label={`Delete ${item.propertyName}`}
                                            title="Delete property"
                                            className="mx-1 my-1 inline-flex items-center justify-center rounded-xs border border-red-200 p-2 text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    disabled={!isApproved}
                                    title={!isApproved ? "Available after owner verification" : "Add unit"}
                                    className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    + Add Unit
                                </button>
                            </div>
                        </div>

                        {/* Unit Messages */}





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
                                <p className="py-6 text-gray-500  text-center dark:text-gray-400">
                                    Loading units...
                                </p>
                            ) : units.length === 0 ? (
                                <div className="rounded-xs text-center border border-gray-200 bg-white p-6 dark:border-stone-800 dark:bg-[#1b1b1b]">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No units added to this property yet.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={openAddUnitForm}
                                        disabled={!isApproved}
                                        title={!isApproved ? "Available after owner verification" : "Add unit"}
                                        className="mt-4 rounded-xs text-center bg-yellow-300 px-4 py-2 font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        + Add First Unit
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xs border border-gray-200 dark:border-stone-800">
                                    {/* Table Header */}
                                    <div className="grid min-w-[860px] grid-cols-[1.6fr_1.1fr_1.1fr_1fr_1.6fr] items-center gap-4 border-b border-gray-200 bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 dark:border-stone-800 dark:bg-[#1b1b1b] dark:text-gray-300">
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
                                            className={`grid min-w-[860px] grid-cols-[1.6fr_1.1fr_1.1fr_1fr_1.6fr] items-center gap-4 bg-white px-6 py-4 transition hover:bg-yellow-50 dark:bg-[#151515] dark:hover:bg-[#222222] ${index !== units.length - 1
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
                                                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${item.status === "available"
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
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status === "available" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddTenantModal({ open: true, propertyId: selectedProperty?._id, unitId: item._id })}
                                                        disabled={!isApproved}
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-yellow-500 bg-yellow-400 px-3 text-sm font-medium text-gray-900 transition hover:bg-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Add Tenant
                                                    </button>
                                                )}
                                                {item.status === "occupied" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openTenantDetails(item)}
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-yellow-500 bg-yellow-400 px-3 text-sm font-medium text-gray-900 transition hover:bg-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <Eye size={16} />
                                                        View Tenant
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditUnitForm(item)}
                                                            disabled={!isApproved}
                                                            aria-label={`Edit ${item.unitName}`}
                                                            title="Edit unit"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-neutral-800"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteUnit(item._id)}
                                                            disabled={!isApproved}
                                                            aria-label={`Delete ${item.unitName}`}
                                                            title="Delete unit"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-300 text-sm text-red-600 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
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
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="property-form-title"
                        className="w-full max-w-lg rounded-xs border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] md:p-8"
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
                                className="rounded-sm p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50 dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-4">
                                <label
                                    htmlFor="propertyName"
                                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Property Name <span className="text-red-500">*</span>
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
                                    className={`w-full rounded-xs border p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20 ${propertyErrors.propertyName ? "border-red-500 dark:border-red-500" : "border-gray-300 bg-white dark:border-stone-800"}`}
                                />
                                {propertyErrors.propertyName && (
                                    <p className="mt-1 text-xs text-red-500">{propertyErrors.propertyName}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label
                                    htmlFor="addressLine1"
                                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Address Line 1 <span className="text-red-500">*</span>
                                </label>

                                <input
                                    id="addressLine1"
                                    name="addressLine1"
                                    type="text"
                                    value={property.addressLine1}
                                    onChange={handleChange}
                                    placeholder="House / Flat / Block no., Building name, Street"
                                    required
                                    disabled={submitting}
                                    className={`w-full rounded-xs border p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20 ${propertyErrors.addressLine1 ? "border-red-500 dark:border-red-500" : "border-gray-300 bg-white dark:border-stone-800"}`}
                                />
                                {propertyErrors.addressLine1 && (
                                    <p className="mt-1 text-xs text-red-500">{propertyErrors.addressLine1}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label
                                    htmlFor="addressLine2"
                                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Address Line 2 <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                                </label>

                                <input
                                    id="addressLine2"
                                    name="addressLine2"
                                    type="text"
                                    value={property.addressLine2}
                                    onChange={handleChange}
                                    placeholder="Apartment, suite, landmark, area"
                                    disabled={submitting}
                                    className="w-full rounded-xs border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="city"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                    >
                                        City <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        value={property.city}
                                        onChange={handleChange}
                                        placeholder="e.g. Pune"
                                        required
                                        disabled={submitting}
                                        className={`w-full rounded-xs border p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20 ${propertyErrors.city ? "border-red-500 dark:border-red-500" : "border-gray-300 bg-white dark:border-stone-800"}`}
                                    />
                                    {propertyErrors.city && (
                                        <p className="mt-1 text-xs text-red-500">{propertyErrors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="state"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                    >
                                        State <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        id="state"
                                        name="state"
                                        value={property.state}
                                        onChange={handleChange}
                                        required
                                        disabled={submitting}
                                        className={`w-full rounded-xs border p-3 text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:bg-[#262626] dark:text-white dark:focus:ring-yellow-400/20 ${propertyErrors.state ? "border-red-500 dark:border-red-500" : "border-gray-300 bg-white dark:border-stone-800"}`}
                                    >
                                        <option value="">Select State / UT</option>
                                        {INDIAN_STATES.map((st) => (
                                            <option key={st} value={st}>
                                                {st}
                                            </option>
                                        ))}
                                    </select>
                                    {propertyErrors.state && (
                                        <p className="mt-1 text-xs text-red-500">{propertyErrors.state}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="pincode"
                                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    Pincode <span className="text-red-500">*</span>
                                </label>

                                <input
                                    id="pincode"
                                    name="pincode"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={property.pincode}
                                    onChange={handleChange}
                                    placeholder="6-digit pincode (e.g. 411001)"
                                    required
                                    disabled={submitting}
                                    className={`w-full rounded-xs border p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20 ${propertyErrors.pincode ? "border-red-500 dark:border-red-500" : "border-gray-300 bg-white dark:border-stone-800"}`}
                                />
                                {propertyErrors.pincode && (
                                    <p className="mt-1 text-xs text-red-500">{propertyErrors.pincode}</p>
                                )}
                            </div>



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
                                    disabled={submitting || !isApproved}
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
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="unit-form-title"
                        className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-xs border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] md:p-8"
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
                                className="rounded-sm p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50 dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUnitSubmit}>
                            {/* Unit Images */}
                            <div className="mb-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="unitImages"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                                    >
                                        Unit Pictures ({existingImages.length + newImages.length}/5)
                                    </label>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Max 5 images
                                    </span>
                                </div>

                                {(existingImages.length > 0 || newImages.length > 0) && (
                                    <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                                        {existingImages.map((img, idx) => (
                                            <div
                                                key={img.publicId || idx}
                                                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-stone-700 dark:bg-neutral-800"
                                            >
                                                <img
                                                    src={img.url}
                                                    alt="Unit"
                                                    className="h-full w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(img)}
                                                    disabled={submitting}
                                                    aria-label="Remove image"
                                                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-red-600"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}

                                        {newImages.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="group relative aspect-square overflow-hidden rounded-lg border border-yellow-300 bg-gray-100 dark:border-yellow-500 dark:bg-neutral-800"
                                            >
                                                <img
                                                    src={item.preview}
                                                    alt="New unit"
                                                    className="h-full w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNewImage(idx)}
                                                    disabled={submitting}
                                                    aria-label="Remove image"
                                                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-red-600"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <span className="absolute bottom-1 left-1 rounded bg-yellow-400 px-1 py-0.5 text-[9px] font-bold text-black">
                                                    New
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {existingImages.length + newImages.length < 5 && (
                                    <input
                                        id="unitImages"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        onChange={handleUnitImagesChange}
                                        disabled={submitting}
                                        className="w-full rounded-xs border border-gray-300 bg-white p-3 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-yellow-300 file:px-4 file:py-2 file:font-medium file:text-black dark:border-stone-800 dark:bg-[#262626] dark:text-gray-200"
                                    />
                                )}

                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    JPG, PNG or WebP. Up to 5 images, maximum size 5 MB each.
                                </p>
                            </div>

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
                                    className="w-full rounded-xs border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
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
                                    className="w-full rounded-xs border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:focus:ring-yellow-400/20"
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
                                    className="w-full rounded-xs border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            {/* Description */}
                            <div className="mb-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="unitDescription"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                                    >
                                        Description <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                                    </label>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {description.length}/500
                                    </span>
                                </div>
                                <textarea
                                    id="unitDescription"
                                    name="description"
                                    rows={4}
                                    maxLength={500}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell tenants about the unit, space, layout, natural light, etc."
                                    disabled={submitting}
                                    className="w-full rounded-xs border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                />
                            </div>

                            {/* Facilities */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Facilities ({facilities.length}/15)
                                </label>

                                {/* Quick-pick toggle chips */}
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {QUICK_FACILITIES.map((fac) => {
                                        const isSelected = facilities.some(
                                            (f) => f.toLowerCase() === fac.toLowerCase()
                                        );
                                        return (
                                            <button
                                                key={fac}
                                                type="button"
                                                onClick={() => toggleQuickFacility(fac)}
                                                disabled={submitting}
                                                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                                    isSelected
                                                        ? "bg-yellow-400 text-black dark:bg-yellow-400 dark:text-black"
                                                        : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-stone-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                                                }`}
                                            >
                                                {isSelected ? `✓ ${fac}` : `+ ${fac}`}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom facility input */}
                                <div className="mb-3 flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={30}
                                        value={customFacility}
                                        onChange={(e) => setCustomFacility(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddCustomFacility();
                                            }
                                        }}
                                        placeholder="Add custom facility (e.g. Geyser, Swimming pool)..."
                                        disabled={submitting || facilities.length >= 15}
                                        className="flex-1 rounded-xs border border-gray-300 bg-white p-2.5 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomFacility}
                                        disabled={submitting || !customFacility.trim() || facilities.length >= 15}
                                        className="rounded-xs border border-yellow-400 bg-yellow-300 px-4 py-2 text-xs font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Selected facilities chips */}
                                {facilities.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {facilities.map((fac) => (
                                            <span
                                                key={fac}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/60 bg-yellow-100/60 px-3 py-1 text-xs font-medium text-yellow-900 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-300"
                                            >
                                                {fac}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFacility(fac)}
                                                    disabled={submitting}
                                                    aria-label={`Remove ${fac}`}
                                                    className="rounded-full p-0.5 hover:bg-yellow-200 dark:hover:bg-yellow-900/60"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>



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
                                    disabled={submitting || !isApproved}
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


            {/* View Tenant Details Modal */}
            {tenantDetailsOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
                    onClick={closeTenantDetails}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tenant-details-title"
                        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xs border border-gray-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-gray-100 p-5 dark:border-stone-800 sm:p-7">
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
                                className="rounded-sm p-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black dark:text-gray-400 dark:hover:bg-yellow-300 dark:hover:text-black"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
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
                                        ["Email", tenantDetails.email],
                                        ["Phone", tenantDetails.phone],
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
                        className="w-full max-w-md rounded-xs border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-700 dark:bg-[#1b1b1b]"
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
                                className="rounded-sm p-1 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-stone-800"
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

            <AddTenantModal
                isOpen={addTenantModal.open}
                onClose={() => setAddTenantModal({ open: false, propertyId: null, unitId: null })}
                onSuccess={async () => {
                    if (selectedProperty?._id) {
                        await getUnits(selectedProperty._id);
                    }
                }}
                initialPropertyId={addTenantModal.propertyId}
                initialUnitId={addTenantModal.unitId}
            />
        </div>
    );
};

export default Property;