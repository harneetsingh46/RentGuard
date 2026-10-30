import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChartNoAxesCombined,
  Building2,
  Users,
  Wallet,
  Files,
  Menu,
  X,
  UserRound,
  LogOut,
} from "lucide-react";

import ThemeToggle from "../components/ThemeToggle";

const OwnerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const dropdownRef = useRef(null);
  const accountButtonRef = useRef(null);

  const navItems = [
    {
      label: "Overview",
      path: "/owner/dashboard",
      icon: ChartNoAxesCombined,
    },
    {
      label: "Properties & Units",
      path: "/owner/properties",
      icon: Building2,
    },
    {
      label: "Tenants",
      path: "/owner/tenants",
      icon: Users,
    },
    {
      label: "Rent & Transactions",
      path: "/owner/rent",
      icon: Wallet,
    },
    {
      label: "Documents",
      path: "/owner/documents",
      icon: Files,
    },
  ];

  // Close menus when navigating to another page.
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

  const handleProfileNavigation = () => {
    setIsMenuOpen(false);
    setIsActionsOpen(false);
    navigate("/owner/profile");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="flex h-screen h-dvh w-full min-w-0 flex-col overflow-hidden bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">

      {/* ================= NAVBAR ================= */}
      <header className="relative z-50 flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-black/10 bg-white px-3 dark:border-[#373737] dark:bg-[#1B1B1B] sm:h-20 sm:px-5 md:px-8 lg:px-10">

        {/* Menu Button + Logo */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={
              isMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={isMenuOpen}
            aria-controls="owner-sidebar"
            className="shrink-0 rounded-lg p-2 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 dark:hover:bg-[#292929] md:hidden"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>

          <NavLink
            to="/owner/dashboard"
            onClick={closeMenu}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-300 text-lg font-semibold text-black sm:h-10 sm:w-10 sm:text-2xl">
              R
            </span>

            <span className="truncate text-lg font-semibold sm:text-2xl">
              RentGuard
            </span>
          </NavLink>
        </div>

        {/* Account Dropdown — Mobile, Tablet, Laptop & Desktop */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            ref={accountButtonRef}
            type="button"
            onClick={() => setIsActionsOpen((prev) => !prev)}
            aria-expanded={isActionsOpen}
            aria-haspopup="true"
            aria-controls="owner-account-dropdown"
            className="flex items-center gap-1.5 rounded-full border border-gray-300 px-2.5 py-2 text-xs font-medium transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 dark:border-stone-700 dark:hover:bg-[#292929] min-[380px]:gap-2 min-[380px]:px-3 sm:px-4 sm:text-sm"
          >
            <UserRound size={16} className="shrink-0" />

            <span>Account</span>

            <ChevronDown
              size={15}
              className={`shrink-0 transition-transform duration-200 ${
                isActionsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isActionsOpen && (
            <div
              id="owner-account-dropdown"
              className="absolute right-0 top-full z-[100] mt-2 w-52 origin-top-right rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-[#171717] sm:w-56"
            >
              {/* Profile */}
              <button
                type="button"
                onClick={handleProfileNavigation}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 dark:hover:bg-[#292929]"
              >
                <UserRound size={18} className="shrink-0" />
                <span>Profile</span>
              </button>

              {/* Appearance */}
              <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm hover:bg-gray-100 dark:hover:bg-[#292929]">
                <span>Appearance</span>
                <ThemeToggle />
              </div>

              <div className="my-2 border-t border-gray-200 dark:border-stone-700" />

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:text-red-400 dark:hover:bg-red-400/10"
              >
                <LogOut size={18} className="shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN AREA ================= */}
      <div className="relative flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">

        {/* Mobile Backdrop */}
        {isMenuOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/40 sm:top-20 md:hidden"
          />
        )}

        {/* ================= SIDEBAR ================= */}
        <aside
          id="owner-sidebar"
          className={`fixed bottom-0 left-0 top-16 z-40 flex w-[min(18rem,85vw)] flex-col overflow-y-auto border-r border-[#E7E3DA] bg-white p-4 transition-transform duration-300 dark:border-[#373737] dark:bg-[#1B1B1B] sm:top-20 sm:p-6 md:static md:z-auto md:h-full md:w-56 md:flex-none md:translate-x-0 lg:w-60 xl:w-64 ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/owner/dashboard"}
                  onClick={closeMenu}
                  className={({ isActive }) => {
                    const isCurrent =
                      isActive ||
                      (item.path === "/owner/documents" &&
                        location.pathname.startsWith("/owner/documents"));

                    return `group flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 sm:px-4 sm:text-base ${
                      isCurrent
                        ? "bg-yellow-300 font-medium text-black shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#292929]"
                    }`;
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    className="shrink-0"
                  />

                  <span className="min-w-0 break-words">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-[#E7E3DA] pt-4 text-sm text-gray-500 dark:border-[#373737] dark:text-yellow-300">
            Owner Workspace
          </div>
        </aside>

        {/* ================= PAGE CONTENT ================= */}
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f2f2f1] dark:bg-[#101010]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;