
# RentGuard

**RentGuard** is a rental property management platform built to simplify the relationship between property owners and tenants. It provides a centralized workspace for managing properties, rental units, tenants, rental applications, bills, payments, documents, and maintenance requests.

The platform includes separate experiences for Property Owners, Tenants, and Administrators, with role-based access and secure authentication.

**Live Application:** https://rent-guard-1.vercel.app  
**GitHub Repository:** https://github.com/harneetsingh46/RentGuard

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Application Workflows](#application-workflows)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Deployment](#deployment)

---

## Features

### 1. Authentication and Account Management

- Separate registration for property owners and tenants.
- Email-based OTP authentication.
- Six-digit OTP verification.
- OTP expiration and attempt limits.
- Rate limiting for OTP requests and verification.
- Role-based authentication for owners, tenants, and administrators.
- JWT-based sessions stored in HTTP-only cookies.
- Account profile management.
- Profile picture upload for tenants.
- Logout and session invalidation.

### 2. Property Owner Features

- Owner dashboard with rental statistics.
- Create, view, update, and delete properties.
- Manage property units.
- Track unit availability:
  - Available
  - Occupied
  - Maintenance
- Register and manage tenants.
- View active tenant records.
- View previous tenant history.
- Review rental applications.
- Approve or reject rental applications.
- Manage tenant move-out requests.
- Create and manage tenant bills.
- Track rent, electricity, water, and other charges.
- View payment activity.
- Manage property and tenant documents.
- Review maintenance complaints.
- Update maintenance complaint status.
- Add remarks to maintenance complaints.
- View property, tenant, collection, and maintenance summaries.

**Owner verification**

- Owner registrations begin with pending verification.
- Administrators can approve or reject owner accounts.
- Rejection reasons can be recorded.
- Verification review history is maintained.
- Owners cannot create or modify properties until approved.
- Owners are notified about registration and verification-related actions through email.

### 3. Tenant Features

- Independent tenant registration.
- Browse available rental properties.
- View property and unit details.
- View rent, address, and available units.
- View property owner information.
- Submit rental applications.
- Track rental application status.
- Accept or decline approved rental offers.
- View assigned rental and tenancy information.
- View unpaid bills.
- View recent transactions.
- Pay bills online.
- Download payment receipts.
- Upload and manage personal documents.
- Submit maintenance complaints.
- Upload optional complaint photographs.
- Track maintenance complaint status.
- Update profile information.
- Upload profile pictures.
- Submit move-out requests.
- Track move-out request status.

### 4. Admin Panel

A dedicated administrative area provides account oversight and owner verification management.

- Admin login.
- Admin dashboard overview.
- View total owners.
- View pending, approved, and rejected owner counts.
- View total tenants.
- Browse owner records.
- Search and filter owner records.
- Server-side owner pagination.
- Review owner verification applications.
- Approve or reject owner registrations.
- Record rejection reasons.
- View owner verification review history.
- View reviewer details and review dates.
- Browse tenant records.
- Search and filter tenants.
- Server-side tenant pagination.
- View tenant summary statistics.

### 5. Rental Application Management

- Tenants can apply for available rental units.
- Owners can view submitted applications.
- Owners can approve or reject applications.
- Tenants can accept or decline approved offers.
- Tenants can cancel their applications.
- Application status is tracked.
- Rental application email notifications are supported.
- Accepted offers activate the tenancy and occupy the selected unit.

### 6. Bill and Payment Management

**Owner**

- Create bills for tenants.
- Manage rent bills.
- Manage electricity bills.
- Manage water bills.
- Manage other charges.
- Track bill due dates and payment status.
- View payment records.

**Tenant**

- View unpaid bills.
- Select multiple bills for payment.
- Pay multiple bills through a combined checkout.
- View recent transactions.
- Access payment history.
- View and download PDF receipts.

**Payment processing**

- Razorpay payment gateway integration.
- Backend-generated payment orders.
- Bill reservation during checkout.
- Payment signature verification.
- Server-side payment confirmation.
- Payment settlement and bill updates.
- Razorpay webhook handling.
- Checkout expiration handling.
- Payment confirmation emails.
- PDF receipt generation.

### 7. Maintenance Management

**Tenant**

- Submit maintenance complaints.
- Select complaint category and priority.
- Add a description.
- Upload an optional photograph.
- View submitted complaints.
- Track complaint status.

**Owner**

- View complaints associated with their properties.
- Filter complaints by status, priority, and property.
- Review complaint details.
- Update complaint status.
- Add remarks.
- Receive email notifications for new complaints.

Supported complaint statuses:

- Pending
- In Progress
- Resolved
- Rejected

### 8. Document Management

- Upload property documents.
- Upload tenant-related documents.
- Upload personal tenant documents.
- View uploaded documents.
- Download documents.
- Delete documents where permitted.
- Cloudinary-based file storage.
- File upload validation and size limits.

### 9. Move-Out Management

- Tenants can submit move-out requests.
- Tenants can view their move-out request.
- Owners can view property-related move-out requests.
- Owners can approve move-out requests.
- Tenant and unit records are updated through the move-out workflow.

### 10. Other Platform Features

- Responsive user interface.
- Light and dark theme support.
- Protected frontend routes.
- Role-based backend authorization.
- Email notifications through Brevo.
- Contact form.
- Backend health-check endpoint.
- Swagger API documentation.
- File uploads using Multer.
- Cloudinary integration.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Backend | Node.js, Express 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT, Email OTP |
| Password Hashing | bcryptjs |
| Payment Gateway | Razorpay |
| Email Service | Brevo API |
| File Storage | Cloudinary |
| File Uploads | Multer |
| PDF Generation | PDFKit |
| API Documentation | Swagger |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## Application Architecture

```text
                 ┌──────────────────────┐
                 │        Users         │
                 │                      │
                 │  Owner / Tenant      │
                 │      Admin           │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    React Frontend    │
                 │        Vercel        │
                 └──────────┬───────────┘
                            │
                       HTTP Requests
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Express Backend    │
                 │        Render        │
                 └──────────┬───────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
   ┌────────────┐    ┌────────────┐     ┌────────────┐
   │  MongoDB   │    │  Razorpay  │     │ Cloudinary │
   │  Database  │    │  Payments  │     │ File Store │
   └────────────┘    └────────────┘     └────────────┘
                            │
                            ▼
                     ┌────────────┐
                     │   Brevo    │
                     │   Emails   │
                     └────────────┘
```

---

## Project Structure

```text
RentGuard/
│
├── Backend/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   │
│   └── src/
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
│       │   ├── bill.controller.js
│       │   ├── order.controller.js
│       │   ├── payment.controller.js
│       │   ├── maintenance.controller.js
│       │   ├── rentalRequest.controller.js
│       │   ├── dashboard.controller.js
│       │   └── contact.controller.js
│       │
│       ├── models/
│       │
│       ├── routes/
│       │
│       └── utils/
│
├── Frontend/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   │
│   └── src/
│       ├── ApiClient/
│       ├── common/
│       ├── context/
│       ├── utils/
│       │
│       ├── pages/
│       │   ├── Admin/
│       │   ├── auth/
│       │   ├── Owner/
│       │   ├── Tenant/
│       │   ├── About/
│       │   ├── Contact/
│       │   └── Hero.jsx
│       │
│       ├── App.jsx
│       └── main.jsx
│
└── README.md
```

---

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js 18 or later.
- npm.
- MongoDB database (MongoDB Atlas recommended).
- Razorpay account.
- Cloudinary account.
- Brevo account with a verified sender email.

### 1. Clone the Repository

```bash
git clone https://github.com/harneetsingh46/RentGuard.git

cd RentGuard
```

### 2. Install Backend Dependencies

```bash
cd Backend

npm install
```

### 3. Install Frontend Dependencies

Open another terminal from the project root:

```bash
cd Frontend

npm install
```

---

## Environment Variables

### Backend Environment

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

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Environment

Create a `.env` file inside the `Frontend` directory.

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Important:**

- Replace all placeholder values with your own credentials.
- Use the same Razorpay Key ID in the frontend and backend.
- Configure a verified sender email in Brevo.
- Never commit `.env` files, API keys, database credentials, or secrets to GitHub.
- Configure production environment variables separately on the hosting platforms.

---

## Running the Application

### Start the Backend

From the `Backend` directory:

```bash
npm run dev
```

The backend uses the configured `PORT` environment variable.

### Start the Frontend

Open another terminal:

```bash
cd Frontend

npm run dev
```

Open the local URL provided by Vite.

### Build the Frontend

```bash
cd Frontend

npm run build
```

### Preview the Production Build

```bash
npm run preview
```

---

## Application Workflows

### 1. Owner Registration and Verification

1. Owner registers with username, email, phone, Aadhaar, and PAN details.
2. Owner receives a registration confirmation email.
3. RentGuard receives a new owner registration notification.
4. Owner account starts with pending verification.
5. Administrator reviews the owner registration.
6. Administrator approves or rejects the account.
7. Owner can manage properties after approval.

### 2. Tenant Registration and Login

1. Tenant registers independently.
2. Tenant receives a signup confirmation email.
3. Tenant requests an OTP using their registered email.
4. Backend generates and sends the OTP.
5. Tenant verifies the OTP.
6. Backend creates an authenticated session.
7. Tenant accesses the tenant dashboard.

### 3. Rental Application Workflow

1. Tenant browses available rental properties.
2. Tenant selects a property and unit.
3. Tenant submits a rental application.
4. Owner reviews the application.
5. Owner approves or rejects the application.
6. Tenant accepts or declines an approved offer.
7. Accepted offers activate the tenancy and occupy the unit.

### 4. Bill Payment Workflow

1. Owner creates bills for a tenant.
2. Tenant views unpaid bills.
3. Tenant selects one or multiple bills.
4. Backend creates an order and reserves the selected bills.
5. Tenant completes payment through Razorpay.
6. Backend verifies the payment.
7. Payment is recorded and bills are updated.
8. Tenant can view the transaction and download the PDF receipt.

### 5. Maintenance Workflow

1. Tenant submits a maintenance complaint.
2. Complaint is associated with the tenant, owner, property, and unit.
3. Tenant can attach an optional photograph.
4. Owner receives an email notification.
5. Owner reviews the complaint.
6. Owner updates the complaint status and can add remarks.
7. Tenant tracks the complaint progress.

### 6. Move-Out Workflow

1. Tenant submits a move-out request.
2. Owner views the request.
3. Owner reviews and approves the request.
4. The tenancy and unit records are updated through the move-out process.

---

## API Documentation

RentGuard uses Swagger for backend API documentation.

After starting the backend, open:

```text
http://localhost:5000/api-docs
```

### Main API Modules

| Module | Functionality |
|---|---|
| Admin | Admin login, overview, owner reviews, verification history, tenant management |
| User | Owner registration and account management |
| Auth | OTP requests, OTP verification, current session, logout |
| Tenant | Tenant registration, profile, tenancy, and move-out management |
| Property | Property CRUD operations |
| Unit | Property unit management |
| Rental Request | Rental applications and approval workflow |
| Bill | Bill creation and management |
| Order | Unpaid bills and payment order creation |
| Payment | Razorpay verification, transactions, and receipts |
| Document | Document upload and management |
| Maintenance | Maintenance complaint management |
| Dashboard | Owner dashboard statistics |
| Contact | Contact form submissions |

---

## Security

RentGuard implements several security measures:

- JWT authentication.
- HTTP-only authentication cookies.
- Role-based access control.
- Protected frontend and backend routes.
- OTP expiration.
- OTP attempt limits.
- Rate limiting for authentication endpoints.
- Server-side Razorpay payment verification.
- Payment settlement through backend logic.
- File upload validation.
- Aadhaar masking in tenant API responses.
- Owner verification restrictions.
- Session invalidation using token versions.

**Security recommendations:**

- Never expose API secrets in frontend code.
- Never commit environment files.
- Do not expose full Aadhaar or other sensitive identity information in logs or API responses.
- Use HTTPS in production.
- Keep production credentials private.

---

## Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Payment Gateway | Razorpay |
| Email Service | Brevo |
| File Storage | Cloudinary |

### Production Configuration

Before deployment:

1. Configure the backend environment variables on Render.
2. Configure the frontend environment variables on Vercel.
3. Add the production frontend origin to backend CORS configuration.
4. Configure Razorpay production credentials and webhook settings.
5. Verify the Brevo sender email.
6. Verify Cloudinary credentials.
7. Confirm that the MongoDB connection is working.
8. Test owner registration, tenant registration, OTP login, payments, and document uploads.

---

## Author

**Harneet Singh**

GitHub: https://github.com/harneetsingh46

---

**RentGuard — Simplifying Property Management.**
