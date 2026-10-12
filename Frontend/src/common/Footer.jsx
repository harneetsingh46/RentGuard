import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <footer className="border-t border-black/10 px-6 py-8 sm:px-10 lg:px-16 dark:text-white dark:border-white/10 dark:border-neutral-900 dark:bg-neutral-950 md:px-10 dark:shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="mb-10 text-2xl dark:text-white font-semibold">
            <span className="mr-2 rounded-lg bg-yellow-300 px-2 py-1 text-black">
              R
            </span>
            RentGuard
          </Link>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          A clearer way to manage rental information.
        </p>

        <div className="flex flex-wrap gap-5 text-sm">
          <a
            href="#features"
            className="transition hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="transition hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            How it works
          </a>
          <Link
            to="/login"
            className="transition hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="transition hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
};
export default Footer