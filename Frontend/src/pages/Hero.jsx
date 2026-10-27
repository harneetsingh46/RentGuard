import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    icon: "⌂",
    title: "Property management",
    description:
      "Keep property details, rental units, and occupancy information organized in one place.",
  },
  {
    number: "02",
    icon: "₹",
    title: "Rent tracking",
    description:
      "See rent payments, outstanding balances, and upcoming dues without searching through records.",
  },
  {
    number: "03",
    icon: "↗",
    title: "Payment visibility",
    description:
      "Get a clearer picture of payment activity and your rental income.",
  },
  {
    number: "04",
    icon: "▤",
    title: "Document organization",
    description: "Keep important rental documents easier to find and manage.",
  },
  {
    number: "05",
    icon: "♧",
    title: "Tenant management",
    description:
      "Keep tenant details connected to the properties and rental units they belong to.",
  },
  {
    number: "06",
    icon: "✓",
    title: "One shared workspace",
    description:
      "Give owners and tenants a more organized way to manage their rental responsibilities.",
  },
];

const steps = [
  {
    number: "01",
    title: "Set up your workspace",
    description:
      "Create your account and organize your rental properties and units.",
  },
  {
    number: "02",
    title: "Connect your rentals",
    description:
      "Manage tenant details, rental information, and payment records in one place.",
  },
  {
    number: "03",
    title: "Stay on top of things",
    description:
      "Review rent status, monitor outstanding balances, and keep records organized.",
  },
];

const Home = () => {
  return (
    <div className="overflow-hidden w-full bg-[#F8F7F2] text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED]">
      {/* Hero — refined, minimal, and responsive */}
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-16 lg:px-16 lg:pb-28 lg:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-12 -z-10 h-72 w-72 rounded-full bg-yellow-300/15 blur-3xl sm:h-96 sm:w-96 dark:bg-yellow-400/[0.07]" />
        

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="hero-enter min-w-0">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600 sm:mb-6 sm:text-sm dark:text-neutral-400">
              <span className="h-px w-7 bg-violet-500" aria-hidden="true" />
              Rental management, made clearer
            </p>

            <h1 className="max-w-2xl text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-6xl lg:text-7xl">
              Manage rentals
              <br />
              without the{" "}
              <span className="hero-highlight relative inline-block text-[#D99D00] dark:text-[#F7C744]">
                chaos.
                <span aria-hidden="true" className="absolute bottom-1 left-0 -z-10 h-2.5 w-full -rotate-1 rounded-sm bg-yellow-300/45 sm:bottom-1.5 sm:h-3.5" />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8 dark:text-neutral-400">
              Keep property details, rent tracking, tenant information, and
              important documents in one organized workspace.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/signup" className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-300 px-6 py-3.5 font-semibold text-black shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/15 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 sm:w-auto sm:px-7 sm:py-4 dark:focus-visible:ring-offset-black">
                Get started
                <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>

              <a href="#features" className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/50 px-6 py-3.5 font-medium transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-white hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:w-auto sm:px-7 sm:py-4 dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-violet-300/40 dark:hover:bg-white/[0.06]">
                Explore features
                <span aria-hidden="true" className="text-neutral-500 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-300">↓</span>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-neutral-600 sm:mt-10 sm:gap-x-6 dark:text-neutral-400">
              {["Owner workspace", "Tenant access", "Organized records"].map((item) => (
                <span key={item} className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-neutral-950 dark:hover:text-white">
                  <span className="text-sm text-violet-600 transition-transform duration-200 group-hover:scale-110 dark:text-violet-300" aria-hidden="true">✓</span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-preview-wrap group relative mx-auto w-full min-w-0 max-w-2xl lg:max-w-none">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-2xl bg-violet-400/[0.07] opacity-0 blur-2xl transition-opacity duration-500 dark:bg-violet-400/[0.09]" />
            <div className="hero-preview group relative overflow-hidden rounded-2xl border border-black/[0.09] bg-white p-1.5 shadow-[0_18px_55px_-38px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-[0_24px_65px_-35px_rgba(65,45,100,0.28)] sm:rounded-3xl sm:p-2 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-violet-300/20">
              <img src="/RentGuard-Hero.png" alt="RentGuard property management dashboard displayed on a laptop" className="h-auto w-full rounded-xl object-cover transition-transform duration-700 ease-out group-hover:scale-[1.008] sm:rounded-2xl" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 px-1 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />One clear view of your rentals</span>
              <span className="hidden sm:inline">RentGuard workspace</span>
            </div>
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-700 dark:text-yellow-300">
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
                className="group rounded-2xl border border-black/10 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-yellow-400 hover:shadow-lg hover:shadow-black/5 dark:border-white/10 dark:bg-[#1B1B1B] dark:hover:border-yellow-400/60"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-300/40 text-2xl text-black transition group-hover:bg-yellow-300 group-hover:text-black dark:bg-yellow-300/15 dark:text-yellow-300">
                    {feature.icon}
                  </span>
                  <span className="text-sm text-purple-800">
                    {feature.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700  dark:text-white">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl dark:text-purple-700">
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
                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
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
          <article className="rounded-3xl bg-[#171717] p-8 text-white sm:p-10 lg:p-12">
            <span className="inline-flex rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-black">
              FOR PROPERTY OWNERS
            </span>
            <h2 className="mt-7 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
              Your properties. Your records. One workspace.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-neutral-300">
              Organize properties, manage tenant information, and review rental
              payment records from your owner workspace.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xs bg-yellow-300 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400"
            >
              Create an owner account <span aria-hidden="true">→</span>
            </Link>
          </article>

          <article
            id="for-tenants"
            className="rounded-3xl border border-black/10 bg-white p-8 sm:p-10 lg:p-12 dark:border-white/10 dark:bg-[#1B1B1B]"
          >
            <span className="inline-flex rounded-full bg-yellow-300/40 px-3 py-1 text-xs font-semibold text-neutral-800 group-hover:text-black dark:bg-yellow-300/15 dark:text-yellow-300">
              FOR TENANTS
            </span>
            <h2 className="mt-7 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
              Rental information, without the confusion.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-neutral-600 dark:text-neutral-400">
              Access your rental workspace and keep track of the information
              your property owner makes available to you.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xx border border-black/10 px-5 py-3 font-semibold transition hover:border-yellow-500 hover:bg-yellow-300/20 dark:border-white/15"
            >
              Tenant login <span aria-hidden="true">→</span>
            </Link>
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
                Make rental management feel manageable.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-black/70">
                Bring your rental information together and take the next step
                toward a more organized workflow.
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

        .hero-preview {
          animation: heroEnter 750ms cubic-bezier(.2,.7,.2,1) 100ms both;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-enter,
          .hero-preview { animation: none !important; }
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
