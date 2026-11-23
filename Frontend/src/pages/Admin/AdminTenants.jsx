
import { useCallback, useEffect, useState } from "react";
import {
    Users,
    Search,
    RefreshCw,
    UserRound
} from "lucide-react";
import apiClient from "../../ApiClient/interceptor";

const AdminTenants = () => {
    const [tenants, setTenants] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Global summary counts
    const [summary, setSummary] = useState({
        totalTenants: 0,
        activeTenants: 0,
        inactiveTenants: 0,
        verifiedTenants: 0,
    });

    // FETCH TENANTS
    const fetchTenants = useCallback(async () => {
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

            const response = await apiClient.get("/admin/tenants", {
                params,
            });

            const pagination = response.data.pagination;
            const nextTotalPages = pagination?.totalPages || 0;

            // Handle a page that no longer exists
            if (nextTotalPages === 0 && page !== 1) {
                setPage(1);
                return;
            }

            if (nextTotalPages > 0 && page > nextTotalPages) {
                setPage(nextTotalPages);
                return;
            }

            setTenants(response.data.data || []);
            setTotal(pagination?.total || 0);
            setTotalPages(nextTotalPages);

            setSummary({
                totalTenants:
                    response.data.summary?.totalTenants || 0,
                activeTenants:
                    response.data.summary?.activeTenants || 0,
                inactiveTenants:
                    response.data.summary?.inactiveTenants || 0,
                verifiedTenants:
                    response.data.summary?.verifiedTenants || 0,
            });
        } catch (error) {
            console.error("Fetch tenants error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to fetch tenants. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, status]);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    // FORMAT DATE
    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // ACCOUNT STATUS STYLE
    const accountStatus = (isActive) =>
        isActive
            ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400";

    // VERIFICATION STATUS STYLE
    const verificationStatus = (isVerified) =>
        isVerified
            ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400";

    // SUMMARY CARDS
    const summaryCards = [
        {
            title: "Total Tenants",
            value: summary.totalTenants,
            description: "All registered tenant accounts",
        },
        {
            title: "Active Tenants",
            value: summary.activeTenants,
            description: "Currently active accounts",
        },
        {
            title: "Inactive Tenants",
            value: summary.inactiveTenants,
            description: "Deactivated accounts",
        },
        {
            title: "Contact Verified",
            value: summary.verifiedTenants,
            description: "Tenants with verified contact details",
        },
    ];

    return (
        <div className="min-h-full w-full bg-[#f2f2f1] px-4 py-6 text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 sm:py-8 lg:px-10">

            {/* HEADER */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                        Tenant Management
                    </h1>

                    <p className="mt-2 text-sm text-gray-500 dark:text-[#A5A5A5]">
                        View and monitor registered tenant accounts.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchTenants}
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

            {/* SUMMARY CARDS */}
            <section className="mt-8 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card, index) => {
                    const colors = [
                        "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400",
                        "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400",
                        "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400",
                        "bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400",
                    ];

                    return (
                        <div
                            key={card.title}
                            className="border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-[#A5A5A5]">
                                        {card.title}
                                    </p>

                                    <p className="mt-3 text-3xl font-medium tracking-tight">
                                        {card.value.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-gray-500 dark:text-[#A5A5A5]">
                                {card.description}
                            </p>
                        </div>
                    );
                })}
            </section>

            {/* SEARCH AND FILTERS */}
            <section className="mt-9">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-medium tracking-tight">
                            Registered Tenants
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-[#A5A5A5]">
                            Search and view tenant account information.
                        </p>
                    </div>

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
                </div>

                {/* STATUS FILTERS */}
                <div className="mt-5 flex gap-2 overflow-x-auto">
                    {[
                        { label: "All Tenants", value: "all" },
                        { label: "Active", value: "active" },
                        { label: "Inactive", value: "inactive" },
                    ].map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => {
                                setStatus(filter.value);
                                setPage(1);
                            }}
                            className={`shrink-0 border px-4 py-2 text-sm transition ${
                                status === filter.value
                                    ? "border-yellow-400 bg-yellow-300 font-medium text-black"
                                    : "border-stone-300 bg-white text-gray-600 hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-300 dark:hover:bg-neutral-800"
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* RESULTS COUNT */}
            {!loading && !error && (
                <p className="mt-5 text-sm text-gray-500 dark:text-[#A5A5A5]">
                    {total.toLocaleString("en-IN")}{" "}
                    {total === 1 ? "tenant" : "tenants"} found
                </p>
            )}

            {/* ERROR */}
            {error && (
                <div
                    role="alert"
                    className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={fetchTenants}
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
            {!loading && !error && tenants.length === 0 && (
                <div className="mt-6 border border-stone-200 bg-white px-5 py-16 text-center dark:border-neutral-800 dark:bg-neutral-950">
                    <Users
                        size={35}
                        className="mx-auto text-gray-400"
                    />

                    <h3 className="mt-4 text-lg font-medium">
                        No tenants found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500 dark:text-[#A5A5A5]">
                        {search
                            ? "Try changing your search."
                            : status !== "all"
                                ? `There are no ${status} tenants.`
                                : "There are no registered tenants yet."}
                    </p>
                </div>
            )}

            {/* TENANT TABLE */}
            {!loading && !error && tenants.length > 0 && (
                <section className="mt-6 overflow-hidden border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">

                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-stone-200 bg-[#f7f5f0] text-xs uppercase tracking-wider text-gray-500 dark:border-neutral-800 dark:bg-[#1b1b1b] dark:text-gray-400">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Tenant
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Contact
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Registered
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Verification
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Account Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {tenants.map((tenant) => (
                                    <tr
                                        key={tenant._id}
                                        className="border-b border-stone-100 last:border-0 dark:border-neutral-800"
                                    >
                                        <td className="px-5 py-5">
                                            <p className="font-medium">
                                                {tenant.fullName || "Unnamed tenant"}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                ID: {tenant._id}
                                            </p>
                                        </td>

                                        <td className="px-5 py-5">
                                            <p>{tenant.email || "—"}</p>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {tenant.phone || "No phone"}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-5 text-gray-500 dark:text-gray-400">
                                            {formatDate(tenant.createdAt)}
                                        </td>

                                        <td className="px-5 py-5">
                                            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${verificationStatus(tenant.contactVerified)}`}>
                                                {tenant.contactVerified
                                                    ? "Verified"
                                                    : "Not verified"}
                                            </span>
                                        </td>

                                        <td className="px-5 py-5">
                                            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${accountStatus(tenant.isActive)}`}>
                                                {tenant.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="divide-y divide-stone-200 md:hidden dark:divide-neutral-800">
                        {tenants.map((tenant) => (
                            <article
                                key={tenant._id}
                                className="p-4 sm:p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
                                            <UserRound size={19} />
                                        </span>

                                        <div className="min-w-0">
                                            <h3 className="truncate font-medium">
                                                {tenant.fullName || "Unnamed tenant"}
                                            </h3>

                                            <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                                                {tenant.email || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${accountStatus(tenant.isActive)}`}>
                                        {tenant.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3 text-xs text-gray-500 dark:text-gray-400">
                                    <p>
                                        Phone: {tenant.phone || "No phone"}
                                    </p>

                                    <p>
                                        Joined: {formatDate(tenant.createdAt)}
                                    </p>

                                    <p>
                                        Contact: {tenant.contactVerified
                                            ? "Verified"
                                            : "Not verified"}
                                    </p>
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
                        {" "}tenants
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setPage((prev) => Math.max(1, prev - 1))
                            }
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
                            onClick={() =>
                                setPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                )
                            }
                            disabled={page >= totalPages || loading}
                            className="border border-stone-300 bg-white px-4 py-2 text-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-800"
                        >
                            Next
                        </button>
                    </div>
                </section>
            )}

            <footer className="mt-10 border-t border-stone-200 py-5 text-xs text-stone-500 dark:border-neutral-800 dark:text-[#A5A5A5]">
                RentGuard · Tenant Management
            </footer>
        </div>
    );
};

export default AdminTenants;
