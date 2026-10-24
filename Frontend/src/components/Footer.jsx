import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full m-0 border-t border-black/10 bg-white px-4 py-6 text-black dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:px-6 sm:py-8 lg:px-10 lg:py-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 sm:gap-6 lg:flex-row lg:justify-between">
        
        {/* Logo */}
        <div className="shrink-0">
          <Link
            to="/"
            className="inline-flex items-center text-xl font-semibold sm:text-2xl"
          >
            <span className="mr-2 rounded-lg bg-yellow-300 px-2 py-0 text-black">
              R
            </span>
            RentGuard
          </Link>
        </div>

        {/* Description */}
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          A clearer way to manage rental information.
        </p>

        {/* Navigation Links */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm sm:gap-x-6"
        >
          <Link
            to="/login"
            className="transition-colors hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="transition-colors hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;