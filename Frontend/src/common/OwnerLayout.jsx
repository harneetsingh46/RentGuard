import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import {
  ChartNoAxesCombined,
  Building2,
  Users,
  Wallet,
  Files,
} from "lucide-react";

const OwnerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleSignOut = () => {
    setIsMenuOpen(false);
    navigate("/sign-out");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">
      {/* Responsive Top Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-2 border-b border-black/10 bg-white px-3 dark:border-[#373737] dark:bg-[#1B1B1B] sm:h-20 sm:px-5 md:px-8 lg:px-10">
        {/* Menu Button + Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 sm:h-6 sm:w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 sm:h-6 sm:w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>

          <NavLink
            to="/owner/dashboard"
            onClick={closeMenu}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="shrink-0 rounded-lg bg-yellow-300 px-2 py-1 text-lg font-semibold text-black sm:text-2xl">
              R
            </span>

            <span className="truncate text-lg font-semibold sm:text-2xl">
              RentGuard
            </span>
          </NavLink>
        </div>

        {/* Navbar Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-gray-300 px-2.5 py-1.5 text-xs font-medium transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 dark:border-stone-700 dark:hover:bg-[#292929] sm:px-4 sm:py-2 sm:text-sm md:text-base"
          >
            Sign Out
          </button>

          <div className="flex shrink-0 items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/40 sm:top-20 md:hidden"
        />
      )}

      {/* Responsive Sidebar */}
      <aside
        id="owner-sidebar"
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-[min(18rem,85vw)] flex-col overflow-y-auto border-r border-[#E7E3DA] bg-white p-4 transition-transform duration-300 dark:border-[#373737] dark:bg-[#1B1B1B] sm:top-20 sm:p-6 md:top-20 md:w-64 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
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
                  return `group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 sm:px-4 sm:text-base ${
                    isCurrent
                      ? "bg-yellow-300 font-medium text-black shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#292929]"
                  }`;
                }}
              >
                <Icon size={20} strokeWidth={1.8} className="shrink-0" />

                <span className="min-w-0 break-words">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-[#E7E3DA] pt-4 text-sm text-gray-500 dark:border-[#373737] dark:text-yellow-300">
          Owner Workspace
        </div>
      </aside>

      {/* Page Content */}
      <main
        className="
    fixed inset-x-0 bottom-0 top-16
    min-w-0 overflow-x-hidden overflow-y-auto
    overscroll-y-contain scroll-smooth
    bg-[#f2f2f1] dark:bg-[#101010]
    sm:top-20 md:left-64
  "
      >
        <Outlet />
      </main>
    </div>
  );
};

export default OwnerLayout;
