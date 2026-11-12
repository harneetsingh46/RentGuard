
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";

const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const PRIORITIES = ["Low", "Medium", "High"];

const OwnerMaintenance = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [activeTab, setActiveTab] = useState("active");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const [saving, setSaving] = useState(false);
    const [editStatus, setEditStatus] = useState("Pending");
    const [ownerNotes, setOwnerNotes] = useState("");

    const fetchComplaints = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiClient.get(
                "/maintenance/owner-complaints"
            );

            const data = response.data?.data;
            setComplaints(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load maintenance complaints."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const filteredComplaints = useMemo(() => {
        return complaints.filter((complaint) => {
            // Resolved complaints are shown only in the Resolved Requests tab.
            const matchesTab =
                activeTab === "resolved"
                    ? complaint.status === "Resolved"
                    : complaint.status !== "Resolved";

            const matchesStatus =
                statusFilter === "All" ||
                complaint.status === statusFilter;

            const matchesPriority =
                priorityFilter === "All" ||
                complaint.priority === priorityFilter;

            const searchText = search.toLowerCase();

            const matchesSearch =
                !searchText ||
                complaint.title?.toLowerCase().includes(searchText) ||
                complaint.tenant?.fullName?.toLowerCase().includes(searchText) ||
                complaint.property?.propertyName?.toLowerCase().includes(searchText) ||
                complaint.unit?.unitName?.toLowerCase().includes(searchText) ||
                complaint.category?.toLowerCase().includes(searchText);

            return matchesTab && matchesStatus && matchesPriority && matchesSearch;
        });
    }, [complaints, activeTab, statusFilter, priorityFilter, search]);

    const counts = {
        total: complaints.length,
        pending: complaints.filter((c) => c.status === "Pending").length,
        inProgress: complaints.filter((c) => c.status === "In Progress").length,
        resolved: complaints.filter((c) => c.status === "Resolved").length,
        rejected: complaints.filter((c) => c.status === "Rejected").length,
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const statusStyle = (status) => {
        const styles = {
            Pending:
                "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
            "In Progress":
                "bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300",
            Resolved:
                "bg-green-100 text-green-800 dark:bg-green-400/10 dark:text-green-300",
            Rejected:
                "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300",
        };

        return styles[status] || "bg-neutral-100 text-neutral-700";
    };

    const priorityStyle = (priority) => {
        const styles = {
            Low: "text-green-600 dark:text-green-400",
            Medium: "text-amber-600 dark:text-amber-400",
            High: "text-red-600 dark:text-red-400",
        };

        return styles[priority] || "text-neutral-500";
    };

    const openComplaint = (complaint) => {
        setSelectedComplaint(complaint);
        setEditStatus(complaint.status);
        setOwnerNotes(complaint.ownerNotes || "");
        setError("");
        setSuccess("");
    };

    const updateComplaint = async (event) => {
        event.preventDefault();

        if (!selectedComplaint) return;

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await apiClient.patch(
                `/maintenance/complaint/${selectedComplaint._id}/status`,
                {
                    status: editStatus,
                    ownerNotes,
                }
            );

            const updatedComplaint = response.data?.data;

            setComplaints((previous) =>
                previous.map((complaint) =>
                    complaint._id === selectedComplaint._id
                        ? {
                            ...complaint,
                            ...(updatedComplaint || {}),
                            status: editStatus,
                            ownerNotes,
                        }
                        : complaint
                )
            );

            // Close modal after successful update
            setSelectedComplaint(null);
            setSuccess("Complaint updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update complaint."
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full min-w-0 rounded-xs border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#f9c83d] dark:border-neutral-700 dark:bg-[#101010]";

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f2f1] px-3 py-5 text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">

                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">

                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                            Maintenance Complaints
                        </h1>

                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage tenant complaints and track maintenance progress.
                        </p>
                    </div>

                    <Link
                        to="/owner/dashboard"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xs border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#171717] dark:hover:bg-neutral-800 sm:w-fit"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Feedback */}
                {error && (
                    <div className="mb-5 break-words rounded-xs border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 break-words rounded-xs border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                        {success}
                    </div>
                )}

                {/* Summary */}
                <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
                    {[
                        ["Total Complaints", counts.total],
                        ["Pending", counts.pending],
                        ["In Progress", counts.inProgress],
                        ["Resolved", counts.resolved],
                        ["Rejected", counts.rejected],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="min-w-0 rounded-xs border border-neutral-200 bg-white p-3 sm:p-5 dark:border-neutral-800 dark:bg-[#171717]"
                        >
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                                {label}
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl">
                                {value}
                            </h2>
                        </div>
                    ))}
                </section>

                {/* Filters */}
                <section className="mb-6 rounded-xs border border-neutral-200 bg-white p-3 sm:p-5 dark:border-neutral-800 dark:bg-[#171717]">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search tenant, complaint, property..."
                            className={inputClass}
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className={inputClass}
                        >
                            <option value="All">All Statuses</option>
                            {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(event) => setPriorityFilter(event.target.value)}
                            className={inputClass}
                        >
                            <option value="All">All Priorities</option>
                            {PRIORITIES.map((priority) => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Complaints */}
                <section className="overflow-hidden rounded-xs border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#171717]">
                    {/* Request navigation */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 pt-4 dark:border-neutral-800 sm:px-6 sm:pt-5">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("active");
                                setStatusFilter("All");
                            }}
                            className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                                activeTab === "active"
                                    ? "border-[#f9c83d] text-neutral-900 dark:text-white"
                                    : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            }`}
                        >
                            Active Requests ({complaints.filter((c) => c.status !== "Resolved").length})
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("resolved");
                                setStatusFilter("All");
                            }}
                            className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                                activeTab === "resolved"
                                    ? "border-[#f9c83d] text-neutral-900 dark:text-white"
                                    : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            }`}
                        >
                            Resolved Requests ({counts.resolved})
                        </button>
                    </div>

                    <div className="flex flex-col justify-between gap-3 border-b border-neutral-100 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:p-6">
                        <div>
                            <h2 className="text-lg font-semibold sm:text-xl">
                                {activeTab === "resolved" ? "Resolved Requests" : "Active Requests"}
                            </h2>

                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                {filteredComplaints.length} request(s) found
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={fetchComplaints}
                            disabled={loading}
                            className="w-full rounded-xs border border-neutral-200 px-4 py-2.5 text-sm transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800 sm:w-fit"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-sm text-neutral-500 sm:p-12">
                            Loading complaints...
                        </div>
                    ) : filteredComplaints.length === 0 ? (
                        <div className="p-8 text-center sm:p-12">
                            <h3 className="font-semibold">
                                {activeTab === "resolved"
                                    ? "No resolved requests yet"
                                    : "No active requests found"}
                            </h3>

                            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                {activeTab === "resolved"
                                    ? "Complaints will appear here once you mark them as resolved."
                                    : "New and ongoing tenant maintenance complaints will appear here."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredComplaints.map((complaint) => (
                                <article
                                    key={complaint._id}
                                    className="min-w-0 p-4 transition hover:bg-neutral-50 dark:hover:bg-[#1d1d1d] sm:p-6"
                                >
                                    <div className="flex min-w-0 flex-col justify-between gap-5 lg:flex-row">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="break-words text-base font-semibold sm:text-lg">
                                                    {complaint.title}
                                                </h3>

                                                <span className={`shrink-0 rounded-xs px-3 py-1 text-xs font-medium ${statusStyle(complaint.status)}`}>
                                                    {complaint.status}
                                                </span>
                                            </div>

                                            <p className="mt-2 break-words text-sm text-neutral-500 dark:text-neutral-400">
                                                {complaint.category} · Submitted {formatDate(complaint.createdAt)}
                                            </p>

                                            <p className="mt-4 break-words text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                                                {complaint.description}
                                            </p>

                                            {/* Tenant / Property / Priority */}
                                            <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs text-neutral-400">
                                                        Tenant
                                                    </p>

                                                    <p className="mt-1 break-words font-medium">
                                                        {complaint.tenant?.fullName || "Unknown tenant"}
                                                    </p>

                                                    <p className="break-all text-xs text-neutral-500">
                                                        {complaint.tenant?.email || ""}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-xs text-neutral-400">
                                                        Property / Unit
                                                    </p>

                                                    <p className="mt-1 break-words font-medium">
                                                        {complaint.property?.propertyName || "Unknown property"}
                                                    </p>

                                                    <p className="break-words text-xs text-neutral-500">
                                                        {complaint.unit?.unitName || "Unknown unit"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-xs text-neutral-400">
                                                        Priority
                                                    </p>

                                                    <p className={`mt-1 font-semibold ${priorityStyle(complaint.priority)}`}>
                                                        {complaint.priority}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Attached Image */}
                                            {complaint.imageUrl && (
                                                <a
                                                    href={complaint.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-4 inline-flex max-w-full items-center gap-2 break-all rounded-xs underline text-sm font-semibold text-gray-800 no-underline transition-colors hover:text-black hover:underline hover:underline-offset-4 dark:text-yellow-300 dark:hover:text-yellow-500"
                                                >
                                                    View attached image 
                                                </a>
                                            )}

                                            {/* Owner Remarks */}
                                            {complaint.ownerNotes && (
                                                <div className="mt-4 rounded-xs w-full bg-neutral-100 p-3 dark:bg-neutral-800">
                                                    <p className="text-xs font-semibold text-neutral-500">
                                                        Owner remarks
                                                    </p>

                                                    <p className="mt-1 break-words text-sm">
                                                        {complaint.ownerNotes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Manage Button */}
                                            <div className="flex w-full mt-2 shrink-0 items-start lg:w-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => openComplaint(complaint)}
                                                    className="w-full rounded-xs bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] lg:w-auto"
                                                >
                                                    Manage Complaint →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Manage Complaint Modal */}
                {selectedComplaint && (
                    <div
                        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:items-center sm:p-5"
                        onClick={(event) => {
                            if (event.target === event.currentTarget && !saving) {
                                setSelectedComplaint(null);
                            }
                        }}
                    >
                        <div className="my-auto max-h-[calc(100dvh-24px)] w-full max-w-xl overflow-y-auto rounded-xs border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-[#171717] sm:max-h-[90vh] sm:p-7">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                                        Manage Complaint
                                    </p>

                                    <h2 className="mt-2 break-words text-lg font-semibold sm:text-xl">
                                        {selectedComplaint.title}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => !saving && setSelectedComplaint(null)}
                                    disabled={saving}
                                    className="shrink-0 text-2xl text-neutral-500 hover:text-black disabled:opacity-50 dark:hover:text-white"
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={updateComplaint} className="mt-6 space-y-5">
                                <div>
                                    <label className="text-sm font-medium">
                                        Complaint Status
                                    </label>

                                    <select
                                        value={editStatus}
                                        onChange={(event) => setEditStatus(event.target.value)}
                                        className={`${inputClass} mt-2`}
                                    >
                                        {STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Owner Remarks
                                    </label>

                                    <textarea
                                        value={ownerNotes}
                                        onChange={(event) => setOwnerNotes(event.target.value)}
                                        rows={4}
                                        maxLength={2000}
                                        placeholder="Add an update for the tenant..."
                                        className={`${inputClass} mt-2 resize-y`}
                                    />

                                    <p className="mt-1 text-right text-xs text-neutral-400">
                                        {ownerNotes.length}/2000
                                    </p>
                                </div>

                                <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-800 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedComplaint(null)}
                                        disabled={saving}
                                        className="w-full rounded-xs border border-neutral-200 px-5 py-3 text-sm font-medium disabled:opacity-50 dark:border-neutral-700 sm:w-auto"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full rounded-xs bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    RentGuard Owner Portal · Maintenance
                </footer>
            </div>
        </div>
    );
};

export default OwnerMaintenance;
