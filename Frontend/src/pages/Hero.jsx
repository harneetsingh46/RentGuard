
import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    icon: "⌂",
    title: "Property & Unit Management",
    description:
      "Create properties, manage rental units, track occupancy, and keep property information organized.",
  },
  {
    number: "02",
    icon: "₹",
    title: "Bills & Online Payments",
    description:
      "Manage rent and utility bills, pay securely through Razorpay, and access payment history and PDF receipts.",
  },
  {
    number: "03",
    icon: "♧",
    title: "Tenant & Rental Management",
    description:
      "Manage tenant records, browse available rentals, submit applications, and handle rental offers.",
  },
  {
    number: "04",
    icon: "▤",
    title: "Document Management",
    description:
      "Upload, organize, view, and download important property and tenant documents.",
  },
  {
    number: "05",
    icon: "⚙",
    title: "Maintenance Management",
    description:
      "Submit maintenance complaints, attach photographs, track progress, and manage repair requests.",
  },
  {
    number: "06",
    icon: "✓",
    title: "Secure Account Management",
    description:
      "Use email OTP authentication, role-based access, owner verification, and dedicated dashboards.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Register as a property owner or tenant and access your dedicated RentGuard workspace.",
  },
  {
    number: "02",
    title: "Manage your rental activities",
    description:
      "Owners can manage properties, tenants, bills, and maintenance. Tenants can browse rentals, apply, and manage their tenancy.",
  },
  {
    number: "03",
    title: "Stay organized and connected",
    description:
      "Track payments, download receipts, manage documents, and stay updated with rental notifications.",
  },
];

const Home = () => {
  return (
    <div className="overflow-hidden w-full bg-[#F8F7F2] text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[calc(100svh-64px)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8 sm:py-20 lg:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/15 blur-3xl sm:h-[28rem] sm:w-[28rem] dark:bg-yellow-400/[0.07]"
        />

        <div className="hero-enter mx-auto w-full max-w-5xl text-center">
          <p className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600 sm:mb-8 sm:text-sm dark:text-neutral-400">
            <span
              className="h-px w-10 bg-yellow-500"
              aria-hidden="true"
            />
            <span>Rental management, made clearer</span>
            <span
              className="h-px w-10 bg-yellow-500"
              aria-hidden="true"
            />
          </p>

          <h1 className="text-[2.6rem] font-semibold leading-[1.06] tracking-[-0.045em] text-balance sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
            Manage rentals{" "}
            <br className="hidden sm:block" />
            without the{" "}
            <span className="hero-highlight relative inline-block text-[#D99D00] dark:text-[#F7C744]">
              chaos.
              <span
                aria-hidden="true"
                className="absolute bottom-1 left-0 -z-10 h-2.5 w-full -rotate-1 rounded-sm bg-yellow-300/45 sm:bottom-1.5 sm:h-3.5"
              />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:mt-8 sm:text-lg sm:leading-8 lg:max-w-3xl lg:text-xl dark:text-neutral-400">
            Manage properties, rental applications, bills, online payments,
            maintenance requests, and important documents in one organized
            workspace.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <Link
              to="/signup"
              className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-300 px-7 py-4 text-base font-semibold text-black shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/15 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 sm:w-auto sm:px-9 sm:text-lg dark:focus-visible:ring-offset-black"
            >
              Get started
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>

            <a
              href="#features"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/50 px-7 py-4 text-base font-medium transition duration-300 hover:-translate-y-0.5 hover:border-yellow-400/60 hover:bg-white hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 sm:w-auto sm:px-9 sm:text-lg dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-yellow-300/40 dark:hover:bg-white/[0.06]"
            >
              Explore features
              <span
                aria-hidden="true"
                className="text-neutral-500 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-yellow-600 dark:group-hover:text-yellow-300"
              >
                ↓
              </span>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-neutral-600 sm:mt-12 sm:gap-x-10 sm:text-base dark:text-neutral-400">
            {[
              "Admin-verified owners",
              "Secure online payments",
              "PDF receipts",
            ].map((item) => (
              <span
                key={item}
                className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-neutral-950 dark:hover:text-white"
              >
                <span
                  className="text-sm text-yellow-600 transition-transform duration-200 group-hover:scale-110 sm:text-base dark:text-yellow-300"
                  aria-hidden="true"
                >
                  ✓
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 border-t border-black/5 px-6 py-20 sm:px-10 lg:px-16 lg:py-24 dark:border-white/10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-600 dark:text-yellow-300">
              Everything in one place
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Less admin. More clarity.
            </h2>

            <p className="mt-5 text-base leading-7 text-neutral-600 dark:text-neutral-400 sm:text-lg">
              The essential tools to help you keep rental information organized
              and make everyday property management simpler.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="group rounded-2xl border border-black/10 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-lg hover:shadow-black/5 dark:border-white/10 dark:bg-[#1B1B1B] dark:hover:border-yellow-300/60"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-300/40 text-2xl text-black transition group-hover:bg-yellow-300 group-hover:text-black dark:bg-yellow-300/15 dark:text-yellow-300">
                    {feature.icon}
                  </span>

                  <span className="text-sm text-yellow-300">
                    {feature.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-black/5 bg-white/60 px-6 py-20 sm:px-10 lg:px-16 lg:py-24 dark:border-white/10 dark:bg-[#171717]"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-700 dark:text-white">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl dark:text-yellow-300">
              A simpler way to manage rentals.
            </h2>

            <p className="mt-5 leading-7 text-neutral-600 dark:text-neutral-400">
              Start with the essentials and build an organized rental workspace
              around your needs.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step) => (
              <article key={step.number} className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-300 text-lg font-semibold text-black">
                  {step.number}
                </span>

                <h3 className="mt-5 text-xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-400">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Separate owner and tenant benefits */}
      <section
        id="for-owners"
        className="px-6 py-20 sm:px-10 lg:px-16 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          {/* Owner Card */}
          <article className="rounded-3xl bg-[#171717] p-8 text-white sm:p-10 lg:p-12">
            <span className="inline-flex rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-black">
              FOR PROPERTY OWNERS
            </span>

            <h2 className="mt-7 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
              Manage your properties. Simplify your operations.
            </h2>

            <p className="mt-5 max-w-lg leading-7 text-neutral-300">
              Take control of your rental business with tools to manage
              properties, units, tenants, rental applications, bills, payments,
              documents, and maintenance requests.
            </p>

            <ul className="mt-7 space-y-3 text-sm text-neutral-300">
              {[
                "Manage properties, units, and occupancy",
                "Register tenants and manage rental applications",
                "Create bills and track payment collections",
                "Manage documents and maintenance complaints",
                "Monitor rental performance through your dashboard",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-yellow-300" aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400"
              >
                Sign up <span aria-hidden="true">→</span>
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:border-yellow-300 hover:bg-white/5"
              >
                Login <span aria-hidden="true">→</span>
              </Link>
            </div>

            <p className="mt-4 text-xs text-neutral-400">
              Owner accounts require RentGuard verification before property
              management.
            </p>
          </article>

          {/* Tenant Card */}
          <article
            id="for-tenants"
            className="rounded-3xl border border-black/10 bg-white p-8 sm:p-10 lg:p-12 dark:border-white/10 dark:bg-[#1B1B1B]"
          >
            <span className="inline-flex rounded-full bg-yellow-300/40 px-3 py-1 text-xs font-semibold text-neutral-800 dark:bg-yellow-300/15 dark:text-yellow-300">
              FOR TENANTS
            </span>

            <h2 className="mt-7 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
              Your rental journey, all in one place.
            </h2>

            <p className="mt-5 max-w-lg leading-7 text-neutral-600 dark:text-neutral-400">
              Find rental opportunities, manage your tenancy, pay bills, access
              receipts, organize documents, and stay connected with your
              property owner.
            </p>

            <ul className="mt-7 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              {[
                "Browse available properties and submit applications",
                "Track rental applications and tenancy details",
                "View and pay bills securely online",
                "Access recent transactions and download receipts",
                "Manage documents and maintenance complaints",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="text-yellow-600 dark:text-yellow-300"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400"
              >
                Sign up <span aria-hidden="true">→</span>
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-5 py-3 font-semibold transition hover:border-yellow-500 hover:bg-yellow-300/20 dark:border-white/15 dark:text-white"
              >
                Login <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 sm:px-10 lg:px-16 lg:pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-yellow-300 px-7 py-14 text-black sm:px-12 sm:py-16 lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-black/5"
          />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-black/60">
                Your rental workspace starts here
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Everything your rental needs, in one place.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-black/70">
                Whether you own rental properties or are looking for a place to
                call home, RentGuard helps make every rental activity simpler.
              </p>
            </div>

            <Link
              to="/signup"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#171717] px-7 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300"
            >
              Get started <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Subtle entrance motion and reduced-motion support */}
      <style>{`
        @keyframes heroEnter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-enter {
          animation: heroEnter 650ms cubic-bezier(.2,.7,.2,1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-enter { animation: none !important; }
          *, *::before, *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
