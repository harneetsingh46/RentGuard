import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

const OwnerLayout = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Overview", path: "/owner/dashboard" },
    { label: "Properties & Units", path: "/owner/properties" },
    { label: "Tenants", path: "/owner/tenants" },
    { label: "Rent & Transactions", path: "/owner/rent" },
    { label: "Documents", path: "/owner/documents" },
  ];

  const handleSignOut = () => {
    setIsMenuOpen(false);
    navigate("/sign-out");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">

      {/* Top Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-black/10 bg-white px-4 dark:border-[#373737] dark:bg-[#1B1B1B] sm:px-6 md:px-10">

        <div className="flex items-center gap-3">

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-[#292929] md:hidden"
          >
            {isMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-6 w-6"
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
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>

          {/* Logo */}
          <NavLink
            to="/owner/dashboard"
            onClick={closeMenu}
            className="flex items-center gap-2"
          >
            <span className="rounded-lg bg-yellow-300 px-2 py-1 text-xl font-semibold text-black sm:text-2xl">
              R
            </span>

            <span className="text-xl font-semibold sm:text-2xl">
              RentGuard
            </span>
          </NavLink>
        </div>

        {/* Navbar Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-gray-300 px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-stone-700 dark:hover:bg-[#292929] sm:px-4 sm:text-base"
          >
            Sign Out
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-20 z-40 flex w-64 flex-col border-r border-[#E7E3DA] bg-white p-6 transition-transform duration-300 dark:border-[#373737] dark:bg-[#1B1B1B] ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/owner/dashboard"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 transition ${
                  isActive
                    ? "bg-yellow-300 font-medium text-black"
                    : "hover:bg-gray-100 dark:hover:bg-[#292929]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#E7E3DA] pt-4 text-sm text-gray-500 dark:border-[#373737] dark:text-yellow-300">
          Owner Workspace
        </div>
      </aside>

      {/* Page Content */}
      <main className="mt-20 h-[calc(100vh-5rem)] min-w-0 overflow-y-auto bg-[#f2f2f1] dark:bg-[#101010] md:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default OwnerLayout;