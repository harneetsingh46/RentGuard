import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Building2, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";

const principles = [
  {
    number: "01",
    title: "Clarity over complexity",
    description: "Rental details, documents, and payment records should be easy to understand—not buried in spreadsheets or messages.",
    icon: CheckCircle2,
  },
  {
    number: "02",
    title: "Trust by design",
    description: "Keep important rental information organized so owners and tenants can make decisions with confidence.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "One connected place",
    description: "Bring property, tenant, and rent workflows together in one considered, practical workspace.",
    icon: Building2,
  },
];

const About = () => {
  return (
    <main className="min-h-[70vh] w-full overflow-hidden bg-white text-black transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        {/* Editorial hero */}
        <section className="grid gap-8 border-b border-black/15 pb-10 dark:border-white/15 sm:pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <div className="animate-[fadeUp_.6s_ease-out_both]">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              A better way to rent
            </p>
            <h1 className="max-w-4xl font-serif text-5xl leading-[0.96] tracking-[-0.055em] sm:text-6xl md:text-7xl xl:text-8xl">
              Rental living,
              <br />
              <span className="relative inline-block">
                made
                <span className="absolute -bottom-1 left-0 -z-0 h-3 w-full bg-yellow-300 sm:h-4" />
              </span>{" "}
              <span className="relative">clearer.</span>
            </h1>
          </div>
          <div className="animate-[fadeUp_.7s_ease-out_both] lg:pb-2">
            <p className="max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-300 sm:text-lg sm:leading-8">
              RentGuard brings the everyday essentials of rental management into one organized space—so property owners can stay on top of the details and tenants know where things stand.
            </p>
            <Link
              to="/contact"
              className="group mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-yellow-300 px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-yellow-200 hover:shadow-[5px_5px_0_0_#111] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
            >
              Talk to our team
              <ArrowUpRight size={17} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>
        </section>

        {/* Feature band */}
        <section className="grid overflow-hidden rounded-xl border border-black/10 bg-neutral-50 dark:border-white/10 dark:bg-neutral-900 sm:grid-cols-3">
          {[
            { icon: Building2, title: "Property", text: "Keep property and unit details together." },
            { icon: Wallet, title: "Rent", text: "See rent records and payment status at a glance." },
            { icon: ShieldCheck, title: "Documents", text: "Keep essential rental files organized." },
          ].map(({ icon: Icon, title, text }, index) => (
            <article
              key={title}
              className={`group flex gap-4 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-yellow-300/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6 lg:p-8 ${
                index < 2 ? "border-b border-black/10 dark:border-white/10 sm:border-b-0 sm:border-r" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-black transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:shadow-md">
                <Icon size={21} strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="mt-1.5 max-w-xs text-sm leading-6 text-neutral-600 dark:text-neutral-300">{text}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Mission and principles */}
        <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">Our point of view</p>
            <h2 className="mt-4 max-w-md font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Good management starts with the <span className="underline decoration-yellow-300 decoration-4 underline-offset-4">small details.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-neutral-600 dark:text-neutral-300 sm:text-base">
              A lease, a due date, a maintenance note, a payment record: each detail matters. RentGuard is built around making those details easier to find and simpler to manage.
            </p>
          </div>

          <div className="border-t border-black/15 dark:border-white/15">
            {principles.map(({ number, title, description, icon: Icon }) => (
              <article key={number} className="group grid gap-3 rounded-xl border-b border-black/15 px-3 py-6 transition-all duration-300 hover:translate-x-1 hover:bg-yellow-300/10 hover:px-5 dark:border-white/15 sm:grid-cols-[56px_1fr] sm:gap-5 sm:py-7">
                <div className="flex items-center justify-between sm:block">
                  <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{number}</span>
                  <Icon size={20} className="text-neutral-500 transition-colors duration-300 group-hover:text-yellow-300 sm:hidden" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h3>
                    <Icon size={20} className="hidden text-neutral-500 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-yellow-500 sm:block" />
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300 sm:text-base sm:leading-7">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Closing callout */}
        <section className="group relative overflow-hidden rounded-xl bg-yellow-300 p-6 text-black transition-shadow duration-500 hover:shadow-[0_18px_45px_rgba(0,0,0,0.14)] sm:p-9 lg:p-12">
          <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border-[24px] border-black/[0.06] transition-transform duration-700 group-hover:scale-125 sm:h-56 sm:w-56" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Make room for clarity</p>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Less chasing details.
                <br />More confidence in every rental.
              </h2>
            </div>
            <Link
              to="/signup"
              className="group/link inline-flex min-h-12 shrink-0 items-center justify-center gap-3 self-start rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-neutral-800 hover:shadow-[5px_5px_0_0_rgba(0,0,0,0.18)] active:translate-y-0 sm:self-auto"
            >
              Get started
              <ArrowDownRight size={17} className="transition-transform duration-300 group-hover/link:translate-x-1 group-hover/link:translate-y-1" />
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </main>
  );
};

export default About;
