
import { NavLink, Outlet } from "react-router-dom";

const OwnerLayout = () => {
  const navItems = [
    { label: "Overview", path: "/owner/dashboard" },
    { label: "Properties", path: "/owner/properties" },
    { label: "Tenants & Rent", path: "/owner/tenants" },
    { label: "Transactions", path: "/owner/transactions" },
    { label: "Documents", path: "/owner/documents" },
  ];

  return (
    <div className="flex items-start bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">

      {/* Permanent sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[#E7E3DA] bg-white p-6 dark:border-[#373737] dark:bg-[#1B1B1B]">

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/owner/dashboard"}
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

        <div className="mt-auto border-t border-[#E7E3DA] pt-4 text-sm text-gray-500 dark:text-yellow-300 dark:border-[#373737]">
          Owner Workspace
        </div>
      </aside>

      {/* Current owner page */}
      <main className="min-w-0 flex-1">
        <header className="border-b border-[#E7E3DA] px-8 py-5 dark:border-[#373737]">
          <p className="text-sm text-gray-500 dark:text-yellow-300">
            RentGuard / Owner Workspace
          </p>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default OwnerLayout;
