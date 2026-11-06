import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t border-black/10 bg-white px-4 py-5 text-black dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-5 text-center lg:grid-cols-[1fr_auto_1fr] lg:gap-8">

        {/* Logo */}
        <div className="flex justify-center lg:justify-start">
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

        {/* Center Description */}
        <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          A clearer way to manage rental information.
        </p>

        {/* Navigation */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm lg:justify-end"
        >
          <Link
            to="/"
            className="font-semibold text-black transition-colors hover:text-yellow-600 dark:text-stone-300 dark:hover:text-yellow-300"
          >
            Home
          </Link>

          <Link
            to="/about"
            className="font-semibold text-black transition-colors hover:text-yellow-600 dark:text-stone-300 dark:hover:text-yellow-300"
          >
            About
          </Link>

          <Link
            to="/contact"
            className="font-semibold text-black transition-colors hover:text-yellow-600 dark:text-stone-300 dark:hover:text-yellow-300"
          >
            Contact Us
          </Link>

          <Link
            to="/login"
            className="font-semibold text-black transition-colors hover:text-yellow-600 dark:text-stone-300 dark:hover:text-yellow-300"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="font-semibold text-black transition-colors hover:text-yellow-600 dark:text-stone-300 dark:hover:text-yellow-300"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;