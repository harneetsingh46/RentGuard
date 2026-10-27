import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Mail, MessageSquare, Send } from "lucide-react";

const initialForm = { name: "", email: "", topic: "General enquiry", message: "" };

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Please enter your name.";
    if (!form.email.trim()) nextErrors.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!form.message.trim()) nextErrors.message = "Please tell us how we can help.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // Frontend-only fallback: opens the visitor's email app. Replace with an API call when a contact endpoint exists.
    const subject = encodeURIComponent(`RentGuard enquiry — ${form.topic}`);
    const body = encodeURIComponent(`Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\nTopic: ${form.topic}\n\n${form.message.trim()}`);
    window.location.href = `mailto:support@rentguard.app?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const fieldClass = (field) =>
    `mt-2 w-full rounded-xs border bg-white px-4 py-3.5 text-sm text-black outline-none transition duration-200 placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-yellow-300 dark:border-white/15 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-yellow-300 ${
      errors[field] ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-black/15"
    }`;

  return (
    <main className="min-h-[70vh] w-full overflow-hidden bg-white text-black transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        <section className="grid gap-10 border-b border-black/15 pb-10 dark:border-white/15 sm:pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="animate-[contactFade_.6s_ease-out_both]">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Contact RentGuard
            </p>
            <h1 className="max-w-2xl font-serif text-5xl leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Let’s make
              <br />
              renting feel <span className="underline decoration-purple-700 decoration-4 underline-offset-4">simpler.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-neutral-600 dark:text-neutral-300 sm:text-lg sm:leading-8">
              Have a question about your property, rent records, or documents? Send us a note and tell us what you need.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a
                href="mailto:singh2harneet@gmail.com"
                className="group flex min-w-0 items-start gap-3 rounded-xl border border-black/10 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-yellow-400 hover:bg-yellow-300/10 hover:shadow-[0_12px_28px_rgba(0,0,0,0.09)] dark:border-white/15 dark:hover:border-yellow-300"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-black transition-all duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:shadow-md">
                  <Mail size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Email us</span>
                  <span className="mt-1 block break-all text-sm text-neutral-600 dark:text-neutral-300">singh2harneet@gmail.com</span>
                </span>
                <ArrowUpRight size={16} className="ml-auto shrink-0 text-neutral-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
              <div className="flex items-start gap-3 rounded-xl border border-black/10 p-4 dark:border-white/15">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-black transition-transform duration-300 hover:rotate-[-5deg] hover:scale-110">
                  <MessageSquare size={19} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Here to help</p>
                  <p className="mt-1 text-sm leading-5 text-neutral-600 dark:text-neutral-300">Share the details and we’ll help you find the next step.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-[contactFade_.7s_ease-out_both] rounded-xs border border-black/10 bg-neutral-50 p-5 dark:border-white/10 dark:bg-neutral-900 sm:p-7 lg:p-9">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Send a message</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">How can we help?</h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xs bg-yellow-300 text-black">
                <Send size={20} />
              </span>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="text-sm font-medium">Your name <span className="text-yellow-600 dark:text-yellow-300">*</span></label>
                  <input id="contact-name" name="name" value={form.name} onChange={handleChange} autoComplete="name" placeholder="Jane Smith" className={fieldClass("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} />
                  {errors.name && <p id="contact-name-error" className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-sm font-medium">Email address <span className="text-yellow-600 dark:text-yellow-300">*</span></label>
                  <input id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" placeholder="you@example.com" className={fieldClass("email")} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} />
                  {errors.email && <p id="contact-email-error" className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="contact-topic" className="text-sm font-medium">What is this about?</label>
                <select id="contact-topic" name="topic" value={form.topic} onChange={handleChange} className={fieldClass("topic")}>
                  <option>General enquiry</option>
                  <option>Property management</option>
                  <option>Rent and payments</option>
                  <option>Tenant documents</option>
                  <option>Account or technical issue</option>
                  <option>Feedback</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="text-sm font-medium">Your message <span className="text-yellow-600 dark:text-yellow-300">*</span></label>
                <textarea id="contact-message" name="message" value={form.message} onChange={handleChange} rows={5} maxLength={3000} placeholder="Tell us a little about what you need..." className={`${fieldClass("message")} min-h-32 resize-y`} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined} />
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  {errors.message ? <p id="contact-message-error" className="text-xs text-red-600">{errors.message}</p> : <span className="text-xs text-neutral-500 dark:text-neutral-400">Please don’t include passwords or sensitive account details.</span>}
                  <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">{form.message.length}/3000</span>
                </div>
              </div>

              {submitted && (
                <p role="status" className="flex items-start gap-2 rounded-xs border border-yellow-500/40 bg-yellow-300/15 p-3 text-sm">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-300" />
                  Your email app should open with your message ready to send. If it didn’t, email us directly.
                </p>
              )}

              <button type="submit" className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xs bg-yellow-300 px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:bg-yellow-200 hover:shadow-[0_12px_26px_rgba(0,0,0,0.12)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 sm:w-auto">
                Send message
                <ArrowUpRight size={17} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
              <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                This form opens your default email app; it does not send data to a server.
              </p>
            </form>
          </div>
        </section>

        <section className="flex flex-col gap-4 pt-6 text-sm text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Clear information makes better rental experiences.</p>
          <Link to="/about" className="group inline-flex items-center gap-2 self-start rounded-md font-semibold text-black transition-all duration-300 hover:translate-x-1 hover:text-yellow-700 dark:text-white dark:hover:text-yellow-300 sm:self-auto">
            Get to know RentGuard
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </section>
      </div>

      <style>{`
        @keyframes contactFade {
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

export default Contact;
