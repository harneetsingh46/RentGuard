# RentGuard — Agent Project Guide (Frontend)

## 0. UI LOCK — READ FIRST

**The current UI is frozen.** Do not change the look, layout, spacing, colors, fonts, icons, copy, animations, or responsive behavior of any screen unless the user explicitly asks for that specific UI change in the current request.

Rules for every agent:

1. **Match the existing UI exactly** for anything new. Copy class patterns from Section 4 and from the nearest existing page. Do not introduce a new style, color, radius, font, or component look.
2. **Logic-only requests stay logic-only.** Bug fixes, validation, API wiring, and refactors must not alter rendered output, class names, or markup structure beyond what the task requires.
3. **No "cleanup" of UI code.** Do not reformat, reorder, rename, or "fix" Tailwind classes, JSX structure, or CSS in files you were not asked to restyle. See Section 11 for quirks that must be left alone.
4. **No new UI libraries.** Do not add component kits, CSS frameworks, font packages, or icon sets. Use Tailwind utilities and `lucide-react` only.
5. **No global CSS/theme changes** (`index.css`, `scrollbar.css`, Tailwind config, dark-mode setup) unless the user asks.
6. **If a task seems to need a UI change, stop and ask first.** State what would change and why.
7. **When the user does request a UI change,** limit it to the named screen/component, keep every other screen identical, and update this file afterward if the new look becomes the standard.
8. **After editing,** list every file touched and confirm "no visual changes outside the request."

## 1. Project purpose

RentGuard is a rental/property management web app for **owners** and **tenants**: properties and units, tenants, rent and payments, documents, and dashboards.

The repository code is the source of truth. Verify before assuming.

## 2. Verified frontend stack

- React 19, React DOM 19, Vite 8 (`@vitejs/plugin-react`, `@tailwindcss/vite`)
- React Router DOM 7 (`createBrowserRouter`, `NavLink`, `Outlet`, `useNavigate`)
- Tailwind CSS 4 (`@import "tailwindcss";` in `src/index.css`, no tailwind.config file)
- `lucide-react` for icons (a few layouts/toggles use inline SVG; keep them)
- `axios` via `src/ApiClient/interceptor.js` (`baseURL` `http://localhost:2000`, `withCredentials: true`)
- `react-hot-toast` and a custom `ToastProvider` (see Section 6)
- Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
- Dark mode: `.dark` class on `<html>` via `@custom-variant dark (&:where(.dark, .dark *));`, controlled by `ThemeContext` (persisted in `localStorage` key `theme`)
- Provider order in `main.jsx`: `ThemeProvider` > `AuthProvider` > `ToastProvider` > `App`

## 3. Routes and layouts (do not restructure)

**Public** (`Layout`: sticky `Navbar` + page + `Footer`, wrapped in `PublicRoutes`): `/`, `/login`, `/signup`

**Owner** (`ProtectedRoutes requiredRole="owner"` > `OwnerLayout`):
`/owner/dashboard` (Overview), `/owner/properties` (Properties & Units), `/owner/tenants` (Tenants), `/owner/rent` (Rent & Transactions), `/owner/documents` and `/owner/documents/:propertyId` (Documents)

**Tenant** (`ProtectedRoutes requiredRole="tenant"` > `TenantLayout`):
`/tenant/dashboard`, `/tenant/rent`, `/tenant/documents`, `/tenant/documents/:propertyId`, `/tenant/profile`

**Sign out:** `/sign-out` (any authenticated user)

### Layout shells

- **OwnerLayout:** root `flex h-screen h-dvh w-full flex-col overflow-hidden`; header `h-16 sm:h-20`, `z-30`, white / `dark:bg-[#1B1B1B]`; sidebar `md:w-64` (mobile: fixed drawer `w-[min(18rem,85vw)]`, `z-40`, with `bg-black/40` backdrop); content `<main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-[#f2f2f1] dark:bg-[#101010]">`.
- **TenantLayout:** root `h-dvh overflow-hidden`; header `fixed inset-x-0 top-0 z-50 h-16 sm:h-20`; sidebar fixed below header (`md:w-64`); content `mt-16 h-[calc(100dvh-4rem)] sm:mt-20 sm:h-[calc(100dvh-5rem)] md:ml-64 overflow-y-auto`.
- **Public Layout:** `flex min-h-screen flex-col`.
- Header logo everywhere: yellow rounded "R" badge (`bg-yellow-300 text-black rounded-lg`) + "RentGuard" text.
- Active nav item: `bg-yellow-300 font-medium text-black shadow-sm`; inactive: `text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#292929]`.

### Scrolling rule

Only the layout's `<main>` owns vertical scrolling. Never add `h-screen`, `h-dvh`, `overflow-y-auto`, or `overflow-y-scroll` to a page's outer wrapper unless a separate scroll region is genuinely required. Wide tables use `overflow-x-auto`. The month dropdown uses `.month-dropdown-scroll` (`max-height: 200px`). Before touching scrolling, read `OwnerLayout`/`TenantLayout`, the page, `index.css`, and `scrollbar.css` together.

## 4. Design tokens and component patterns (copy these)

### Colors

| Use | Light | Dark |
|---|---|---|
| App background (owner/tenant) | `#f2f2f1` | `#101010` |
| Public home background | `#F8F7F2` | `#101010` |
| Surface (header, sidebar, cards, modals) | `white` | `#1B1B1B` |
| Public navbar/footer surface | `white` | `neutral-950` |
| Body text | `#171717` | `#F1F0ED` |
| Borders | `border-black/10`, `border-[#E7E3DA]`, `border-gray-200/300` | `#373737`, `stone-700/800` |
| Hover surface | `gray-100` | `#292929` |
| Input background (dark) | — | `#262626` |
| Primary accent | `yellow-300` (also `yellow-400` buttons) | `yellow-300` / `#F7C744` on login submit |
| Error text | `red-600/700` | `#FF8F86` (forms) or `red-300` |
| Success / error banners | `green-50`/`red-50` with matching 700 text | `green-950`/`red-950` with 300 text |

### Typography

Default Tailwind sans stack. Page titles: `text-3xl font-medium tracking-tight sm:text-4xl`. Card numbers: `text-2xl font-medium tracking-tight`. Form labels: `mb-2 block text-sm font-normal`. Helper/error text: `mt-1 text-xs`. Do not add custom fonts.

### Shape and spacing

Existing UI mixes `rounded-xs` (primary action buttons), `rounded-lg` (nav items, login button), `rounded-xl` (inputs), `rounded-2xl` (modals), `rounded-full` (pills, theme toggle). Use whatever the **neighboring element of the same type** uses. Compact spacing, subtle borders, muted secondary text.

### Buttons

- Primary: `rounded-xs bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50` (large variant: `bg-yellow-300 px-5 py-3 font-medium text-black hover:bg-yellow-400`)
- Auth submit: `w-full rounded-lg bg-yellow-300 px-4 py-3 font-semibold text-black transition hover:bg-yellow-200 focus:ring-2 focus:ring-offset-2 dark:bg-[#F7C744] disabled:opacity-60`
- Secondary / header: `rounded-full border border-gray-300 ... hover:bg-gray-100 dark:border-stone-700 dark:hover:bg-[#292929]`
- Destructive: `bg-red-600 hover:bg-red-700 text-white`
- Always keep `disabled:` states and `focus-visible:ring-2 focus-visible:ring-yellow-400` on interactive elements.

### Inputs

`w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-60 dark:border-stone-800 dark:bg-[#262626] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-yellow-400/20`

### Status badges

`bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300` (success/paid), `bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300` (overdue/error). Match the same badge pattern for pending/other states already used in the page you are editing.

### Shared components (reuse, never duplicate)

- `common/ConfirmModal.jsx` — confirmation dialogs (`fixed inset-0 z-[90]`, `bg-black/55 backdrop-blur-sm`, `rounded-2xl`, Esc to cancel, loading spinner)
- `common/ToastProvider.jsx` — custom toast (`z-[100]`, top-right)
- `components/ThemeToggle.jsx`, `Navbar.jsx`, `Footer.jsx`
- Z-index scale in use: header `z-30`, sidebar/backdrop `z-40`, tenant header `z-50`, modal-level overlays `z-[60]`+, `ConfirmModal` `z-[90]`, toasts `z-[100]`. Keep new overlays within this scale.

### Dark mode, motion, accessibility

Every new element needs both light and `dark:` styling. Keep `transition` utilities as used elsewhere. Respect `prefers-reduced-motion` (see `index.css`, `scrollbar.css`, and `.hero-enter` in `Hero.jsx`). Preserve `aria-*` labels, `role` attributes, and keyboard focus rings.

### Scrollbars

Custom thin scrollbars live in `scrollbar.css` (light/dark variants) and `.month-dropdown-scroll` in `index.css`. Do not edit them unless asked.

## 5. Owner dashboard behavior

`GET /dashboard/owner` with `month` and `year` query params. Shows: financial overview (total, collected, pending, overdue rent), property overview (properties, total/occupied/available units, active tenants), recent payments, recent tenants. Money uses `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })`; dates use Indian locale. Do not change API paths, response shapes, or property names without verifying the backend contract.

## 6. Validation and notifications

Current reality (verified):

- `main.jsx` mounts the custom `ToastProvider` (`useToast`).
- `App.jsx` mounts one react-hot-toast `<Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: "8px", padding: "12px 16px" } }} />`.
- `Property.jsx`, `Rent.jsx`, `Documents.jsx`, and `Tenant.jsx` use react-hot-toast; `Tenant.jsx` also uses `useToast`.

Rules:

- Use the toast system already used by the file you are editing. Do not add another `<Toaster />`, another provider, or switch a file from one toast system to the other unless asked.
- Show field-level errors next to inputs (`mt-1 text-xs text-red-600 dark:text-[#FF8F86]`) and use toasts for operation success/failure.
- Validate on submit and clear errors as fields change. Keep existing loading, retry, accessibility, and server-error behavior.
- Format checks for sensitive identifiers validate format only; never claim they verify authenticity.

## 7. API and error handling

- Use `apiClient` from `ApiClient/interceptor`; follow existing conventions. Auth state comes from `AuthContext` (`/auth/login`, `/auth/me`, cookie-based).
- Preserve loading states and cleanup. Handle null/absent fields defensively. Do not silently swallow failures.
- Do not log secrets, tokens, passwords, personal identifiers, or full sensitive payloads. (Existing `console.log` calls in the interceptor and `ThemeContext` are legacy; leave them unless asked.)
- Do not invent endpoints or response fields.

## 8. Accessibility and responsive behavior

Preserve semantic HTML, labels, focus indicators, mobile menu open/close, and usable tables/forms on narrow screens (min body width 320px). Breakpoints in use: default (mobile), `sm`, `md` (sidebar becomes static/fixed), `lg`.

## 9. Working agreement for agents

Before editing: inspect the component, its parent layout, related CSS, and neighbors; pick the smallest safe change; verify field names, API contracts, routes, and installed packages; reuse existing shared components.

While editing: preserve unrelated behavior and visuals (Section 0); follow current React/Tailwind patterns; no broad CSS changes for page-specific issues; never replace a full file with a simplified version; do not claim tests/builds passed unless actually run.

After editing: summarize files changed and why; state commands the user must run (only if needed); call out assumptions; run `npm run lint` and `npm run build` when possible and report real results; confirm no unrequested UI changes.

## 10. Backend facts (for context only)

Backend lives in `Backend/` (Express + MongoDB, Mongoose models: user, property, unit, tenant, rent, payment, propertyDocument; Cloudinary uploads, Razorpay, Swagger). Frontend tasks must not require backend contract changes unless the user asks.

## 11. Known quirks — leave as is unless asked

- `Navbar.jsx` has stray attributes on the authenticated "Sign Out" `<Link>` (`border-grayborder border-gray-200`) and a `font-bold font-` class fragment. Do not "fix" these as part of unrelated work.
- `TenantLayout` Documents nav path is `/tenant/documents/:propertyId`, while `OwnerLayout` uses `/owner/documents`.
- Tenant header buttons ("Sign Out", "Profile") are styled differently from the owner header's rounded-full Sign Out button.
- `Hero.jsx` contains its own inline `<style>` block (`.hero-enter`) and a `bg-[#F8F7F2]` background distinct from the app's `#f2f2f1`.
- `Login.jsx` uses `/login.jpg` as a background image and `rounded-2xs`; keep public auth pages' look as is.
- `public/` assets (`RentGuard.png`, `RentGuard-Hero.png`, `login.jpg`, `signup.jpg`, `house.png`) are referenced by name; do not rename or replace them.

## 12. Maintaining this file

Update this guide only with verified facts. When the user approves a deliberate UI change, update Sections 3 and 4 so the new look becomes the standard. Never put secrets, credentials, production data, or personal information in this file.