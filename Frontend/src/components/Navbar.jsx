import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 font-['Inter','Segoe_UI',sans-serif] shadow-md dark:border-neutral-900 dark:bg-neutral-950 md:px-10 dark:shadow-2xl">
      <div>
        <Link to="/" className="mb-10 text-2xl dark:text-white font-semibold">
          <span className="mr-2 rounded-lg bg-yellow-300 px-2 py-1 text-black">
            R
          </span>
          RentGuard
        </Link>
      </div>

      <div className="flex font-bold font- items-center gap-6">
        {
          isAuthenticated ?
            <>
            <Link border-grayborder border-gray-200
                to="/sign-out"
                className="text-sm font-medium text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white dark:border-[#373737] shadow-2xl border border-gray-200 p-2 rounded-3xl"
              >
                Sign Out
              </Link>
            </>
            :
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="text-sm font-semibold text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white"
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