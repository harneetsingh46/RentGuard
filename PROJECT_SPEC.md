# RentGuard: Project Spec and Status (living document)

> **Last updated:** 2026-11-06 (repo read at commit 4bcca1d + step1-fixes applied)
> **Repo:** https://github.com/harneetsingh46/RentGuard (Backend/ and Frontend/)
> **Purpose of this file:** a single source of truth so any AI assistant or developer can understand what RentGuard is, what we are changing, what is already decided, and what is left. **Read it fully before answering or writing code. Update it whenever a decision or the status changes** (see section 14).

---

## 0. Quick summary (read this first)

RentGuard is a MERN rental-management app (owners manage properties, units, tenants, rent, payments, documents).
We are redesigning it:

1. **Login is OTP-only for owners AND tenants.** No passwords anywhere.
2. **Tenants are no longer Users.** `User` = owners only. A tenant is a `Tenant` record (one record per tenancy) identified by email/phone.
3. **The `Rent` model, controller and route are removed.** Everything becomes a **`Bill`** with a **`Category`** (Rent, Electricity, Water, Maintenance, Other). Rent is a bill with `isRent: true`.
4. **Tenants pay by selecting bills** (for example 2 of 4). The server creates an **`Order`** for the selected bills, and **`Payment`** records are created per order (one per attempt) and paid through Razorpay.
5. **Failure handling:** first failure gives **Retry (once) or Cancel**. After a second failure the order **stays open and only Cancel is available**. Cancelled orders stay visible in the owner's payment history.
6. **Receipts (PDF)** can be downloaded right after payment and later from stored payment records.
7. **Monthly reports** for owners and for tenants (screen, PDF, CSV).
8. **Documents:** owners and tenants can both upload (already implemented in the repo; only the login identity changes).

**Current focus:** close the payment gaps (webhook, cancel and expiry release, failure rules), Bill guards, owner payment history, reports and the dashboard.
**Parked:** tenant registration (see section 6). Do not finalize it until the project owner reopens it.

---

## 1. Collaboration rules for assistants

1. **Do not re-open decided items** (section 4). If something looks wrong, say so briefly and ask.
2. **Stay concise and practical.** The project owner wants step-by-step guidance, no fluff, one clear answer.
3. **Test rules before delivering code.** We validate rules with small simulations first (see section 11), then write real code.
4. **Keep the repo's conventions** (section 3). Do not rewrite unrelated code.
5. **Never expose full Aadhaar numbers in API responses.** Mask to the last 4 digits.
6. **Never put secrets in the repo** (JWT secret, Razorpay keys, OTP secret).
7. **When you finish something, update sections 4, 12 and 14 of this file.**
8. Nothing in this file has been applied to the repo unless section 12 says so.

---

## 2. Glossary

| Term | Meaning |
|---|---|
| Owner | A `User`. Owns properties and units, creates bills. |
| Tenant | A `Tenant` record. Not a User. Logs in with OTP using the email/phone stored on the record. |
| Tenancy | One `Tenant` record = one stay of one person in one unit under one owner. A returning tenant gets a **new** record; the old one stays as history. |
| Active tenancy | `isActive: true`. Only active tenancies can log in or be billed. |
| Bill | A charge for a tenant in a month (rent, electricity, and so on). |
| Order | A Razorpay order covering one or more selected bills. |
| Payment | One payment attempt (online) or one cash record. Holds receipt data. |
| Open order | An order with status `created` or `failed`. |
| Remaining | `amount - paidAmount` for a bill. |

---

## 3. Repo baseline (read on 2026-11-04; the status table in section 12 is the current state)

**Stack:** Express (ES modules) and Mongoose; JWT in an httpOnly cookie `token` (1 day); `cookie-parser`; `cors` for `http://localhost:5173`; Razorpay; `pdfkit` (receipts); `multer` and Cloudinary (uploads); `bcryptjs` (to be removed with passwords). Frontend: React, Vite, Tailwind, `react-router-dom`, `react-hot-toast`, `lucide-react`.

**Backend** (`Backend/src`): `controllers/` (user, property, unit, tenant, rent, payment, propertyDocument, dashboard, bill (work in progress), category (work in progress)), `models/`, `routes/`, `utils/` (genToken, protect, uploadToCloudinary, updateOverdueRents, ...), `config/`.

**Frontend** (`Frontend/src`): `pages/auth` (Login, Signup), `pages/Owner/*` (Tenant, Rent, ...), `pages/Tenant/*` (TenantDashboard, TenantRent, TenantProfile, TenantDocument, Maintenance), `common/`, `context/AuthContext.jsx`, `ApiClient/interceptor`.

**Conventions to keep:** JSON responses as `{ message, data }`; controllers use `try/catch` and return 500 with a message; duplicate-key errors (code 11000) map to 409; ownership is checked in every owner controller (`Property.findOne({ _id, owner: req.user._id })`).

**Features that exist today and must keep working:**
- Auth and profile (owner and tenant), logout.
- Property and Unit CRUD (unit status: available, occupied, maintenance).
- Tenant: register, list active, get one, update, history, move-out, profile picture, tenant dashboard.
- Rent: one per tenant per month; the unit must be occupied; due date editable until paid; overdue job (`updateOverdueRents`); owner dashboard (units, active tenants, collected, overdue).
- Payments: Razorpay order for the remaining amount; verify (signature, fetch payment from Razorpay, amount check, captured status, duplicate-safe); partial status; webhook; PDF receipt; payment lists.
- Documents: owner uploads (property level and per tenant), tenant uploads own documents, signed download URLs, delete.
- Maintenance page on the tenant side is UI only (not connected to the backend). Out of scope for now.

**Known problems in the repo:**
1. `bill.controller`: uses `propertyId` that is never defined, does not import `Property`, calls `Rent.findOne({ billName })`, has a `message.error` typo, and `getBills` returns **every owner's bills** (no owner filter).
2. `category.controller`: imports from `../model/` (folder is `models`), returns `data.categoryName` (field is `category`), any logged-in user can create categories.
3. Bill and Category routes are not mounted in `app.js`.
4. The current `Bill` model is only a template (name, amount), so it cannot be a per-tenant bill.
5. No rate limiting and no `helmet`.
6. `moveOutTenant` disables the tenant's User login (replaced by tenancy-level checks in the new design).

---

## 4. Decisions log

### Decided
| # | Decision |
|---|---|
| D1 | **Bills replace Rent completely.** Rent is a category (`isRent: true`). Remove `rent.model`, `rent.controller`, `rent.route`, and the `/rent` mount. |
| D2 | `Timeline` in the diagram means the **billing period** (`month`, `year`, `dueDate`). No status-history array on bills. |
| D3 | **OTP login for both owners and tenants.** No passwords. One login box (email or phone), a role chooser if one contact has several roles. |
| D4 | `User` = owners only. Tenants are `Tenant` records and are not Users. |
| D5 | **Tenant selects bills to pay** (any subset). Order amount = sum of **remaining** amounts of the selected bills, computed on the server. |
| D6 | **One open order per tenant** at a time. The same selection returns the same open order. A different selection is rejected until the open order is paid or cancelled. |
| D7 | Payment records are created **per order, one per attempt** (attempt 1, attempt 2). |
| D8 | **Failure is confirmed by the server with Razorpay**, never trusted from the browser. |
| D9 | **First failure:** tenant chooses **Retry (once) or Cancel**. **Second failure:** the order **stays open** (`status: failed`, `retried: true`) and **only Cancel is available**. |
| D10 | **Cancel:** order becomes `cancelled`, bills are freed, and the order appears in the owner's payment history with `cancelledBy` and `cancelReason`. |
| D11 | **Late payment on a cancelled or expired order is NOT refunded automatically.** It is saved as `needs_refund` (bills untouched, not counted as collected). The owner handles it manually. |
| D12 | **Receipts:** PDF, available immediately after payment and later from stored payment records. Receipt data is a **snapshot** stored on the Payment. Receipt number `RG-YYYY-NNNNNN`, unique, from an atomic counter. Both the tenant (own payments) and the owner (own tenants' payments) can download. |
| D13 | **Cash payments** are recorded by the owner as a `Payment` with `method: cash` (partial allowed, never above remaining). Recording cash cancels an open order that contains that bill. |
| D14 | **Monthly reports:** owner report (all properties or one) **and a tenant monthly statement**. On screen, PDF and CSV. Definitions in section 8. |
| D15 | **Documents:** owner and tenant can both upload (existing repo functions); only the identity source changes. |
| D16 | OTP rules: 6 digits, stored as HMAC hash, 5-minute expiry, single use, 5 wrong tries kill the code, 60-second resend wait, limit per IP, **same reply for known and unknown contacts**. A new request replaces the previous OTP. |
| D17 | **OTP channel: email only** (decided 2026-11-05). Sent with nodemailer through Gmail (`EMAIL_USER`, `EMAIL_PASS`). There is no phone or SMS login. For production use a transactional mail provider (Gmail has daily send limits). |
| D18 | **Move-out with unpaid bills is decided later.** `BLOCK_MOVEOUT_WITH_UNPAID_BILLS = false` (allowed) until decided. |
| D19 | **Owner account recovery** (lost email and phone) is decided later. |
| D20 | **Move-out behaviour:** the tenancy becomes inactive, the unit becomes available, the tenant's session ends immediately (`tokenVersion` bump). Open orders are left alone; a payment arriving later is still applied if the order is open. |
| D21 | **Session length:** owners 1 day, tenants 7 days (implemented in `config/policy.js`). |
| D22 | **OTP limits as implemented** (differ from the earlier proposal): resend wait 10 s, 20 requests per contact per hour, 30 per IP per hour, 30 verify attempts per IP per hour. *Confirm, or return to 60 s and 10 per hour.* |
| D23 | **Account chooser (backend):** `verify-otp` returns `requiresAccountSelection` plus an account list; the client resubmits contact, OTP, `role` and `accountId`. The OTP is consumed only on the final submit. Account selection refunds the attempt counter so the user is not locked out. |
| D24 | **Bill reservation (implemented, replaces D6 and A1):** creating an Order reserves the selected bills inside a transaction (`paymentStatus: reserved`, `reservedByOrder`). An Order lasts 15 minutes (`expiresAt`). A bill can be in only one order. Bills are `unpaid`, `reserved` or `paid`. |
| D25 | **Receipts** are generated as PDF on demand from the Payment and Order for both the tenant and the owner. |
| D26 | **Tenant Maintenance Complaints:** Tenants submit maintenance requests (title, category, priority, description, optional photo). Automatically linked to their owner, property, and unit. Owner receives email notification and manages status (Pending, In Progress, Resolved, Rejected) with remarks. |

### Assumed (not objected to; confirm when convenient)
| # | Assumption |
|---|---|
| A1 | Open orders **expire after 60 minutes** (`cancelledBy: system`, `cancelReason: expired`) so an abandoned checkout cannot block a tenant. |
| A2 | Overdue status is refreshed by a job (and when the dashboard loads). A partially paid bill that is past due returns to `overdue` on the next run. |
| A3 | No partial online payment of a single bill by the tenant; the tenant pays the remaining amount of each selected bill. Partial amounts come only from owner-recorded cash. |

### Parked: tenant registration
Not finalized. Proposed rules are in section 6.

---

## 5. Data model (target)

Unchanged models: **Property** (`owner`, `propertyName`, `address`), **Unit** (`property`, `unitName`, `unitType`, `rent`, `status`), **PropertyDocument** (`property`, `tenant` (null for property-level documents), `uploadedBy`, `documentName`, `documentType`, `fileUrl`, `cloudinaryPublicId`, `originalFileName`, `fileFormat`, timestamps).

### User (owners only)
`username` (unique), `email` (unique), `phone` (unique, required), `role` = owner, `isActive`, `verifiedAt` (null until the first OTP; unverified signups are deleted after 24 hours), `tokenVersion`. **No password.**

### Tenant (one record per tenancy)
`owner`, `property`, `unit`, `fullName`, `address`, `aadhaarNumber` (storage format open, see section 13), `email`, `phone` (10 digits), `tokenVersion`, `isActive`, `moveOutDate`, `profilePicture`, `profilePicturePublicId`, plus **contact status** (currently `contactVerified: Boolean` in the delivered code; proposed `contactStatus: pending | confirmed | declined`, part of the parked registration discussion).
**Indexes, active records only** (`partialFilterExpression: { isActive: true }`): unique `{ unit }`, unique `{ owner, aadhaarNumber }`, unique `{ owner, email }`, unique `{ owner, phone }`. Lookup indexes: `{ email, isActive }`, `{ phone, isActive }`.

### Category
`category` (unique). Fixed list: Rent, Electricity, Water, Maintenance, Other.

### Bill (replaces Rent)
`owner`, `tenant`, `property`, `unit`, `category`, `isRent`, `billName`, `description`, `amount` (> 0), `paidAmount` (>= 0, never above `amount`), `month`, `year`, `dueDate`, `status`: pending, partial, paid, overdue.
**Indexes:** unique `{ tenant, month, year }` **only where `isRent: true`**; `{ owner, status, dueDate }`; `{ tenant, status }`.

### Order
`tenant`, `owner`, `bills[]`, `amount`, `razorpayOrderId` (unique), `status`: created, failed, paid, cancelled; `isOpen` (true for created or failed), `failures`, `retried`, `cancelledBy` (tenant, owner, system), `cancelReason` (tenant_cancelled, expired, owner_recorded_cash), `cancelledAt`, `expiresAt`.
**Index:** unique `{ tenant }` where `isOpen: true` (one open order per tenant).

### Payment (one record per attempt, plus cash)
`order` (empty for cash), `tenant`, `owner`, `property`, `unit`, `amount`, `method` (online, cash), `attempt` (1, 2, 0 for cash or late payments), `razorpayOrderId`, `razorpayPaymentId` (unique, sparse), `razorpaySignature`, `status`: created, paid, failed, cancelled, needs_refund; `items[]` = snapshot `{ bill, billName, category, amount }`, `receiptNo` (unique, sparse), `paidAt`.
**Indexes:** `{ owner, createdAt }`, `{ tenant, createdAt }`, `{ owner, status, paidAt }` (reports).

### Otp
`contact` (unique), `hash` (HMAC), `attempts`, `expiresAt` (TTL index, auto-delete).

### Counter
Atomic sequence per year for receipt numbers.

### Migration mapping (old to new)
- Tenant Users: copy email and phone to `Tenant`; set `Tenant.owner` from the property's owner; then remove tenant Users.
- Owners: ensure a phone number exists.
- Rent becomes Bill (`isRent: true`, `paidAmount` kept).
- Each old Payment gets an Order, an `items` snapshot and a generated receipt number.
- Drop old indexes (`aadhaarNumber_1`, `user_1`) and any unique constraints that conflict.

---

## 6. Tenant registration (PARKED, proposal only)

Proposed flow: the owner picks an available unit and enters name, address, Aadhaar, email, phone. The server normalizes input (email lowercase; phone 10 digits starting 6 to 9, +91 removed; Aadhaar without spaces or dashes) and checks, in order:
1. The user is an owner who owns the unit's property.
2. Input is valid; Aadhaar is 12 digits and does not start with 0 or 1.
3. The unit is available.
4. The owner is not using their own email or phone for a tenant.
5. This owner has no **active** tenant with the same Aadhaar, email or phone.
6. **Cross-owner contact check:** no active tenancy at another owner has the same email or phone with a **different** Aadhaar (neutral message "contact unavailable").
7. The unique `{ unit }` index stops two requests racing for one unit.

Then the Tenant record is created, the unit becomes occupied, and the tenant gets an invitation (through the OTP channel).

Proposed **contact confirmation:** a new tenancy is `pending`. At first OTP login the contact holder sees only owner, property and unit, and must Accept or Decline. Decline marks it `declined` so the owner can fix the contact. A returning tenant with the same Aadhaar, email and phone as an earlier confirmed tenancy is confirmed automatically. Editing a contact resets to `pending` and ends the tenant's sessions. A contact is free again once its person has no active tenancy.

Same person under two owners is allowed. Reuse after move-out is allowed (a new record is created). **Open questions:** see section 13.

---

## 7. Business rules (target)

### OTP login and sessions
- Request: contact (email or phone) in, always the same reply. An OTP is created only if the contact belongs to an active owner or an active tenancy.
- Verify: if the contact has one role, issue a session; if several (owner plus tenancies), return a chooser; selecting something not in the list is rejected.
- Session: httpOnly cookie JWT with role, id, and `tokenVersion`. Every request re-checks the owner (active, version matches) or the tenant (tenancy active, version matches). Move-out, contact edits and "logout everywhere" bump `tokenVersion`.
- Owner signup is verified by OTP. A pending signup for the same email replaces an older pending one (no squatting). Signup for an active owner's email is rejected.
- Planned middleware: `requireOwner` (sets `req.user`) and `requireTenant` (sets `req.tenant`), replacing repeated `req.user.role` checks.

### Bills
- Created by the owner for an **active** tenant whose unit is occupied. Amount is greater than 0.
- Only one rent bill per tenant per month; other categories may repeat.
- Due date can be edited until the bill is paid. Amount cannot be edited if the bill is paid or inside an open order.
- Statuses: pending, partial, paid, overdue. Overdue job marks unpaid or partial bills past their due date.

### Orders and payments
- The tenant selects bills (not empty, no duplicates, all their own, not fully paid). Amount = sum of remaining.
- **State machine:** `created -> paid`; `created -> failed` (first failure) `-> created` (retry, once) `-> failed` (second failure, cancel only); `created or failed -> cancelled`.
- Retry reuses the same Razorpay order and creates a new Payment record (attempt 2).
- Verify and webhook keep the repo's checks: valid signature, fetch the payment from Razorpay, amount match, captured status; duplicate-safe by `razorpayPaymentId`.
- On success money is applied to the oldest due bill first; each bill becomes paid or partial; the Payment gets `items`, `receiptNo`, `paidAt`.
- A success arriving while the order is `failed` (for example a delayed UPI) is applied.
- A success for a cancelled or expired order, or when remaining amounts no longer match, is saved as `needs_refund` and changes no bill.
- Owner cash: partial allowed, never above remaining; cancels an open order for that bill (`cancelledBy: owner`).

### Reports (section 8), Documents, Move-out
- Documents: unchanged functions; tenant document access uses the tenancy from the session. A moved-out tenant loses access.
- Move-out: see D20. A moved-out tenant cannot log in and cannot create orders. The owner can still record cash for that tenant's unpaid bills.
- Guards: a unit's status cannot be changed, and a unit or property cannot be deleted, while it has an active tenant.

### Invariants (must always hold)
1. `bill.paidAmount <= bill.amount`.
2. `bill.paidAmount` equals the sum of that bill's `items` across **paid** payments.
3. A tenant has at most one open order.
4. A unit has at most one active tenant.
5. `needs_refund`, failed and cancelled payments are never counted as collected.
6. A receipt never changes after it is issued.

---

## 8. Monthly report definitions

**Owner report** (month, year, optional property):
- **Billed:** sum of bills whose `month/year` match.
- **Collected:** sum of **paid** payments whose `paidAt` is in that month (online plus cash).
- **Outstanding:** remaining amount on that month's bills (as of now). **Overdue:** the part that is overdue.
- **By category:** billed and collected per category (collected from payment `items`).
- **Counts:** failed attempts, cancelled orders, and the amount flagged `needs_refund`.

**Tenant statement** (month, year): that tenancy's bills for the month, payments made in the month, and the balance.
Both are available on screen, as PDF, and as CSV. A payment made in a later month reduces outstanding but is not counted as collected in the earlier month.

---

## 9. Planned API (names may adjust)

- `POST /auth/signup` (owner), `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/otp/select`, `POST /auth/logout`, `GET /auth/me`
- Bills: create, list (owner, tenant), update due date, record cash; categories: list, seed
- Payments: `POST /payment/orders`, `POST /payment/verify`, `POST /payment/orders/:id/failed` (server checks Razorpay), `POST /payment/orders/:id/retry`, `POST /payment/orders/:id/cancel`, `POST /payment/webhook`, `GET /payment/:id/receipt` (PDF), `GET /payment/history` (tenant), owner history with filters (includes cancelled and failed)
- Reports: `GET /report/monthly?month&year&property&format=json|pdf|csv` (owner), `GET /report/my-statement?month&year&format=...` (tenant)
- Jobs: expire open orders (60 min), overdue refresh

---

## 10. Files expected to change (about 30)

**Backend:** models (`tenant`, `user`, `bill` rewrite, `payment`, `category`, new `order`, `otp`, `counter`); controllers (`tenant`, `user`/auth, `bill` (replaces `rent`), `payment`, `propertyDocument` (tenant functions), `dashboard`, `category`, `unit`, `property`, new `report`); utils (`genToken`, `protect`, `updateOverdueRents`, new OTP and receipt helpers); routes (bill, category, auth/OTP, report, payment) and mounting in `app.js`; remove `rent.*`.
**Frontend:** `AuthContext`, `Login` (OTP and role chooser), `Signup` (owner only), `Owner/Tenant`, `Owner/Rent` (becomes bills), owner payment history and report pages, `TenantRent` (bill selection and payment, retry and cancel dialog), `TenantDashboard`, `TenantProfile`, `TenantDocument`, tenant statement page. `Maintenance` unchanged.

---

## 11. Validation done so far

Rules were simulated in code (not against the real repo) before writing real code:
- **62 cases:** owner and tenant OTP, role chooser, paying selected bills, one open order, failure, retry, cancel-only after second failure, expiry, late payments, receipts, cash payments, monthly report maths, invariants.
- **30 cases:** registration rules (normalization, duplicates, cross-owner contact binding, confirmation, contact edits, returning tenants, recycled numbers).
- Earlier suites covered bills, partial payments, overdue, dashboard totals, receipts and documents isolation.
- Rules were also broken on purpose to check the tests catch them. Misses were redundant safeguards or weak tests that were then strengthened.
**These do not replace tests against the real routes**, which must be written after the code exists.

---

## 12. Status (verified in the repo on 2026-11-06)

| Phase | Item | Status |
|---|---|---|
| 0 | Branch and database backup | Project owner to do |
| 1 | Models | **Done, with a different shape than planned.** User (owners), Otp, Tenant as planned. **Bill:** `paymentStatus` (unpaid, reserved, paid), `reservedByOrder`, `paidAt`, `startDate`, `endDate`; category is a fixed enum (rent, electricity, water, other); no `owner`, `paidAmount`, `isRent` or `description`; **no indexes**. **Order:** `items[{bill, amount}]`, `totalAmount`, status (pending, paid, failed, cancelled), Razorpay ids, `expiresAt`. **Payment:** one per order (unique), status (created, paid, failed), `paidAt`. No receipt number, no Counter. |
| 2 | Data migration | Not started |
| 3 | OTP login and sessions | **Done & Patched.** Email-only OTP through Gmail, atomic single-use consume, rate limits, 1-day and 7-day sessions, `tokenVersion`, backend account chooser. **`step1-fixes.patch` applied and refined**: atomic attempt spending upfront, unverified owner cleanup hourly job, registration rate limit, trust proxy support, and multi-account selection attempt refund. |
| 4 | Tenant module | Register (owner-scoped), move-out, profile, update profile, dashboard, picture done. Registration rules still **parked**. |
| 5 | Bills | Owner create, list, get, update, and the Owner Bill page done. **Bill.jsx connected with tenants** (bi-directional tenant/unit sync, tenant filter dropdown, payment status badges, URL deep links from Tenant page). Edit guard on `reserved` and `paid` bills implemented in `updateBill`. **Missing:** one-rent-per-month protection, overdue status, cash payment. |
| 6 | Payments | **Mostly done.** Tenant selects bills, Order created with reserved bills, Razorpay order, verify (signature, fetch from Razorpay, order id, currency, amount, captured, in a transaction, safe to repeat), tenant and owner PDF receipts, payment lists. **Missing:** webhook, cancel, expiry release, failed and retry rules, `needs_refund`, cash payments. |
| 7 | Monthly reports (owner and tenant) | Not started |
| 8 | Dashboard, overdue job, documents, maintenance | Documents done (owner and tenant pages). **Maintenance module backend & tenant form submission implemented** (`/maintenance/*`). **Dashboard still reads Rent.** |
| 9 | Safety guards (units, properties) | Not done |
| 10 | Frontend | Login, Signup, owner Property, Tenant, Bill, Documents, Dashboard, Profile, and tenant Dashboard, Bills (Razorpay checkout), Documents, Profile done. **Missing:** account chooser screen, owner payment history and reports, tenant statement. |
| 11 | End-to-end checks, Razorpay test mode, then live | Not started |

### Critical gaps (fix next)
1. **Reserved bills are never released.** An abandoned checkout, closed tab or expired order leaves the order `pending` and its bills `reserved` forever. The tenant cannot pay them again. Nothing sets an Order or Payment to `failed` or `cancelled`, and `expiresAt` is only checked when creating the Razorpay order. Needed: cancel endpoint, expiry job that releases bills, and the failure and retry rules (D9).
2. **No webhook.** `razorpayWebhook` was removed and the route is commented out. If a tenant pays and closes the tab, the money is captured but the bills stay reserved. Needed: an idempotent webhook that applies the same transaction as `verifyPayment`, with `needs_refund` when the order was cancelled or expired.
3. **Bills can be changed after payment.** (Resolved in `bill.controller.js`: `updateBill` now prevents modifying paid or reserved bills).
4. **Duplicate rent bills are possible.** There is no unique protection per tenant and month.
5. **Transactions need a MongoDB replica set** (Atlas has one). A standalone local `mongod` fails on order creation and payment verification.

### Other gaps
- Dashboard (14 references), `unit.controller` (3) and `updateOverdueRents` still use Rent; `rent.controller` and `rent.model` still exist.
- No owner cash or partial payment (Bill has no `paidAmount`).
- Frontend does not handle the account chooser (`requiresAccountSelection`).
- Registration cleanup: unverified owners are never deleted, and `/user/register` has no rate limit (fixed in the patch).
- Email send is awaited, so a registered contact answers slower than an unknown one, and a mail failure returns 503 only for registered contacts. Consider replying first and sending after.
- Debug `console.log` lines remain (fixed in the patch).

### OTP login: findings and `step1-fixes.patch`
Applied and enhanced on commit 4bcca1d:
1. **Attempt gate:** `verifyOtp` spends the attempt first with an atomic `findOneAndUpdate` (`attempts < MAX`, `$inc`), and the final consume no longer filters on `attempts`.
2. **`/user/register` limiter:** 10 per IP per hour (`REGISTER_PER_IP_PER_HOUR`).
3. **Cleanup of unverified owners:** hourly job deletes owners with `verifiedAt: null` older than 24 hours who own no property and have no active tenants. Started after DB connection.
4. **`TRUST_PROXY`:** supports boolean (`true`), numeric hop counts, or proxy strings.
5. Debug logs removed; deprecated `new: true` replaced by `returnDocument: "after"`.
6. Account chooser refunded attempt prevents accidental lockout when a user selects between multiple accounts.

---

## 13. Open decisions

1. **Failure rules (D9):** the retry-once and cancel-only rules are not built. With bill reservation, should a failed payment release the bills at once, or keep them reserved until the 15-minute expiry? (Recommended: failed attempt keeps the order open for retry once, then cancel releases the bills.)
2. **Categories:** keep the fixed enum (rent, electricity, water, other), or add Maintenance and a `Category` collection?
3. **Cash payments:** add `paidAmount` (partial cash) or only "mark as paid"?
4. **Refunds:** payments received for cancelled or expired orders are flagged `needs_refund` and handled by the owner manually (D11).
5. **OTP limits (D22):** keep 10 seconds and 20 per hour, or return to 60 seconds and 10 per hour?
6. "Log out of all devices": include?
7. **Parked (tenant registration):** confirmation card; shared contact; two units for one person; Aadhaar storage (full or last 4 plus hash); moving to another unit; `moveInDate`; "Register again" action.
**Later:** move-out with unpaid bills; owner account recovery; production mail provider.

---

## 14. Changelog (newest first; add a line for every change)

- **2026-11-06 (Owner Bill.jsx Connected With Tenant):** Connected `Bill.jsx` directly with tenants: bi-directional auto-sync between Tenant and Unit selection in the modal, added Tenant filter dropdown alongside Category, integrated live payment status badges (`Paid`, `In Checkout`, `Unpaid`), added URL deep-linking support (`/owner/bill?propertyId=...&tenantId=...`), added a direct "Bills" action button on tenant cards/rows in `Tenant.jsx`, and added edit guards on paid/reserved bills in `updateBill`.
- **2026-11-06 (Tenant Maintenance Backend):** Created `Maintenance` model, controller, and routes (`POST /maintenance/complaint`, `GET /maintenance/my-complaints`, `GET /maintenance/owner-complaints`, `PATCH /maintenance/complaint/:id/status`, `GET /maintenance/complaint/:id`). Automatically maps complaints to owner, property, and unit, sends notification email to owner, supports Cloudinary photo uploads, and connects tenant `Maintenance.jsx` form.
- **2026-11-06 (Step 1 Fixes applied):** Applied `step1-fixes.patch` and refined: atomic OTP verification race prevention, unverified owner cleanup with tenant safeguards, registration rate limit, robust `TRUST_PROXY` parsing, and multi-account chooser attempt refund. Updated Phase 3 in Section 12.
- **2026-11-06:** Repo re-read at commit 4bcca1d (5 new commits). Orders with bill reservation, Razorpay payments with verification and receipts, tenant UI, owner management pages and email OTP are in. Found 5 critical gaps (release of reserved bills, webhook, bill edit guard, duplicate rent, replica set). Built and tested `step1-fixes.patch` for OTP and signup. Added D24, D25; D17 now email-only. Status table rewritten.
- **2026-11-05:** Repo read at commit 7f309fb. OTP login and owner Bills were in. Ran the real code and found 3 OTP issues and broken tenant payments and documents (both since resolved by later commits). Added D21 to D23.
- **2026-11-04:** Spec file created. Consolidated all decisions. Parked tenant registration.
- **Before 2026-11-04:** Redesign agreed (D1 to D18). Phase 1 models designed.

