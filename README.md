# RentGuard

A rental management platform for property owners and tenants. Owners manage properties, units, tenants, bills and documents. Tenants sign in with an email OTP, view and pay their bills online, raise maintenance complaints, and request move-out.

**Live app:** https://rent-guard-1.vercel.app
**API docs (Swagger):** `/api-docs` on the backend (through the app: `/api/api-docs`)

---

## Features

### Owners
- Sign up and sign in with an email OTP (no passwords).
- Create and manage **properties** and **units** (available, occupied, maintenance).
- Register **tenants** into units and view active tenants and tenant history.
- Create and edit **bills** for tenants (rent, electricity, water and other charges) with due dates.
- See **payments** per property and download **PDF receipts**.
- Approve or reject tenant **move-out requests**. Approval is blocked while the tenant has unpaid or pending bills.
- Upload and manage **documents** for a property or for a tenant.
- Review **maintenance complaints** and update their status.
- Owner dashboard with units, tenants and collection summary.

### Tenants
- Sign in with an email OTP.
- View unpaid bills, select the bills to pay and pay online with **Razorpay**.
- Payment history and **PDF receipts**.
- Upload and download personal **documents**.
- Raise and track **maintenance complaints**.
- Submit a **move-out request**.
- Update profile and profile picture.
- Email notifications for tenancy and payment events.

### Platform
- Role-based access (owner, tenant) with session cookies that end immediately on move-out.
- Rate-limited OTP login and registration.
- Bills are **reserved** for 15 minutes while an order is being paid, so the same bill cannot be paid twice.
- Contact form, backend health check and Swagger documentation.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, React Hot Toast, Lucide icons |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB (a replica set is required, see Setup) |
| Auth | Email OTP (HMAC-hashed, 5 minutes), JWT in an httpOnly cookie |
| Payments | Razorpay (order, signature verification, payment fetch) |
| Email | Brevo transactional email API |
| Files | Cloudinary and Multer for uploads, PDFKit for receipts |
| Hosting | Vercel (frontend), Render (backend) |

---

## Architecture and deployment

```
Browser ──► Vercel (React SPA)
              │  /api/*  (rewrite, see Frontend/vercel.json)
              ▼
           Render (Express API) ──► MongoDB, Razorpay, Cloudinary, Brevo
```

- The frontend calls the API through the relative path `/api`. `Frontend/vercel.json` rewrites `/api/*` to the Render service and sends every other path to `index.html` (single-page app).
- Because requests go through the Vercel domain, the session cookie is first-party.
- The backend allows CORS only for `https://rent-guard-1.vercel.app`.
- `GET /` on the backend returns a health response.

### Deploy the frontend (Vercel)
1. Import the repository and set the **root directory** to `Frontend`.
2. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. Add the environment variable `VITE_RAZORPAY_KEY_ID`.
4. Update the Render URL in `Frontend/vercel.json` if the backend URL changes.

### Deploy the backend (Render)
1. Create a **Web Service** from the repository with root directory `Backend`.
2. Build command `npm install`, start command `npm start`.
3. Add the environment variables listed below.
4. Set `NODE_ENV=production` and `TRUST_PROXY=1`, so cookies are secure and rate limits see real client IPs.
5. On Render's free plan the service sleeps when idle, so the first request after a break can be slow.

---

## Project structure

```
RentGuard/
├── Backend/
│   ├── app.js                 Express app, CORS, routes, health check, Swagger
│   ├── server.js              DB connection and server start
│   └── src/
│       ├── config/            policy (OTP, session, rate limits), db, cloudinary
│       ├── controllers/       user, tenant, property, unit, bill, order, payment,
│       │                      propertyDocument, maintenance, dashboard, contact
│       ├── models/            User, Tenant, Property, Unit, Bill, Order, Payment,
│       │                      PropertyDocument, Maintenance, Otp
│       ├── routes/            one router per controller
│       └── utils/             auth/session, OTP, rate limiters, email, receipts,
│                              cleanup job
├── Frontend/
│   ├── vercel.json
│   └── src/
│       ├── ApiClient/         Axios instance (baseURL /api)
│       ├── context/           AuthContext
│       ├── common/            layouts and shared components
│       └── pages/             auth, Owner, Tenant, About, Contact, Hero
└── PROJECT_SPEC.md            design decisions, rules and status
```

---

## Getting started (local)

### Prerequisites
- Node.js 18 or later
- A MongoDB **replica set** (MongoDB Atlas works). Order creation and payment verification use transactions, which a standalone local `mongod` does not support.
- Accounts and keys for Razorpay (test mode), Cloudinary and Brevo

### 1. Clone and install
```bash
git clone https://github.com/harneetsingh46/RentGuard.git
cd RentGuard
cd Backend && npm install
cd ../Frontend && npm install
```

### 2. Environment variables

**`Backend/.env`**

| Variable | Purpose |
|---|---|
| `PORT` | Port for the API (for example `5000`) |
| `MONGO_URL` | MongoDB connection string (replica set) |
| `JWT_SECRET_KEY` | Secret for session tokens |
| `OTP_SECRET_KEY` | Secret used to hash OTPs |
| `NODE_ENV` | `development` or `production` |
| `TRUST_PROXY` | `1` when behind a proxy (Render) |
| `BREVO_API_KEY` | Brevo API key for emails |
| `BREVO_FROM_EMAIL` | Verified sender address in Brevo |
| `RAZORPAY_KEY_ID` | Razorpay key id |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**`Frontend/.env`**

| Variable | Purpose |
|---|---|
| `VITE_RAZORPAY_KEY_ID` | Razorpay key id (public) |

Never commit `.env` files or secrets.

### 3. Point the frontend at your local API
The frontend calls `/api`, which on Vercel is rewritten to Render. For local development add a proxy to `Frontend/vite.config.js`:

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // your PORT
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```
With the proxy, the browser talks only to the Vite server, so the production-only CORS setting is not involved.

### 4. Run
```bash
# terminal 1
cd Backend && npm run dev

# terminal 2
cd Frontend && npm run dev
```
Open the URL printed by Vite. In development the OTP email is sent through Brevo, so a valid `BREVO_API_KEY` and sender are needed to sign in.

---

## Authentication flow

1. The user enters their email and requests an OTP. The reply is the same whether or not the email is registered.
2. The OTP is 6 digits, stored only as an HMAC hash, valid for 5 minutes, single use, and locked after 5 wrong attempts.
3. If one email belongs to several accounts (for example an owner and a tenant), the user chooses which one to enter.
4. A session cookie is issued: 1 day for owners, 7 days for tenants. Move-out or an account change ends the session at once.
5. Unverified owner signups are deleted after 24 hours if they own no property.

## Payment flow

1. The tenant selects unpaid bills and creates an **order**. The selected bills are reserved inside a transaction and the order expires after 15 minutes.
2. The backend creates a Razorpay order for the total.
3. After checkout the backend verifies the signature, fetches the payment from Razorpay, checks order id, currency, amount and captured status, then marks the bills and order paid in one transaction. Repeating the request is safe.
4. The tenant and the owner can download a PDF receipt, and confirmation emails are sent.

---

## API overview

| Prefix | Main endpoints |
|---|---|
| `/auth` | `POST /request-otp`, `POST /verify-otp`, `GET /me`, `POST /logout` |
| `/user` | `POST /register` (owner), `GET /get-user`, `PUT /update-profile` |
| `/property` | `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| `/property/:propertyId/units` | create, list, get, update, delete units |
| `/property/:propertyId/...` | `POST /units/:unitId/tenants` (register tenant), `GET /tenants`, `GET /tenants/history`, `GET`/`PUT /tenants/:tenantId`, `GET /move-out-requests`, `PATCH /move-out-requests/:tenantId/approve` |
| `/tenant` | `GET /me`, `GET /dashboard`, `PUT /me/update`, `POST /me/profile-picture`, `POST`/`GET /me/move-out-request`, `POST /logout` |
| `/bill` | `POST /:propertyId/units/:unitId/tenants/:tenantId`, `GET /:propertyId`, `GET`/`PUT /:propertyId/:billId`, `GET /:propertyId/:billId/receipt` |
| `/order` | `GET /unpaid-bills`, `POST /create`, `GET /my-orders` |
| `/payment` | `POST /:orderId/order`, `POST /verify`, `GET /my-payments` (+ receipt), `GET /property/:propertyId` (+ receipts) |
| `/document` | owner and tenant upload, list, download and delete (`/mine` for the tenant's own documents) |
| `/maintenance` | `GET /my-complaints`, `GET /owner-complaints`, `GET /complaint/:id`, `PATCH /complaint/:id/status` |
| `/dashboard` | `GET /owner` |
| `/contact` | `POST /` |

Full request and response details are in Swagger at `/api-docs`.

---

## Data model

- **User**: owners only (username, email, phone, verification and session version).
- **Tenant**: one record per tenancy (owner, property, unit, contact details, move-in and move-out dates, move-out request). A returning tenant gets a new record and the old one stays as history.
- **Property**, **Unit**: owned properties and their units.
- **Bill**: a charge for a tenant, with a payment status (unpaid, reserved, paid).
- **Order**: the bills selected for one payment, with an expiry.
- **Payment**: the Razorpay payment for an order.
- **PropertyDocument**, **Maintenance**, **Otp**.

---

## Known limitations and roadmap

- The Razorpay **webhook** is currently disabled, so a payment is recorded only when the checkout returns to the app.
- Pending orders are not yet cancelled or released automatically when abandoned or expired, and there is no failed-payment retry rule.
- Monthly reports, cash or partial payments, and overdue handling are not built yet.
- The legacy `Rent` model still exists and is not used by the payment flow.
- Local development needs the Vite proxy above, because the CORS origin is fixed to the production domain.

More detail on decisions, rules and status is in [`PROJECT_SPEC.md`](./PROJECT_SPEC.md).

---

## Author

Built by [harneetsingh46](https://github.com/harneetsingh46).
