import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

const OwnerLayout = () => {
  const navigate = useNavigate();

  const navItems = [
    { label: "Overview", path: "/owner/dashboard" },
    { label: "Properties", path: "/owner/properties" },
    { label: "Tenants", path: "/owner/tenants" },
    { label: "Rent & Transactions", path: "/owner/rent" },
    { label: "Documents", path: "/owner/documents" },
  ];

  const handleSignOut = () => {
    navigate("/sign-out");
  };

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const newIsDark = !isDark;

    document.documentElement.classList.toggle("dark", newIsDark);
    setIsDark(newIsDark);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">

      {/* Top Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-black/10 bg-white px-6 dark:border-[#373737] dark:bg-[#1B1B1B] md:px-10">
        <NavLink to="/owner/dashboard" className="flex items-center gap-2">
          <span className="rounded-lg bg-yellow-300 px-2 py-1 text-2xl font-semibold text-black">
            R
          </span>
          <span className="text-2xl font-semibold">RentGuard</span>
        </NavLink>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full font-medium border border-gray-300 px-4 py-2 transition hover:bg-gray-100 dark:border-stone-700 dark:hover:bg-[#292929]"
          >
            Sign Out
          </button>

          {/* Keep your existing theme toggle here */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full p-2 text-xl transition hover:bg-gray-100 dark:hover:bg-[#292929]"
          >
            {isDark ? "🌙" : "🌞"}
          </button>
        </div>
      </header>

      {/* Fixed Sidebar */}
      <aside className="fixed bottom-0 left-0 top-20 z-40 flex w-64 flex-col border-r border-[#E7E3DA] bg-white p-6 dark:border-[#373737] dark:bg-[#1B1B1B]">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/owner/dashboard"}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 transition ${isActive
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

      {/* Only page content scrolls */}
      <main className="ml-64 mt-20 h-[calc(100vh-5rem)] min-w-0 overflow-y-auto bg-[#f2f2f1] dark:bg-[#101010]">
        <Outlet />
      </main>

    </div>
  );
};

export default OwnerLayout;