
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Users,
    ArrowRight,
    RefreshCw,
} from "lucide-react";
import apiClient from "../../ApiClient/interceptor";

const AdminDashboard = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchOverview = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiClient.get("/admin/overview");

            setOverview(response.data.data);
        } catch (error) {
            console.error("Admin overview error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load admin dashboard. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const stats = [
        {
            title: "Total Owners",
            value: overview?.totalOwners ?? 0,
            description: "Registered property owners",
            color: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400",
            link: "/admin/owners",
        },
        {
            title: "Pending Verification",
            value: overview?.pendingOwners ?? 0,
            description: "Owners awaiting review",
            color: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
            link: "/admin/owners",
        },
        {
            title: "Approved Owners",
            value: overview?.approvedOwners ?? 0,
            description: "Verified property owners",
            color: "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400",
            link: "/admin/owners",
        },
        {
            title: "Rejected Owners",
            value: overview?.rejectedOwners ?? 0,
            description: "Owners whose verification was rejected",
            color: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400",
            link: "/admin/owners",
        },
        {
            title: "Total Tenants",
            value: overview?.totalTenants ?? 0,
            description: "Registered tenants",
            color: "bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400",
            link: "/admin/tenants",
        },
    ];

    return (
        <div className="min-h-full w-full bg-[#f2f2f1] px-4 py-6 text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 sm:py-8 lg:px-10">

            {/* PAGE HEADER */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                            Administration
                        </span>
                    </div>

                    <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                        Admin Overview
                    </h1>

                    <p className="mt-2 text-sm text-gray-500 dark:text-[#A5A5A5]">
                        Monitor owner verification and tenant registrations.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchOverview}
                    disabled={loading}
                    className="inline-flex w-fit items-center justify-center gap-2 border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </section>

            {/* ERROR MESSAGE */}
            {error && (
                <div
                    role="alert"
                    className="mt-7 flex flex-col justify-between gap-3 border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={fetchOverview}
                        className="w-fit font-semibold underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* LOADING */}
            {loading && !overview && (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-36 animate-pulse border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                        />
                    ))}
                </div>
            )}

            {/* STATISTICS */}
            {overview && (
                <>
                    <section className="mt-8">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-medium tracking-tight">
                                    Platform Statistics
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-[#A5A5A5]">
                                    Current registration and verification totals.
                                </p>
                            </div>

                            {loading && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Updating...
                                </span>
                            )}
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {stats.map((stat) => {
                                return (
                                    <Link
                                        key={stat.title}
                                        to={stat.link}
                                        className="group border border-stone-200 bg-white p-5 transition hover:border-yellow-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-yellow-400 sm:p-6"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-[#A5A5A5]">
                                                    {stat.title}
                                                </p>

                                                <p className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
                                                    {stat.value}
                                                </p>
                                            </div>

                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${stat.color}`}>
                                                RG
                                            </span>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between gap-2">
                                            <p className="text-xs text-gray-500 dark:text-[#A5A5A5]">
                                                {stat.description}
                                            </p>

                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    {/* QUICK ACTIONS */}
                    <section className="mt-10">
                        <h2 className="text-xl font-medium tracking-tight">
                            Quick Actions
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-[#A5A5A5]">
                            Manage platform registrations.
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Link
                                to="/admin/owners"
                                className="flex items-center justify-between gap-4 border border-stone-200 bg-white p-5 transition hover:border-yellow-400 dark:border-neutral-800 dark:bg-neutral-950 sm:p-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h3 className="font-medium">
                                            Review Owners
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-500 dark:text-[#A5A5A5]">
                                            Approve or reject owner verification.
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            <Link
                                to="/admin/tenants"
                                className="flex items-center justify-between gap-4 border border-stone-200 bg-white p-5 transition hover:border-yellow-400 dark:border-neutral-800 dark:bg-neutral-950 sm:p-6"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-300 text-black dark:bg-yellow-400/10 dark:text-yellow-300">
                                        <Users size={22} />
                                    </span>

                                    <div>
                                        <h3 className="font-medium">
                                            View Tenants
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-500 dark:text-[#A5A5A5]">
                                            View registered tenant accounts.
                                        </p>
                                    </div>
                                </div>

                                <ArrowRight size={19} className="shrink-0" />
                            </Link>
                        </div>
                    </section>
                </>
            )}

            {/* FOOTER */}
            <footer className="mt-12 border-t border-stone-200 py-5 text-xs text-stone-500 dark:border-neutral-800 dark:text-[#A5A5A5]">
                RentGuard · Admin Workspace
            </footer>
        </div>
    );
};

export default AdminDashboard;
