
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
    ChevronDown,
    ChartNoAxesCombined,
    Users,
    UserRound,
    LogOut,
    Menu,
    X,
    ShieldCheck,
} from "lucide-react";

import ThemeToggle from "../components/ThemeToggle";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const dropdownRef = useRef(null);
    const accountButtonRef = useRef(null);

    const navItems = [
        {
            label: "Overview",
            path: "/admin/dashboard",
            icon: ChartNoAxesCombined,
        },
        {
            label: "Owner Verification",
            path: "/admin/owners",
            icon: ShieldCheck,
        },
        {
            label: "Tenants",
            path: "/admin/tenants",
            icon: Users,
        },
    ];

    useEffect(() => {
        setIsMenuOpen(false);
        setIsActionsOpen(false);
    }, [location.pathname]);

    // Close account dropdown on outside click or Escape.
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

    const handleSignOut = () => {
        setIsMenuOpen(false);
        setIsActionsOpen(false);
        navigate("/sign-out");
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">

            {/* TOP NAVBAR */}
            <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white dark:border-[#373737] dark:bg-[#1B1B1B]">

                <div className="flex h-16 items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-10">

                    {/* LOGO */}
                    <NavLink
                        to="/admin/dashboard"
                        className="flex min-w-0 shrink-0 items-center gap-2"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-300 text-xl font-semibold text-black sm:h-10 sm:w-10 sm:text-2xl">
                            R
                        </span>

                        <span className="text-lg font-semibold sm:text-2xl">
                            RentGuard
                        </span>

                        <span className="hidden rounded-md bg-yellow-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-yellow-800 sm:inline-block">
                            Admin
                        </span>
                    </NavLink>

                    {/* DESKTOP NAVIGATION */}
                    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/admin/dashboard"}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition xl:px-4 ${
                                            isActive
                                                ? "bg-yellow-300 text-black"
                                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#292929]"
                                        }`
                                    }
                                >
                                    <Icon size={17} strokeWidth={1.8} />
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* RIGHT ACTIONS */}
                    <div className="flex shrink-0 items-center gap-2">

                        {/* ACCOUNT DROPDOWN */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                ref={accountButtonRef}
                                type="button"
                                onClick={() =>
                                    setIsActionsOpen((previous) => !previous)
                                }
                                aria-expanded={isActionsOpen}
                                aria-haspopup="true"
                                className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-2 text-xs font-medium transition hover:bg-gray-100 dark:border-stone-700 dark:hover:bg-[#292929] sm:px-4 sm:text-sm"
                            >
                                <UserRound size={16} />
                                <span>Admin</span>

                                <ChevronDown
                                    size={15}
                                    className={`transition-transform ${
                                        isActionsOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {isActionsOpen && (
                                <div className="absolute right-0 top-full z-[100] mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-[#171717]">

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
                                        <LogOut size={18} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* MOBILE MENU BUTTON */}
                        <button
                            type="button"
                            onClick={() =>
                                setIsMenuOpen((previous) => !previous)
                            }
                            aria-label={
                                isMenuOpen
                                    ? "Close navigation menu"
                                    : "Open navigation menu"
                            }
                            aria-expanded={isMenuOpen}
                            className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-[#292929] lg:hidden"
                        >
                            {isMenuOpen ? (
                                <X size={22} />
                            ) : (
                                <Menu size={22} />
                            )}
                        </button>
                    </div>
                </div>

                {/* MOBILE NAVIGATION */}
                {isMenuOpen && (
                    <nav className="border-t border-gray-200 bg-white px-4 py-3 dark:border-[#373737] dark:bg-[#1B1B1B] lg:hidden">
                        <div className="mx-auto flex max-w-7xl flex-col gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === "/admin/dashboard"}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                                                isActive
                                                    ? "bg-yellow-300 text-black"
                                                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#292929]"
                                            }`
                                        }
                                    >
                                        <Icon size={19} strokeWidth={1.8} />
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </header>

            {/* PAGE CONTENT */}
            <main className="min-h-[calc(100vh-4rem)] flex-1 bg-[#f2f2f1] dark:bg-[#101010] sm:min-h-[calc(100vh-5rem)]">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
