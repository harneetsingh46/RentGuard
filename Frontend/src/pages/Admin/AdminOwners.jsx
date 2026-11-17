
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    Search,
    RefreshCw,
    Users
} from "lucide-react";
import apiClient from "../../ApiClient/interceptor";

const AdminOwners = () => {
    const [owners, setOwners] = useState([]);
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);

    const [selectedOwner, setSelectedOwner] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [historyOwner, setHistoryOwner] = useState(null);
    const [reviewHistory, setReviewHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(0);
    const [historyTotal, setHistoryTotal] = useState(0);

    // FETCH OWNERS
    const fetchOwners = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit,
                search: search.trim(),
            };

            if (status !== "all") {
                params.status = status;
            }

            const response = await apiClient.get("/admin/owners", {
                params,
            });

            const pagination = response.data.pagination;
            const nextTotalPages = pagination?.totalPages || 0;

            // Handle deleted or removed records on the current page
            if (nextTotalPages === 0 && page !== 1) {
                setPage(1);
                return;
            }

            if (nextTotalPages > 0 && page > nextTotalPages) {
                setPage(nextTotalPages);
                return;
            }

            setOwners(response.data.data || []);
            setTotal(pagination?.total || 0);
            setTotalPages(nextTotalPages);
        } catch (error) {
            console.error("Fetch owners error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to fetch owners. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, status]);

    useEffect(() => {
        fetchOwners();
    }, [fetchOwners]);

    const filteredOwners = owners;

    // FORMAT DATE
    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // FORMAT DATE AND TIME
    const formatDateTime = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // STATUS STYLE
    const statusStyle = (value) => {
        switch (value) {
            case "approved":
                return "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400";

            case "rejected":
                return "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400";

            default:
                return "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400";
        }
    };

    // APPROVE OWNER
    const handleApprove = async (owner) => {
        const confirmed = window.confirm(
            `Are you sure you want to approve ${owner.username || "this owner"}?`
        );

        if (!confirmed) return;

        try {
            setProcessingId(owner._id);

            const response = await apiClient.patch(
                `/admin/owners/${owner._id}/review`,
                { status: "approved" }
            );

            toast.success(
                response.data.message || "Owner approved successfully."
            );

            await fetchOwners();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to approve owner."
            );
        } finally {
            setProcessingId(null);
        }
    };

    // OPEN REJECTION DIALOG
    const openRejectDialog = (owner) => {
        setSelectedOwner(owner);
        setRejectionReason("");
        setRejecting(false);
    };

    // CLOSE REJECTION DIALOG
    const closeRejectDialog = () => {
        if (rejecting) return;

        setSelectedOwner(null);
        setRejectionReason("");
    };

    // REJECT OWNER
    const handleReject = async (event) => {
        event.preventDefault();

        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason.");
            return;
        }

        try {
            setRejecting(true);
            setProcessingId(selectedOwner._id);

            const response = await apiClient.patch(
                `/admin/owners/${selectedOwner._id}/review`,
                {
                    status: "rejected",
                    reason: rejectionReason.trim(),
                }
            );

            toast.success(
                response.data.message || "Owner rejected successfully."
            );

            setSelectedOwner(null);
            setRejectionReason("");

            await fetchOwners();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to reject owner."
            );
        } finally {
            setRejecting(false);
            setProcessingId(null);
        }
    };

    // FETCH OWNER VERIFICATION HISTORY
    const fetchOwnerHistory = async (owner, page = 1) => {
        try {
            setHistoryLoading(true);
            setHistoryError("");

            const response = await apiClient.get(
                `/admin/owners/${owner._id}/verification-history`,
                {
                    params: {
                        page,
                        limit: 5,
                    },
                }
            );

            const result = response.data.data;

            setReviewHistory(result.history || []);
            setHistoryPage(result.pagination?.page || 1);
            setHistoryTotalPages(result.pagination?.totalPages || 0);
            setHistoryTotal(result.pagination?.total || 0);
        } catch (error) {
            console.error("Fetch owner history error:", error);

            setHistoryError(
                error.response?.data?.message ||
                "Unable to fetch verification history."
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    // OPEN HISTORY MODAL
    const openHistory = (owner) => {
        setHistoryOwner(owner);
        setReviewHistory([]);
        setHistoryPage(1);
        setHistoryTotalPages(0);
        setHistoryTotal(0);

        fetchOwnerHistory(owner, 1);
    };

    // CLOSE HISTORY MODAL
    const closeHistory = () => {
        if (historyLoading) return;

        setHistoryOwner(null);
        setReviewHistory([]);
        setHistoryError("");
    };
    // FILTERS
    const filters = [
        { label: "All Owners", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
    ];

    // REVIEW DETAILS
    const ReviewDetails = ({ owner }) => {
        const reviewer = owner.verificationReviewedBy;

        if (!owner.verificationReviewedAt) {
            return (
                <p className="text-xs text-gray-400">
                    Not reviewed yet
                </p>
            );
        }

        return (
            <div className="space-y-1.5">
                <div>
                    <p className="text-sm font-medium">
                        {reviewer?.name || "Admin"}
                    </p>

                    {reviewer?.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {reviewer.email}
                        </p>
                    )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(owner.verificationReviewedAt)}
                </p>

                {owner.verificationStatus === "rejected" &&
                    owner.verificationRejectionReason && (
                        <div className="mt-2 max-w-xs border-l-2 border-red-400 pl-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                                Rejection reason
                            </p>

                            <p className="mt-1 whitespace-normal break-words text-xs text-gray-600 dark:text-gray-300">
                                {owner.verificationRejectionReason}
                            </p>
                        </div>
                    )}
            </div>
        );
    };

    return (
        <div className="min-h-full w-full bg-[#f2f2f1] px-4 py-6 text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 sm:py-8 lg:px-10">

            {/* HEADER */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                        Owner Verification
                    </h1>

                    <p className="mt-2 text-sm text-gray-500 dark:text-[#A5A5A5]">
                        Review owner registrations and manage verification requests.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchOwners}
                    disabled={loading}
                    className="inline-flex w-fit items-center gap-2 border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-stone-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </section>

            {/* FILTER TABS */}
            <section className="mt-8">
                <div className="flex gap-2 overflow-x-auto border-b border-stone-300 dark:border-neutral-800">
                    {filters.map((filter) => {
                        const active = status === filter.value;

                        return (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => {
                                    setStatus(filter.value);
                                    setPage(1);
                                }}
                                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition sm:px-5 ${active
                                    ? "border-yellow-400 font-semibold text-black dark:text-white"
                                    : "border-transparent text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                                    }`}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* SEARCH AND COUNTS */}
            <section className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-sm">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="search"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Search name, email or phone..."
                        className="w-full border border-stone-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 dark:border-neutral-700 dark:bg-neutral-950"
                    />
                </div>

                <p className="text-sm text-gray-500 dark:text-[#A5A5A5]">
                    Showing{" "}
                    <span className="font-semibold text-black dark:text-white">
                        {total}
                    </span>{" "}
                    {total === 1 ? "owner" : "owners"}
                </p>
            </section>

            {/* ERROR */}
            {error && (
                <div
                    role="alert"
                    className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={fetchOwners}
                        className="font-semibold underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* LOADING */}
            {loading && (
                <div className="mt-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-24 animate-pulse border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                        />
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && filteredOwners.length === 0 && (
                <div className="mt-8 border border-stone-200 bg-white px-5 py-16 text-center dark:border-neutral-800 dark:bg-neutral-950">
                    <Users
                        size={35}
                        className="mx-auto text-gray-400"
                    />

                    <h3 className="mt-4 text-lg font-medium">
                        No owners found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500 dark:text-[#A5A5A5]">
                        {search
                            ? "Try changing your search."
                            : "There are no owners in this category yet."}
                    </p>
                </div>
            )}

            {/* OWNER TABLE */}
            {!loading && !error && filteredOwners.length > 0 && (
                <section className="mt-6 overflow-hidden border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">

                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-stone-200 bg-[#f7f5f0] text-xs uppercase tracking-wider text-gray-500 dark:border-neutral-800 dark:bg-[#1b1b1b] dark:text-gray-400">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Owner</th>
                                    <th className="px-5 py-4 font-medium">Contact</th>
                                    <th className="px-5 py-4 font-medium">Registered</th>
                                    <th className="px-5 py-4 font-medium">Status</th>
                                    <th className="px-5 py-4 font-medium">Review Details</th>
                                    <th className="px-5 py-4 text-right font-medium">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOwners.map((owner) => (
                                    <tr
                                        key={owner._id}
                                        className="border-b border-stone-100 last:border-0 dark:border-neutral-800"
                                    >
                                        <td className="px-5 py-5">
                                            <p className="font-medium">
                                                {owner.username || "Unnamed owner"}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                ID: {owner._id}
                                            </p>
                                        </td>

                                        <td className="px-5 py-5">
                                            <p>{owner.email || "—"}</p>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {owner.phone || "No phone"}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-5 text-gray-500 dark:text-gray-400">
                                            {formatDate(owner.createdAt)}
                                        </td>

                                        <td className="px-5 py-5">
                                            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium capitalize ${statusStyle(owner.verificationStatus)}`}>
                                                {owner.verificationStatus || "pending"}
                                            </span>
                                        </td>

                                        <td className="min-w-[210px] px-5 py-5">
                                            <ReviewDetails owner={owner} />
                                        </td>

                                        <td className="px-5 py-5">
                                            <div className="flex justify-end gap-2">
                                                {owner.verificationStatus !== "approved" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(owner)}
                                                        disabled={processingId === owner._id}
                                                        className="border border-green-200 px-3 py-2 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-400/10"
                                                    >
                                                        Approve
                                                    </button>
                                                )}

                                                {owner.verificationStatus !== "rejected" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRejectDialog(owner)}
                                                        disabled={processingId === owner._id}
                                                        className="border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-400/10"
                                                    >
                                                        Reject
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => openHistory(owner)}
                                                    className="border border-stone-300 px-3 py-2 text-xs font-medium transition hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                                >
                                                    View History
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="divide-y divide-stone-200 md:hidden dark:divide-neutral-800">
                        {filteredOwners.map((owner) => (
                            <article key={owner._id} className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate font-medium">
                                                {owner.username || "Unnamed owner"}
                                            </h3>

                                            <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                                                {owner.email || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusStyle(owner.verificationStatus)}`}>
                                        {owner.verificationStatus || "pending"}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-gray-500 dark:text-gray-400 min-[400px]:grid-cols-2">
                                    <p>
                                        {owner.phone || "No phone"}
                                    </p>

                                    <p>
                                        Joined {formatDate(owner.createdAt)}
                                    </p>
                                </div>

                                {/* REVIEW DETAILS */}
                                <div className="mt-4 border-t border-stone-200 pt-4 dark:border-neutral-800">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Review Details
                                    </p>

                                    <ReviewDetails owner={owner} />
                                </div>

                                <div className="mt-4 flex gap-2">
                                    {owner.verificationStatus !== "approved" && (
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(owner)}
                                            disabled={processingId === owner._id}
                                            className="flex-1 border border-green-200 px-3 py-2.5 text-xs font-medium text-green-700 disabled:opacity-50 dark:border-green-900 dark:text-green-400"
                                        >
                                            Approve
                                        </button>
                                    )}

                                    {owner.verificationStatus !== "rejected" && (
                                        <button
                                            type="button"
                                            onClick={() => openRejectDialog(owner)}
                                            disabled={processingId === owner._id}
                                            className="flex-1 border border-red-200 px-3 py-2.5 text-xs font-medium text-red-600 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
                                        >
                                            Reject
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => openHistory(owner)}
                                        className="flex-1 border border-stone-300 px-3 py-2.5 text-xs font-medium transition hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                    >
                                        View History
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* PAGINATION */}
            {!loading && !error && total > 0 && (
                <section className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-sm text-gray-500 dark:text-[#A5A5A5]">
                        Showing{" "}
                        <span className="font-medium text-black dark:text-white">
                            {(page - 1) * limit + 1}
                        </span>
                        {" "}to{" "}
                        <span className="font-medium text-black dark:text-white">
                            {Math.min(page * limit, total)}
                        </span>
                        {" "}of{" "}
                        <span className="font-medium text-black dark:text-white">
                            {total}
                        </span>
                        {" "}owners
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1 || loading}
                            className="border border-stone-300 bg-white px-4 py-2 text-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-800"
                        >
                            Previous
                        </button>

                        <span className="px-3 text-sm text-gray-600 dark:text-gray-300">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page >= totalPages || loading}
                            className="border border-stone-300 bg-white px-4 py-2 text-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-800"
                        >
                            Next
                        </button>
                    </div>
                </section>
            )}

            {/* REJECTION DIALOG */}
            {selectedOwner && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeRejectDialog();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reject-owner-title"
                        className="w-full max-w-md border border-stone-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-[#1b1b1b] sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2
                                    id="reject-owner-title"
                                    className="text-xl font-medium"
                                >
                                    Reject Owner
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {selectedOwner.username}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeRejectDialog}
                                disabled={rejecting}
                                aria-label="Close dialog"
                                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-neutral-800"
                            >
                                <span className="text-xl leading-none">×</span>
                            </button>
                        </div>

                        <form onSubmit={handleReject}>
                            <label
                                htmlFor="rejection-reason"
                                className="mb-2 mt-6 block text-sm font-medium"
                            >
                                Reason for rejection
                            </label>

                            <textarea
                                id="rejection-reason"
                                rows={4}
                                maxLength={1000}
                                required
                                value={rejectionReason}
                                onChange={(event) =>
                                    setRejectionReason(event.target.value)
                                }
                                placeholder="Explain why this owner's verification is being rejected..."
                                className="w-full resize-y border border-stone-300 bg-white p-3 text-sm outline-none transition focus:border-yellow-400 dark:border-neutral-700 dark:bg-neutral-950"
                            />

                            <p className="mt-1 text-right text-xs text-gray-400">
                                {rejectionReason.length}/1000
                            </p>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeRejectDialog}
                                    disabled={rejecting}
                                    className="border border-stone-300 px-5 py-2.5 text-sm font-medium hover:bg-stone-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={rejecting || !rejectionReason.trim()}
                                    className="bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {rejecting ? "Rejecting..." : "Confirm Rejection"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* OWNER VERIFICATION HISTORY MODAL */}
            {historyOwner && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeHistory();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="history-modal-title"
                        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-stone-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-[#1b1b1b] sm:p-6"
                    >
                        {/* HEADER */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2
                                    id="history-modal-title"
                                    className="text-xl font-medium"
                                >
                                    Verification History
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {historyOwner.username}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    {historyTotal} review records
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeHistory}
                                disabled={historyLoading}
                                aria-label="Close history"
                                className="rounded-lg p-2 text-xl leading-none hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-neutral-800"
                            >
                                ×
                            </button>
                        </div>

                        {/* LOADING */}
                        {historyLoading && (
                            <div className="mt-6 space-y-3">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-24 animate-pulse border border-stone-200 bg-stone-50 dark:border-neutral-700 dark:bg-neutral-900"
                                    />
                                ))}
                            </div>
                        )}

                        {/* ERROR */}
                        {!historyLoading && historyError && (
                            <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                <p>{historyError}</p>

                                <button
                                    type="button"
                                    onClick={() => fetchOwnerHistory(historyOwner, historyPage)}
                                    className="mt-2 font-semibold underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* EMPTY HISTORY */}
                        {!historyLoading &&
                            !historyError &&
                            reviewHistory.length === 0 && (
                                <div className="mt-8 border border-stone-200 px-4 py-10 text-center dark:border-neutral-700">
                                    <p className="font-medium">
                                        No review history yet
                                    </p>

                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        This owner has not been reviewed yet.
                                    </p>
                                </div>
                            )}

                        {/* HISTORY RECORDS */}
                        {!historyLoading &&
                            !historyError &&
                            reviewHistory.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    {reviewHistory.map((record) => (
                                        <article
                                            key={record._id}
                                            className="border border-stone-200 p-4 dark:border-neutral-700"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium capitalize ${statusStyle(record.status)}`}
                                                >
                                                    {record.status}
                                                </span>

                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDateTime(record.reviewedAt)}
                                                </span>
                                            </div>

                                            <div className="mt-4">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Reviewed by
                                                </p>

                                                <p className="mt-1 text-sm font-medium">
                                                    {record.reviewedBy?.name || "Admin"}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {record.reviewedBy?.email || "Email unavailable"}
                                                </p>
                                            </div>

                                            {record.status === "rejected" &&
                                                record.rejectionReason && (
                                                    <div className="mt-4 border-l-2 border-red-400 pl-3">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                                                            Rejection Reason
                                                        </p>

                                                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-300">
                                                            {record.rejectionReason}
                                                        </p>
                                                    </div>
                                                )}
                                        </article>
                                    ))}
                                </div>
                            )}

                        {/* PAGINATION */}
                        {!historyLoading &&
                            !historyError &&
                            historyTotalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-neutral-700">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fetchOwnerHistory(historyOwner, historyPage - 1)
                                        }
                                        disabled={historyPage <= 1}
                                        className="border border-stone-300 px-4 py-2 text-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Page {historyPage} of {historyTotalPages}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fetchOwnerHistory(historyOwner, historyPage + 1)
                                        }
                                        disabled={historyPage >= historyTotalPages}
                                        className="border border-stone-300 px-4 py-2 text-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                        {/* FOOTER */}
                        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={closeHistory}
                                disabled={historyLoading}
                                className="border border-stone-300 px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* FOOTER */}
            <footer className="mt-10 border-t border-stone-200 py-5 text-xs text-stone-500 dark:border-neutral-800 dark:text-[#A5A5A5]">
                RentGuard · Owner Verification
            </footer>
        </div>
    );
};

export default AdminOwners;
