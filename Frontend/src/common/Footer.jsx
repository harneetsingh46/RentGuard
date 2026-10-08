const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-stone-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-3 sm:flex-row md:px-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Rent Guard
          </h2>
          <p className="mt-1 text-sm">
            Simple property management for owners and tenants.
          </p>
        </div>

        <div className="text-sm">
          © 2026 Rent Guard. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
export default Footer