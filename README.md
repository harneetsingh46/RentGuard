# RentGuard – Rental Property Management Platform

**RentGuard** is a full-stack rental property management platform designed to simplify property management and improve communication between property owners and tenants.

It provides a centralized platform where property owners can manage properties, rental units, tenants, rental applications, bills, online and cash payments, documents, and maintenance requests. Tenants can discover available rentals, apply for units, manage their tenancy, pay rent and other bills, access receipts, upload documents, and submit maintenance complaints.

The platform also includes an administrative panel for managing users and verifying property owner accounts.

---

## Live Application

- **Live Website:** https://rent-guard-1.vercel.app
- **GitHub Repository:** https://github.com/harneetsingh46/RentGuard

---

## Table of Contents

1. [Features](#1-features)
2. [User Roles](#2-user-roles)
3. [Technology Stack](#3-technology-stack)
4. [Application Architecture](#4-application-architecture)
5. [Project Structure](#5-project-structure)
6. [Getting Started](#6-getting-started)
7. [Environment Variables](#7-environment-variables)
8. [Running the Application](#8-running-the-application)
9. [Application Workflows](#9-application-workflows)
10. [API Documentation](#10-api-documentation)
11. [Security](#11-security)
12. [Deployment](#12-deployment)
13. [Future Improvements](#13-future-improvements)
14. [Author](#14-author)

---

# 1. Features

## Authentication and Account Management

- Separate registration experiences for property owners and tenants.
- Email-based OTP authentication.
- Six-digit OTP verification with a 5-minute expiry.
- Up to 5 verification attempts per OTP and a 10-second wait before an OTP can be resent.
- Authentication, registration and contact-form rate limiting.
- JWT-based authentication (owner sessions last 1 day, tenant sessions 7 days).
- Secure HTTP-only authentication cookies.
- Role-based access control on the frontend and the backend.
- Protected application routes.
- User profile management.
- Profile picture uploads.
- Logout and session invalidation.
- Owner accounts that never verify their OTP are removed automatically after 24 hours (accounts that already have properties or tenants are never removed).
- Dark mode is the default theme, with a light theme toggle.
- One consistent toast notification style across all pages.

## Property Owner Dashboard

Owners get a centralized dashboard to manage their rental properties and tenants.

### Owner Verification

- New owners start in a pending state until an administrator approves them.
- Unverified owners can only see their profile and a Verification Status page.
- The Verification Status page shows the pending message or the admin's rejection reason, with a button to check the status again.
- Navigation items such as Overview, Properties, Tenants, Rent and Documents are hidden until the account is approved.
- The same restriction is enforced on the backend for every owner API route, not only in the interface.

### Dashboard Overview

- View rental statistics.
- Monitor properties and rental units.
- Track tenant information.
- View collection and maintenance summaries.
- **Needs your attention** section showing pending rental applications and pending move-out requests, with links that open the matching tab directly.
- Access property management features.

### Property Management

- Add new properties with structured address fields (address line 1, address line 2, city, state and a 6-digit pincode).
- View existing properties.
- Search properties by name, address, city or pincode.
- Update property information.
- Delete properties where permitted (a property with occupied units cannot be deleted).
- Manage multiple properties.
- Modals stay open when clicking outside, so entered data is not lost.

### Unit Management

- Create and manage rental units.
- Specify unit names and types.
- Set monthly rental amounts.
- Add a unit description.
- Add facilities using quick-pick chips (for example Parking, Wi-Fi, Lift, Furnished) or custom facilities.
- Upload up to 5 photographs per unit.
- Store unit images using Cloudinary.
- Preview, add and remove unit images.
- Search units, filter them by status and type, and browse them with pagination.
- Track unit availability.
- View unit details.
- Occupied units cannot be edited or deleted; only the View Tenant action is shown for them.

Supported unit statuses:

- Available
- Occupied
- Maintenance

### Tenant Management

- Register tenants directly with the **Add Tenant** option, from the Tenants page or from an available unit, without requiring an application.
- Associate tenants with properties and units.
- View active tenant records.
- View previous tenant history.
- Search active tenants and tenant history from inside each tab.
- Manage tenant information.
- Track tenant occupancy.
- View tenant-related bills and information.
- Upload a document for a tenant and open that tenant's documents directly afterwards.
- Manage move-out requests.

### Rental Application Management

- View rental applications submitted by tenants.
- Review applicant information.
- View requested property and unit details.
- Approve rental applications.
- Reject rental applications.
- Track application status.
- Review rental application history.

### Bill Management

- Create tenant bills.
- Manage monthly rent bills.
- Add electricity charges.
- Add water charges.
- Add other charges.
- Set bill due dates.
- Track bill payment status.
- **Record cash payments** against unpaid bills, with a received date and an optional note.
- View payment activity for online and cash payments.
- Download payment receipts.
- Manage tenant billing records.

### Document Management

- Upload property documents.
- Upload tenant-related documents.
- View documents uploaded by tenants.
- View uploaded documents.
- Download documents.
- Delete documents where permitted.
- Store uploaded files through Cloudinary.

### Maintenance Management

- View maintenance complaints.
- Filter complaints by status, priority, and property.
- View complaint details.
- View attached complaint photographs.
- Update complaint status.
- Add remarks to complaints.
- Receive email notifications for new complaints.

### Move-Out Management

- View tenant move-out requests with the requested last day and the request expiry.
- Review move-out requests.
- Approve move-out requests (blocked while bills are unpaid).
- **Reject move-out requests** with an optional reason; the tenant is notified by email.
- Update tenant and unit records through the move-out workflow.

---

## Tenant Dashboard

Tenants get their own dashboard to manage their rental activities.

### Rental Discovery

- Browse available rentals, with **one card per unit**.
- Each card shows the property name, location and owner.
- View unit types and rental prices.
- View unit descriptions and facilities.
- View multiple unit photographs in an image slider (arrows, dots, swipe and a counter).
- Open unit photographs using the full-screen image viewer.
- Search by property, address, unit, description or facility.
- Apply for available rental units.
- The Apply button shows **Applied** or **Approved** when a request already exists for that unit.

### Rental Applications

- Submit rental applications with a move-in date (past dates are blocked).
- Track application status.
- View approved or rejected applications.
- See a list of **all approved lease offers** in the dashboard overview.
- Accept or decline approved rental offers.
- Cancel applications where permitted.

### Bills and Payments

- View unpaid bills.
- View rent and additional charges.
- Select multiple bills for payment.
- Pay multiple bills through combined checkout.
- Complete payments on a **separate payment page** using Razorpay.
- Resume pending checkouts from Order History using **Pay Now**.
- View recent transactions.
- Access payment history in a scrollable list.
- See payments recorded in cash by the owner.
- View payment receipts.
- Download PDF payment receipts.

### Document Management

- Upload personal documents (PDF or image, up to 5 MB) with a document name and type.
- View documents shared by the owner and documents uploaded by you.
- Download documents.
- Manage tenant-related documents.

### Maintenance Requests

- Submit maintenance complaints.
- Select complaint categories.
- Set complaint priority.
- Provide complaint descriptions.
- Upload optional complaint photographs.
- Track maintenance status.
- View owner remarks.

Supported complaint statuses:

- Pending
- In Progress
- Resolved
- Rejected

### Profile Management

- View profile information.
- Update personal details.
- Upload profile photographs.
- Manage account information.

### Move-Out Requests

- Submit move-out requests through a confirmation popup with a required last day.
- See the request status (Pending, Approved, Rejected or Expired) instead of the submit button once a request exists.
- View the validity period and the owner's rejection reason.
- Apply for another property while a move-out request is pending, and confirm the new lease once the current owner approves the move-out.

---

## Admin Panel

RentGuard includes a dedicated administrative panel for platform oversight.

### Admin Dashboard

- View total owners.
- View total tenants.
- View owner verification statistics.
- Monitor pending, approved, and rejected owner accounts.

### Owner Management

- Browse owner records.
- Search and filter owner records.
- View owner information.
- Review owner verification applications.
- Approve owner accounts (the owner is emailed with a login link).
- Reject owner accounts.
- Record rejection reasons.
- View reviewer details and review dates.
- Use server-side pagination.

### Tenant Management

- Browse tenant records.
- Search and filter tenants.
- View tenant information.
- View tenant summary statistics.
- Use server-side pagination.

---

# 2. User Roles

RentGuard supports three main user roles.

| Role | Responsibilities |
|---|---|
| Admin | Platform administration and owner verification |
| Owner | Property, unit, tenant, bill, payment and maintenance management |
| Tenant | Rental discovery, applications, payments, documents and maintenance requests |

Each role has a separate dashboard and role-protected application routes.

---

# 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| HTTP Client | Axios (shared interceptor) |
| Notifications | React Hot Toast through one shared `notify` helper |
| Icons | Lucide React |
| Backend | Node.js |
| Backend Framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose 9 |
| Authentication | JWT and Email OTP |
| Password Hashing | bcryptjs |
| Payment Gateway | Razorpay |
| Email Service | Brevo (Nodemailer) |
| File Storage | Cloudinary |
| File Uploads | Multer (5 MB limit) |
| PDF Generation | PDFKit |
| Rate Limiting | express-rate-limit |
| API Documentation | Swagger |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | MongoDB Atlas |

---

# 4. Application Architecture

RentGuard follows a client-server architecture.

```text
                 USERS
                   |
       +-----------+-----------+
       |           |           |
      ADMIN       OWNER      TENANT
       |           |           |
       +-----------+-----------+
                   |
                   v
          REACT FRONTEND
              VERCEL
                   |
              HTTP / API
                   |
                   v
          EXPRESS BACKEND
              RENDER
                   |
        +----------+----------+
        |          |          |
        v          v          v
      MongoDB   Razorpay  Cloudinary
      Database  Payments  File Storage
                             
                   |
                   v
              Email Service
                 Brevo
```

### Frontend

The React application provides role-specific dashboards, forms, tables, navigation, modals, image sliders, payment interfaces, and responsive layouts.

### Backend

The Express application handles authentication, authorization, business logic, database operations (using Mongo transactions where several records change together), payment processing, document uploads, and email notifications.

### Database

MongoDB stores user accounts, properties, rental units, tenant records, rental applications, bills, orders, payments, documents, and maintenance information.

### External Services

- **Razorpay:** Online payment processing.
- **Cloudinary:** Image and document storage.
- **Brevo:** Email notifications and OTP delivery.

---

# 5. Project Structure

```text
RentGuard/
│
├── Backend/
│   │
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   │
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   ├── createAdmin.js
│   │   ├── approveExistingOwners.js
│   │   └── fixPaymentIndexes.js
│   │
│   └── src/
│       │
│       ├── config/
│       │   ├── db.js
│       │   ├── cloudinary.js
│       │   ├── multer.js
│       │   └── policy.js
│       │
│       ├── controllers/
│       │   ├── admin.controller.js
│       │   ├── user.controller.js
│       │   ├── tenant.controller.js
│       │   ├── property.controller.js
│       │   ├── unit.controller.js
│       │   ├── bill.controller.js
│       │   ├── order.controller.js
│       │   ├── payment.controller.js
│       │   ├── maintenance.controller.js
│       │   ├── rentalRequest.controller.js
│       │   ├── propertyDocument.controller.js
│       │   ├── dashboard.controller.js
│       │   └── contact.controller.js
│       │
│       ├── models/
│       │   (user, tenant, admin, property, unit, rentalRequest, bill, rent,
│       │    order, payment, maintenance, propertyDocument, otp,
│       │    ownerVerificationLog)
│       │
│       ├── routes/
│       │
│       └── utils/
│           ├── protect.js              (auth and owner-verification guards)
│           ├── email.js                (all email templates)
│           ├── moveOut.js              (move-out expiry helper)
│           ├── paymentSettlement.js
│           ├── otpRateLimiter.js
│           ├── cleanupUnverifiedOwners.js
│           └── ...
│
├── Frontend/
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json             (SPA fallback and /api rewrite to the backend)
│   ├── eslint.config.js
│   ├── index.html
│   │
│   └── src/
│       │
│       ├── ApiClient/
│       │   └── interceptor.js
│       │
│       ├── common/
│       │   ├── Layout.jsx
│       │   ├── OwnerLayout.jsx
│       │   ├── TenantLayout.jsx
│       │   ├── AdminLayout.jsx
│       │   ├── ImageSlider.jsx
│       │   ├── Pagination.jsx
│       │   └── ConfirmModal.jsx
│       │
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   └── ThemeToggle.jsx
│       │
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       │
│       ├── utils/
│       │   ├── ProtectedRoutes.jsx
│       │   ├── ApprovedOwnerRoute.jsx
│       │   ├── PublicRoutes.jsx
│       │   └── notify.js
│       │
│       ├── pages/
│       │   ├── Admin/      (AdminLogin, AdminDashboard, AdminOwners, AdminTenants)
│       │   ├── auth/       (Login, Signup, SignOut)
│       │   ├── Owner/      (OwnerDashboard, Property, Tenant, AddTenantModal,
│       │   │                Bill, Documents, OwnerMaintenance, OwnerProfile,
│       │   │                VerificationStatus)
│       │   ├── Tenant/     (TenantDashboard, BrowseRentals, TenantBills,
│       │   │                TenantPayment, TenantDocument, Maintenance,
│       │   │                TenantProfile)
│       │   ├── About.jsx
│       │   ├── Contact.jsx
│       │   └── Hero.jsx
│       │
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── PROJECT_SPEC.md
├── README.md
└── .gitignore
```

## Frontend Routes

| Area | Routes |
|---|---|
| Public | `/`, `/login`, `/signup`, `/about`, `/contact` |
| Admin | `/admin/login`, `/admin/dashboard`, `/admin/owners`, `/admin/tenants` |
| Owner (approved only) | `/owner/dashboard`, `/owner/properties`, `/owner/tenants`, `/owner/bill`, `/owner/documents`, `/owner/documents/:propertyId`, `/owner/maintenance` |
| Owner (any status) | `/owner/profile`, `/owner/verification` |
| Tenant | `/tenant/dashboard`, `/tenant/rentals`, `/tenant/bills`, `/tenant/pay/:orderId`, `/tenant/documents`, `/tenant/documents/:propertyId`, `/tenant/profile`, `/tenant/maintenance` |

---

# 6. Getting Started

Follow these instructions to run RentGuard locally.

## Prerequisites

Install the following:

- Node.js 20.19 or later (required by Mongoose 9 and Vite 8).
- npm.
- MongoDB Atlas account or a compatible MongoDB database.
- Razorpay account (test mode is enough).
- Cloudinary account.
- Brevo account with a verified sender email.

## Step 1: Clone the Repository

```bash
git clone https://github.com/harneetsingh46/RentGuard.git

cd RentGuard
```

## Step 2: Install Backend Dependencies

```bash
cd Backend

npm install
```

## Step 3: Install Frontend Dependencies

Open another terminal from the project root.

```bash
cd Frontend

npm install
```

## Step 4: Configure Environment Variables

Create the required `.env` files.

See the [Environment Variables](#7-environment-variables) section.

## Step 5: Create the First Admin

Set `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `Backend/.env`, then run:

```bash
cd Backend

node scripts/seedAdmin.js
```

`seedAdmin.js` creates the admin, or updates the existing admin with the same email. `createAdmin.js` also reads these variables but does nothing if that admin already exists.

## Step 6: Point the Frontend at the Backend (local development)

The frontend calls the API through the relative path `/api`. In production, `Frontend/vercel.json` rewrites `/api/*` to the Render backend. `vite.config.js` has no proxy, so for local development add one:

```js
// Frontend/vite.config.js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

Use the same port as `PORT` in `Backend/.env`. The backend only allows the origins `https://rent-guard-1.vercel.app` and `http://localhost:5173` (set in `Backend/app.js`).

---

# 7. Environment Variables

## Backend Environment Variables

Create a `.env` file inside the `Backend` directory.

```env
PORT=5000

NODE_ENV=development
TRUST_PROXY=0

MONGO_URL=your_mongodb_connection_string

JWT_SECRET_KEY=your_jwt_secret
OTP_SECRET_KEY=your_otp_secret

BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=your_verified_sender_email

# Used by scripts/seedAdmin.js and scripts/createAdmin.js
ADMIN_NAME=RentGuard Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_admin_password

# Recipient of messages sent from the Contact page
CONTACT_TO_EMAIL=support@example.com

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Frontend Environment Variables

Create a `.env` file inside the `Frontend` directory.

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Important Notes

- Replace the example values with your actual credentials.
- Use the same Razorpay Key ID in the frontend and backend.
- Configure a verified sender email for the email service.
- Configure production environment variables separately on the hosting platforms.
- `TRUST_PROXY` sets Express's `trust proxy` value (a hop count, `true`, or a proxy address). Keep it at `0` locally.
- Login buttons and links inside emails are hardcoded to `https://rent-guard-1.vercel.app/login` (`LOGIN_URL` in `Backend/src/utils/email.js`).
- CORS origins are hardcoded in `Backend/app.js` and the `/api` rewrite target in `Frontend/vercel.json`. Change all three if you host your own copy.
- Never commit `.env` files to GitHub.
- Never expose private API keys or database credentials in frontend code.

---

# 8. Running the Application

## Start the Backend

Open a terminal:

```bash
cd Backend

npm run dev
```

The backend runs using the configured `PORT`. For production use `npm start`.

## Start the Frontend

Open another terminal:

```bash
cd Frontend

npm run dev
```

Vite will provide a local development URL, usually:

```text
http://localhost:5173
```

## Build the Frontend

```bash
cd Frontend

npm run build
```

## Preview the Production Build

```bash
npm run preview
```

## Lint the Frontend

```bash
npm run lint
```

## One-Off Backend Scripts

Run these from the `Backend` directory.

| Script | Purpose |
|---|---|
| `node scripts/seedAdmin.js` | Create the first admin account from `ADMIN_*` variables |
| `node scripts/createAdmin.js` | Create an admin from `ADMIN_*` variables (skipped if it already exists) |
| `node scripts/approveExistingOwners.js` | Approve owners created before verification existed |
| `node scripts/fixPaymentIndexes.js` | Drop the old unique Razorpay index on payments so cash payments can be saved. Run it once on any database created before cash payments were added. |

---

# 9. Application Workflows

## Owner Registration and Verification

1. Owner registers with the required account and identity information.
2. Owner verifies the emailed OTP.
3. Owner account enters pending verification.
4. While pending, the owner can only see the profile and Verification Status pages.
5. Administrator reviews the application.
6. Administrator approves or rejects the owner account (a reason is recorded for rejections).
7. Approved owners receive an email with a login link and can access property management functionality.

## Tenant Registration and Authentication

1. Tenant registers using the available registration flow.
2. Tenant requests an email OTP.
3. Backend generates and sends the OTP.
4. Tenant submits the OTP.
5. Backend verifies the OTP.
6. An authenticated session is created.
7. Tenant accesses the tenant dashboard.

## Property and Unit Management

1. Owner creates a property with a structured address.
2. Owner adds rental units to the property.
3. Owner provides unit details, rental amount, description and facilities.
4. Owner uploads up to five unit photographs.
5. Backend uploads the images to Cloudinary.
6. Image URLs and public IDs are stored with the unit.
7. Tenants see each available unit as its own card with an image slider.

## Rental Application Workflow

1. Tenant browses available units.
2. Tenant selects an available unit and a move-in date.
3. Tenant submits a rental application.
4. Owner reviews the application.
5. Owner approves or rejects the application.
6. Approved offers appear in the tenant's dashboard overview.
7. Tenant accepts or declines an approved offer.
8. An accepted offer activates the tenancy and updates unit occupancy.

## Owner Adds a Tenant Directly

1. Owner opens **Add Tenant**, selects a property and an available unit and enters the tenant's details.
2. The tenant record is created and the unit is marked occupied.
3. The owner can manage the tenant's bills, including cash payments, without the tenant logging in.

## Bill Payment Workflow (Online)

1. Owner creates bills for a tenant.
2. Tenant views unpaid bills.
3. Tenant selects one or multiple bills.
4. Backend creates a payment order and the selected bills are reserved.
5. Tenant is taken to the payment page and completes checkout through Razorpay.
6. Backend verifies the payment (the webhook also reconciles it).
7. Payment is recorded and bills are updated.
8. Tenant and owner receive confirmation emails.
9. Tenant can view the recent transaction and payment history.
10. Tenant can view and download the PDF receipt.

## Bill Payment Workflow (Cash)

1. Owner opens an unpaid bill and chooses **Record cash payment**.
2. Owner sets the received date and an optional note.
3. Backend creates a paid order and a payment with method `cash` and marks the bills paid.
4. Confirmation emails are sent to the tenant and the owner.
5. Bills reserved by an open online order cannot be paid in cash.

## Maintenance Workflow

1. Tenant submits a maintenance complaint.
2. Tenant selects category and priority.
3. Tenant provides a description.
4. Tenant optionally uploads a photograph.
5. Backend stores the complaint and associated information.
6. Owner receives an email notification.
7. Owner reviews the complaint.
8. Owner updates its status and can add remarks.
9. Tenant tracks the complaint.

## Document Workflow

1. Owner or tenant selects a document, enters a name and type.
2. Backend validates the upload (type and size up to 5 MB).
3. File is stored using Cloudinary.
4. Document information, including who uploaded it, is stored in the database.
5. Authorized users can view and download documents.
6. After an owner uploads a document for a tenant, the Documents page opens with that tenant selected.

## Move-Out Workflow

1. Tenant submits a move-out request with a last day; it stays valid for 48 hours.
2. Owner reviews the request.
3. Owner approves or rejects it (with an optional reason).
4. Approval requires all bills to be paid, ends the tenancy, frees the unit and signs the tenant out.
5. Rejection or expiry cancels the tenant's other pending and approved rental applications.

## Moving to Another Property

1. An active tenant can apply for another unit only while their move-out request is pending.
2. The new owner can approve the application, but the tenant can confirm only after the current owner approves the move-out.
3. When the move-out is approved, the tenant receives a fresh account record with the same identity details and their applications move to it.
4. The tenant logs in again and confirms the new lease.
5. The old tenancy, bills and documents remain in the previous owner's history.

## Business Rules

- Only approved owners can use owner features; every owner API route rejects unverified owners.
- A unit with an active tenant cannot be edited or deleted.
- A property with occupied units cannot be deleted.
- A tenant cannot apply twice for the same unit while a request is pending or approved.
- A tenant cannot confirm a new lease while still holding a unit.
- Move-out requests expire after 48 hours.
- A move-out cannot be approved while bills are unpaid.
- Cash payments cover whole bills only.
- Past dates are blocked for move-in dates and move-out last days.
- Uploads are limited to 5 MB and validated by type.

## Email Notifications

Emails are sent through Brevo for OTP codes, owner registration and approval, rental application updates, tenancy and move-out events, payment confirmations (tenant and owner) and maintenance updates.

A **Log in to RentGuard** button linking to https://rent-guard-1.vercel.app/login is included in the owner approval email, the rental application approved email, the payment confirmation emails (tenant and owner), the move-out request email to the owner and the move-out rejection emails (tenant and owner).

---

# 10. API Documentation

RentGuard uses Swagger for API documentation.

After starting the backend, visit:

```text
http://localhost:5000/api-docs
```

> The Swagger server URL is currently set to `http://localhost:2000` in `Backend/src/utils/swagger.js`. Use port 2000 or update that value if "Try it out" requests fail.

## Main API Modules

| Module | Base Path | Functionality |
|---|---|---|
| Admin | `/admin` | Admin login, dashboard, owner verification and tenant management |
| User | `/user` | Owner registration and account management |
| Auth | `/auth` | OTP requests, OTP verification, session information and logout |
| Tenant | `/tenant`, `/property` | Tenant registration, profile, tenancy, owner-side tenant management and move-out requests (create, approve, reject) |
| Property | `/property` | Property CRUD operations with search and pagination |
| Unit | `/property` | Rental unit management with multiple image uploads, description and facilities |
| Rental Request | `/rental-request` | Rental applications, approval and lease confirmation workflows |
| Bill | `/bill` | Bill creation and management |
| Order | `/order` | Payment order creation, unpaid bill selection and order lookup |
| Payment | `/payment` | Razorpay verification, webhook, cash payments, payment history and receipts |
| Document | `/document` | Property and tenant document management, including tenant uploads |
| Maintenance | `/maintenance` | Maintenance complaint management |
| Dashboard | `/dashboard` | Dashboard statistics and action items |
| Contact | `/contact` | Contact form submissions |

---

# 11. Security

RentGuard includes the following security mechanisms:

- JWT-based authentication.
- HTTP-only authentication cookies.
- Role-based authorization.
- Protected frontend routes.
- Protected backend endpoints.
- Backend-enforced owner verification on every owner route.
- OTP expiration and attempt limits.
- Authentication, registration and contact-form rate limiting.
- Server-side payment verification and Razorpay webhook signature verification.
- Payment amount verification.
- File upload size and type validation.
- Session invalidation.
- Restricted access to tenant and property documents.
- Aadhaar numbers are excluded or masked in most API responses (encryption at rest is planned).
- CORS restricted to the configured frontend origins.

### Security Best Practices

- Never expose private credentials in frontend code.
- Never commit environment files.
- Use HTTPS in production.
- Keep database credentials private.
- Validate all incoming data on the backend.
- Never rely only on frontend authorization.
- Verify payment information on the server.

---

# 12. Deployment

RentGuard uses the following deployment services:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Payment Gateway | Razorpay |
| File Storage | Cloudinary |
| Email Service | Brevo |

## Frontend Deployment

1. Connect the GitHub repository to Vercel.
2. Set the frontend project root to `Frontend`.
3. Add the frontend environment variable (`VITE_RAZORPAY_KEY_ID`).
4. Use the build command `npm run build` and the output directory `dist`.
5. Make sure `Frontend/vercel.json` points the `/api/*` rewrite at your backend URL.
6. Deploy the application.

## Backend Deployment

1. Connect the GitHub repository to Render.
2. Set the backend root directory to `Backend`.
3. Make sure **Auto-Deploy** is on for the `main` branch.
4. Configure the start command:

```bash
npm start
```

5. Add all backend environment variables.
6. Configure the production database connection.
7. Set the Razorpay webhook URL to `<backend-url>/payment/webhook` using the same secret as `RAZORPAY_WEBHOOK_SECRET`.
8. Run `node scripts/fixPaymentIndexes.js` once if the database was created before cash payments were added.
9. Deploy the backend.

### Render Free Tier

The backend sleeps after about 15 minutes without traffic, so the first request can take 50 seconds or more. A free uptime monitor that calls `GET /` every 5 to 10 minutes, or a paid instance, avoids this. The background cleanup job only runs while the instance is awake.

## Production Checklist

Before releasing changes:

- Verify MongoDB connectivity.
- Verify backend API availability.
- Verify frontend-to-backend communication.
- Verify CORS configuration.
- Test owner registration and admin verification.
- Test that unverified owners are limited to the Verification Status page.
- Test tenant registration and OTP login.
- Test property and unit management, including multiple images.
- Test Cloudinary image uploads.
- Test rental applications and lease confirmation.
- Test adding a tenant directly.
- Test bill creation, online payment and cash payment.
- Test PDF receipt downloads.
- Test document uploads by owners and tenants.
- Test maintenance requests.
- Test move-out request, approval, rejection and expiry.
- Test email delivery and login links.

---

# 13. Future Improvements

Potential areas for future development include:

- Encryption of Aadhaar numbers at rest.
- Scheduled overdue-rent marking and automated reminders for overdue bills (the helper exists but is not scheduled yet).
- Automated recurring rent bills.
- Monthly financial reports and CSV report exports.
- Partial payments and refunds.
- Improved payment failure and retry handling.
- Server-side pagination for units.
- MongoDB query and index optimization.
- API response optimization.
- Advanced rental analytics.
- Enhanced notification system.
- Automated tests and continuous integration.
- Additional tenant and owner reporting tools.

---

# 14. Author

**Harneet Singh**

GitHub: https://github.com/harneetsingh46

Project Repository: https://github.com/harneetsingh46/RentGuard

Live Application: https://rent-guard-1.vercel.app

---

**RentGuard — Simplifying Property Management.**