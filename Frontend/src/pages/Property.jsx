
import React, { useEffect, useState } from "react";
import apiClient from "../ApiClient/interceptor";

const emptyProperty = {
    propertyName: "",
    address: "",
};

const Property = () => {
    const [active, setActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [property, setProperty] = useState(emptyProperty);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Fetch all properties
    const getProperties = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiClient.get("/property/");
            const data = response.data.data || [];

            setProperties(data);

            // Keep the selected property if it still exists
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

    // Update form values when typing
    const handleChange = (e) => {


        setProperty((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    // Open the modal to add a new property
    const openAddForm = () => {
        setProperty({ ...emptyProperty });
        setIsEditing(false);
        setError("");
        setActive(true);
    };

    // Open the modal with the selected property's existing values
    const openEditForm = (item) => {
        setProperty({
            propertyName: item.propertyName,
            address: item.address,
        });

        setSelectedProperty(item);
        setIsEditing(true);
        setError("");
        setActive(true);
    };

    // Close the modal
    const closeForm = () => {
        if (submitting) return;

        setActive(false);
        setProperty({ ...emptyProperty });
        setError("");
    };

    // Save a new property or update an existing one
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

            if (isEditing && selectedProperty) {
                await apiClient.put(
                    `/property/${selectedProperty._id}`,
                    formData
                );
            } else {
                await apiClient.post("/property/", formData);
            }

            setActive(false);
            setProperty({ ...emptyProperty });

            await getProperties();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                `Failed to ${isEditing ? "update" : "add"} property.`
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Delete a property
    const handleDelete = async (propertyId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this property?"
        );

        if (!confirmed) return;

        try {
            setError("");

            await apiClient.delete(`/property/${propertyId}`);

            if (selectedProperty?._id === propertyId) {
                setSelectedProperty(null);
            }

            await getProperties();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete property."
            );
        }
    };

    // Select a property card
    const selectProperty = (item) => {
        setSelectedProperty(item);
    };

    //Deselect a property card
    const deselectProperty = (item) => {
        setSelectedProperty(null);
    };

    return (
        <div className="min-h-full w-full bg-[#faf9f6] p-4 transition-colors duration-300 dark:bg-[#111111] md:p-8">

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
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
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
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div>
                                            {isSelected && (
                                                <span className="rounded-xs bg-yellow-300 px-2 py-1 text-xs font-medium text-black">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="break-words text-lg font-semibold text-gray-900 dark:text-white">
                                        {item.propertyName}
                                    </h3>

                                    <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-400">
                                        {item.address}
                                    </p>

                                    {/* Edit and Delete */}
                                    <div className="mt-4 flex">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditForm(item);
                                            }}
                                            className="mx-0 my-1 rounded-xs bg-yellow-300 p-1 text-black shadow hover:bg-yellow-400"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item._id);
                                            }}
                                            className="mx-1 my-1 rounded-xs bg-yellow-300 p-1 text-black shadow hover:bg-yellow-400"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Selected Property and Add Unit */}
                {selectedProperty && (
                    <div className="mt-6 flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center dark:border-stone-800">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {selectedProperty.propertyName}
                            </h2>

                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {selectedProperty.address}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={deselectProperty}
                                className="rounded-xs border border-yellow-400 px-5 py-3 font-medium text-black transition hover:bg-gray-100 dark:border-yellow-300 dark:text-white dark:hover:bg-stone-800"
                            >
                                Deselect Property
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    console.log(
                                        "Selected property ID:",
                                        selectedProperty._id
                                    );
                                }}
                                className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black transition hover:bg-yellow-400"
                            >
                                + Add Unit
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Property Modal */}
            {active && (
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
                                    {isEditing
                                        ? "Edit Property"
                                        : "Add New Property"}
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
                                    className="rounded-xs bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 "
                                >
                                    {submitting
                                        ? "Saving..."
                                        : isEditing
                                            ? "Update Property"
                                            : "Save Property"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Property;
