import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = (path) =>
    `relative text-sm font-semibold transition-colors duration-200 text-black dark:text-white`

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/10 font-['Inter','Segoe_UI',sans-serif] shadow-md transition-colors duration-300 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-2xl backdrop-blur-xs">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-4 py-4 sm:px-6 md:px-10">
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center text-2xl font-semibold text-neutral-900 transition-transform duration-200 hover:scale-[1.02] dark:text-white"
        >
          <span className="mr-2 rounded-lg bg-yellow-300 px-2 py-1 text-black">
            R
          </span>
          RentGuard
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {isAuthenticated ? (
            <Link
              to="/sign-out"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-300 hover:text-black hover:shadow-md dark:border-neutral-700 dark:text-stone-300 dark:hover:border-yellow-300 dark:hover:bg-yellow-300 dark:hover:text-black"
            >
              Sign Out
            </Link>
          ) : (
            <>
              <Link to="/about" className={navLinkClass("/about")}>
                About
              </Link>

              <Link to="/contact" className={navLinkClass("/contact")}>
                Contact Us
              </Link>

              <Link to="/login" className={navLinkClass("/login")}>
                Login
              </Link>

              <Link
                to="/signup"
                className={navLinkClass("/contact")}
              >
                Signup
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-800 transition-all duration-200 hover:border-yellow-400 hover:bg-yellow-100 dark:border-neutral-700 dark:text-white dark:hover:border-yellow-300 dark:hover:bg-neutral-800"
          >
            {isMenuOpen ? (
              // Close icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        id="mobile-navigation"
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-neutral-800 dark:bg-neutral-950 md:hidden ${
          isMenuOpen
            ? "max-h-96 opacity-100"
            : "pointer-events-none max-h-0 opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
          {isAuthenticated ? (
            <Link
              to="/sign-out"
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-800 transition-all hover:border-yellow-400 hover:bg-yellow-100 dark:border-neutral-800 dark:text-stone-300 dark:hover:bg-neutral-900"
            >
              Sign Out
            </Link>
          ) : (
            <>
              <Link
                to="/about"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 transition-all hover:bg-yellow-100 hover:text-black dark:text-stone-300 dark:hover:bg-neutral-900 dark:hover:text-yellow-300"
              >
                About
              </Link>

              <Link
                to="/contact"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 transition-all hover:bg-yellow-100 hover:text-black dark:text-stone-300 dark:hover:bg-neutral-900 dark:hover:text-yellow-300"
              >
                Contact Us
              </Link>

              <Link
                to="/login"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 transition-all hover:bg-yellow-100 hover:text-black dark:text-stone-300 dark:hover:bg-neutral-900 dark:hover:text-yellow-300"
              >
                Login
              </Link>

              <Link
                to="/signup"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
                className="mt-1 rounded-xl bg-yellow-300 px-4 py-3 text-center text-sm font-bold text-black transition-all hover:bg-yellow-400 active:scale-[0.99]"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;