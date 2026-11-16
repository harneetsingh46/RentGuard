
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const dropdownRef = useRef(null);
    const accountButtonRef = useRef(null);

    const navItems = [
        { label: "Overview", path: "/admin/dashboard" },
        { label: "Owner Verification", path: "/admin/owners" },
        { label: "Tenants", path: "/admin/tenants" },
    ];

    useEffect(() => {
        setIsMenuOpen(false);
        setIsActionsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isActionsOpen) return;

        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsActionsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsActionsOpen(false);
                accountButtonRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isActionsOpen]);

    const closeMenu = () => setIsMenuOpen(false);

    const handleSignOut = () => {
        setIsMenuOpen(false);
        setIsActionsOpen(false);
        navigate("/sign-out");
    };

    return (
        <div className="flex h-screen h-dvh w-full min-w-0 flex-col overflow-hidden bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">

            {/* NAVBAR */}
            <header className="relative z-50 flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-black/10 bg-white px-3 dark:border-[#373737] dark:bg-[#1B1B1B] sm:h-20 sm:px-5 md:px-8 lg:px-10">

                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">

                    {/* Mobile menu */}
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen((open) => !open)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl hover:bg-gray-100 dark:hover:bg-[#292929] md:hidden"
                    >
                        {isMenuOpen ? "×" : "☰"}
                    </button>

                    {/* Logo */}
                    <NavLink
                        to="/admin/dashboard"
                        onClick={closeMenu}
                        className="flex min-w-0 items-center gap-2"
                    >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-300 text-lg font-semibold text-black sm:h-10 sm:w-10 sm:text-2xl">
                            R
                        </span>

                        <span className="truncate text-lg font-medium sm:text-2xl">
                            RentGuard
                        </span>

                        <span className="hidden rounded-sm bg-yellow-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-black sm:inline-block">
                            Admin
                        </span>
                    </NavLink>
                </div>

                {/* Account dropdown */}
                <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                        ref={accountButtonRef}
                        type="button"
                        onClick={() => setIsActionsOpen((previous) => !previous)}
                        aria-expanded={isActionsOpen}
                        aria-haspopup="true"
                        className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-2 text-xs font-medium transition hover:bg-gray-100 dark:border-stone-700 dark:hover:bg-[#292929] sm:px-4 sm:text-sm"
                    >
                        <span>Admin</span>
                        <span className={`transition-transform ${isActionsOpen ? "rotate-180" : ""}`}>
                            ▼
                        </span>
                    </button>

                    {isActionsOpen && (
                        <div className="absolute right-0 top-full z-[100] mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-[#171717] sm:w-56">

                            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm hover:bg-gray-100 dark:hover:bg-[#292929]">
                                <span>Appearance</span>
                                <ThemeToggle />
                            </div>

                            <div className="my-2 border-t border-gray-200 dark:border-stone-700" />

                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
                            >
                                <span>↪</span>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN AREA */}
            <div className="relative flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">

                {/* Mobile backdrop */}
                {isMenuOpen && (
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={closeMenu}
                        className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/40 sm:top-20 md:hidden"
                    />
                )}

                {/* SIDEBAR */}
                <aside
                    className={`fixed bottom-0 left-0 top-16 z-40 flex w-[min(18rem,85vw)] flex-col overflow-y-auto border-r border-[#E7E3DA] bg-white p-4 transition-transform duration-300 dark:border-[#373737] dark:bg-[#1B1B1B] sm:top-20 sm:p-6 md:static md:z-auto md:h-full md:w-56 md:flex-none md:translate-x-0 lg:w-60 xl:w-64 ${
                        isMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="mb-5 px-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                            Administration
                        </p>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/admin/dashboard"}
                                onClick={closeMenu}
                                className={({ isActive }) =>
                                    `flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 sm:px-4 sm:text-base ${
                                        isActive
                                            ? "bg-yellow-300 font-medium text-black shadow-sm"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#292929]"
                                    }`
                                }
                            >
                                <span className="min-w-0 break-words">
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-auto border-t border-[#E7E3DA] pt-4 text-sm text-gray-500 dark:border-[#373737] dark:text-yellow-300">
                        Admin Workspace
                    </div>
                </aside>

                {/* PAGE CONTENT */}
                <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f2f2f1] dark:bg-[#101010]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
