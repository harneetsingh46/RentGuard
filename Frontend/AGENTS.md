# RentGuard --- Agent Project Guide

## 1. Project purpose

RentGuard is a rental/property management web application. The known
product areas include property and unit management, tenant management,
rent and transactions, documents, and an owner dashboard.

This file is a working guide for AI coding agents. Treat the
repository's actual code as the source of truth. Some details below are
based on the project context available so far; verify assumptions in the
codebase before making broad changes.

## 2. Known frontend stack

-   React
-   React Router (`NavLink`, `Outlet`, `useNavigate`)
-   Tailwind CSS (Tailwind v4-style `@import "tailwindcss";`)
-   `lucide-react` for icons
-   An API client imported from `../../ApiClient/interceptor` in some
    page components
-   `react-hot-toast` is used or intended for toast notifications in
    parts of the project
-   Dark mode is implemented with a `.dark` class
-   CSS entry point imports `./scrollbar.css`

Do not assume additional libraries, build tools, backend technologies,
database schemas, or authentication flows without inspecting the
repository.

## 3. Known owner-area routes and layout

The owner layout includes these navigation areas:

-   Overview: `/owner/dashboard`
-   Properties & Units: `/owner/properties`
-   Tenants: `/owner/tenants`
-   Rent & Transactions: `/owner/rent`
-   Documents: `/owner/documents/:propertyId`

The owner layout uses a responsive top header, a sidebar, and React
Router's `<Outlet />` for page content. The header is fixed. The sidebar
is fixed and can scroll independently on small screens. The main page
content is intended to be the primary vertical scrolling region.

### Scrollbar/layout rule

Avoid introducing nested vertical scrolling unintentionally.

-   Keep the owner shell constrained to the viewport where appropriate
    (`h-dvh overflow-hidden` is currently used in `OwnerLayout`).
-   The main content region owns the main vertical scroll
    (`overflow-y-auto`).
-   The sidebar may have its own `overflow-y-auto` if its navigation is
    taller than the viewport.
-   Avoid adding `h-screen`, `h-dvh`, `overflow-y-auto`, or
    `overflow-y-scroll` to a page's outer wrapper unless the page
    genuinely needs a separate scrolling region.
-   Horizontal table scrolling (`overflow-x-auto`) is appropriate for
    wide tables.
-   The month selector dropdown can scroll independently using
    `.month-dropdown-scroll`.

Before changing global scrolling, inspect `OwnerLayout`, the page
component, `index.css`, and `scrollbar.css` together. Prefer fixing the
narrowest responsible component instead of changing global behavior.

## 4. Styling and design conventions

-   Use Tailwind utility classes for component styling.
-   Preserve existing responsive behavior and dark-mode styling.
-   Existing owner-area colors include light backgrounds such as
    `#f2f2f1`, white surfaces, yellow accents such as `bg-yellow-300`,
    and dark-mode backgrounds such as `#101010` and `#1B1B1B`.
-   Existing UI often uses subtle borders, rounded corners, muted
    secondary text, and compact spacing.
-   Use `lucide-react` for icons when consistent with the surrounding
    code.
-   Avoid redesigning unrelated screens while fixing a specific issue.

## 5. Owner dashboard behavior known so far

The owner dashboard fetches data from `GET /dashboard/owner` with
`month` and `year` query parameters. It presents:

-   Financial overview: total rent, collected rent, pending rent,
    overdue rent
-   Property overview: properties, total units, occupied units,
    available units, active tenants
-   Recent payments
-   Recent tenants

The dashboard formats money as INR using
`Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` and
formats dates for the Indian locale.

Do not change API paths, response shapes, or data property names without
verifying the backend contract and existing usage.

## 6. Validation and notifications

The project goal is to show clear, field-specific validation messages
near inputs and use toast notifications for operation success/failure
rather than printing success messages in the page.

When editing forms:

-   Inspect actual state variable names and API payload requirements
    before implementing validation.
-   Validate on submit and, where appropriate, update/clear errors as
    fields change.
-   Show field-level errors adjacent to the relevant controls.
-   Keep server/API errors understandable and actionable.
-   Use the project's existing toast setup if present. Do not add
    duplicate `<Toaster />` instances; check the app entry/root first.
-   If using `react-hot-toast`, confirm it is installed and that a
    single `<Toaster />` is mounted at the appropriate application
    level.
-   Do not remove existing loading, retry, accessibility, or
    server-error behavior while replacing inline notifications.

Any format checks for sensitive identifiers should only validate the
requested format; do not claim that format validation verifies the
identifier is genuine.

## 7. API and error-handling practices

-   Follow existing `apiClient` conventions and interceptor
    configuration.
-   Preserve loading states and cleanup behavior.
-   Do not log secrets, access tokens, passwords, personal identifiers,
    or full sensitive API payloads.
-   Handle absent/null response fields defensively, matching established
    patterns.
-   Do not silently swallow API failures.
-   Do not invent backend endpoints or response fields.

## 8. Accessibility and responsive behavior

-   Preserve semantic HTML and accessible labels.
-   Keep keyboard focus indicators for interactive elements.
-   Ensure mobile navigation can open and close and does not obscure
    usable content unexpectedly.
-   Respect reduced-motion preferences when adding animations or smooth
    scrolling.
-   Ensure tables and forms remain usable on narrow screens.

## 9. Working agreement for agents

Before editing: 1. Inspect the relevant component, its parent layout,
related CSS, and nearby components. 2. Identify the smallest safe change
that solves the request. 3. Verify actual field names, API contracts,
routes, and installed packages instead of guessing. 4. Check for
existing shared components/utilities before introducing duplicates.

While editing: 1. Preserve unrelated behavior and visual design. 2. Keep
changes consistent with the current React/Tailwind patterns. 3. Avoid
broad global CSS changes for page-specific issues. 4. Do not replace a
full file with a simplified example unless explicitly asked. 5. Do not
claim tests/builds passed unless they were actually run.

After editing: 1. Summarize the files changed and why. 2. Include any
commands the user must run (for example, installing a dependency) only
when necessary. 3. Call out assumptions or anything that still needs
verification. 4. If possible, run the project's available lint, test, or
build commands and report the real results.

## 10. Repository facts to discover

On first access to the repository, inspect and document: - Package
manager and scripts from `package.json` - Actual source tree and entry
points - Router definitions and protected-route/auth behavior - Backend
framework, API routes, models, and response contracts - Toast provider
setup and validation utilities - Existing design tokens and CSS
conventions - Test/lint/build commands - Environment variable names
(never copy actual secret values into this file)

Update this guide as verified project facts become available. Keep
secrets, credentials, production data, and personal information out of
this file.
