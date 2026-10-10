import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 font-['Inter','Segoe_UI',sans-serif] shadow-md dark:border-neutral-700 dark:bg-neutral-950 md:px-10">
      <div>
        <Link
          to="/"
          className="text-xl font-normal tracking-tight text-black dark:text-white"
        >
          RentGuard
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {
          isAuthenticated ?
            <>
            <Link
                to="/sign-out"
                className="text-sm font-medium text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white dark:border-[#373737]  border p-2 rounded-3xl"
              >
                Sign Out
              </Link>
            </>
            :
            <>
              <Link
                to="/login"
                className="text-sm font-normal text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="text-sm font-normal text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white"
              >
                Signup
              </Link>
            </>
        }
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;