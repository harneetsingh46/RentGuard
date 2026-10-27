import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="m-0 w-full border-t border-black/10 bg-white px-4 py-5 text-black dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 text-center sm:gap-5 lg:flex-row lg:justify-between lg:gap-8 lg:text-left">
        {/* Logo */}
        <div className="shrink-0">
          <Link
            to="/"
            className="inline-flex items-center text-lg font-semibold sm:text-xl"
          >
            <span className="mr-2 rounded-lg bg-yellow-300 px-2 py-0 text-black">
              R
            </span>
            RentGuard
          </Link>
        </div>

        {/* Description */}
        <p className="max-w-full text-balance text-sm leading-5 text-neutral-500 dark:text-neutral-400 sm:max-w-md">
          A clearer way to manage rental information.
        </p>

        {/* Navigation Links */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm sm:gap-x-6"
        >
          <Link
            to="/about"
            className="text-sm font-semibold text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white"
          >
            About
          </Link>

          <Link
            to="/contact"
            className="text-sm font-semibold text-black transition hover:text-slate-950 dark:text-stone-300 dark:hover:text-white"
          >
            Contact Us
          </Link>
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
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
