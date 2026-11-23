# RentGuard – Rental Property Management Platform

**RentGuard** is a full-stack rental property management platform designed to simplify property management and improve communication between property owners and tenants.

It provides a centralized platform where property owners can manage properties, rental units, tenants, rental applications, bills, payments, documents, and maintenance requests. Tenants can discover available rentals, apply for units, manage their tenancy, pay rent and other bills, access receipts, and submit maintenance complaints.

The platform also includes an administrative panel for managing users and verifying property owner accounts.

---

## Live Application

- **Live Website:** https://rent-guard-1.vercel.app
- **GitHub Repository:** https://github.com/harneetsingh46/RentGuard

---

## Table of Contents

1. [Features](#features)
2. [User Roles](#user-roles)
3. [Technology Stack](#technology-stack)
4. [Application Architecture](#application-architecture)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Running the Application](#running-the-application)
9. [Application Workflows](#application-workflows)
10. [API Documentation](#api-documentation)
11. [Security](#security)
12. [Deployment](#deployment)
13. [Future Improvements](#future-improvements)
14. [Author](#author)

---

# 1. Features

## Authentication and Account Management

- Separate registration experiences for property owners and tenants.
- Email-based OTP authentication.
- Six-digit OTP verification.
- OTP expiration and attempt limits.
- Authentication rate limiting.
- JWT-based authentication.
- Secure HTTP-only authentication cookies.
- Role-based access control.
- Protected application routes.
- User profile management.
- Profile picture uploads.
- Logout and session invalidation.

## Property Owner Dashboard

Owners get a centralized dashboard to manage their rental properties and tenants.

### Dashboard Overview

- View rental statistics.
- Monitor properties and rental units.
- Track tenant information.
- View collection and maintenance summaries.
- Access property management features.

### Property Management

- Add new properties.
- View existing properties.
- Update property information.
- Delete properties where permitted.
- Manage multiple properties.
- Track property addresses and details.

### Unit Management

- Create and manage rental units.
- Specify unit names and types.
- Set monthly rental amounts.
- Track unit availability.
- Upload unit photographs.
- Store unit images using Cloudinary.
- Preview unit images.
- Update or replace unit images.
- View unit details.

Supported unit statuses:

- Available
- Occupied
- Maintenance

### Tenant Management

- Register tenants.
- Associate tenants with properties and units.
- View active tenant records.
- View previous tenant history.
- Manage tenant information.
- Track tenant occupancy.
- View tenant-related bills and information.
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
- View payment activity.
- Manage tenant billing records.

### Document Management

- Upload property documents.
- Upload tenant-related documents.
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

- View tenant move-out requests.
- Review move-out requests.
- Approve move-out requests.
- Update tenant and unit records through the move-out workflow.

---

## Tenant Dashboard

Tenants get their own dashboard to manage their rental activities.

### Rental Discovery

- Browse available rental properties.
- View property names and addresses.
- View property owner information.
- View available rental units.
- View unit types and rental prices.
- View uploaded unit photographs.
- Open unit photographs using the image viewer.
- Apply for available rental units.

### Rental Applications

- Submit rental applications.
- Track application status.
- View approved or rejected applications.
- Accept or decline approved rental offers.
- Cancel applications where permitted.

### Bills and Payments

- View unpaid bills.
- View rent and additional charges.
- Select multiple bills for payment.
- Pay multiple bills through combined checkout.
- Complete payments using Razorpay.
- View recent transactions.
- Access payment history.
- View payment receipts.
- Download PDF payment receipts.

### Document Management

- Upload personal documents.
- View uploaded documents.
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

- Submit move-out requests.
- View submitted requests.
- Track move-out request status.

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
- Approve owner accounts.
- Reject owner accounts.
- Record rejection reasons.
- View owner verification history.
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
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Backend | Node.js |
| Backend Framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT and Email OTP |
| Password Hashing | bcryptjs |
| Payment Gateway | Razorpay |
| Email Service | Brevo / configured email integration |
| File Storage | Cloudinary |
| File Uploads | Multer |
| PDF Generation | PDFKit |
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

The React application provides role-specific dashboards, forms, tables, navigation, modals, payment interfaces, and responsive layouts.

### Backend

The Express application handles authentication, authorization, business logic, database operations, payment processing, document uploads, and email notifications.

### Database

MongoDB stores user accounts, properties, rental units, tenant records, bills, orders, payments, documents, and maintenance information.

### External Services

- **Razorpay:** Online payment processing.
- **Cloudinary:** Image and document storage.
- **Brevo / configured email integration:** Email notifications and OTP delivery.

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
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
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
│       │   └── AdminLayout.jsx
│       │
│       ├── components/
│       │
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       │
│       ├── utils/
│       │   └── ProtectedRoutes.jsx
│       │
│       ├── pages/
│       │   ├── Admin/
│       │   ├── auth/
│       │   ├── Owner/
│       │   ├── Tenant/
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

---

# 6. Getting Started

Follow these instructions to run RentGuard locally.

## Prerequisites

Install the following:

- Node.js 18 or later.
- npm.
- MongoDB Atlas account or a compatible MongoDB database.
- Razorpay account.
- Cloudinary account.
- Email service credentials.

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

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

FRONTEND_URL=https://rent-guard-1.vercel.app
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

The backend runs using the configured `PORT`.

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

---

# 9. Application Workflows

## Owner Registration and Verification

1. Owner registers with the required account and identity information.
2. Registration confirmation is sent.
3. Owner account enters pending verification.
4. Administrator reviews the application.
5. Administrator approves or rejects the owner account.
6. Approved owners can access property management functionality.

## Tenant Registration and Authentication

1. Tenant registers using the available registration flow.
2. Tenant requests an email OTP.
3. Backend generates and sends the OTP.
4. Tenant submits the OTP.
5. Backend verifies the OTP.
6. An authenticated session is created.
7. Tenant accesses the tenant dashboard.

## Property and Unit Management

1. Owner creates a property.
2. Owner adds rental units to the property.
3. Owner provides unit details and rental amount.
4. Owner optionally uploads a unit photograph.
5. Backend uploads the image to Cloudinary.
6. Image URL and public ID are stored with the unit.
7. Tenants can view available rental units and their photographs.

## Rental Application Workflow

1. Tenant browses available properties.
2. Tenant selects an available unit.
3. Tenant submits a rental application.
4. Owner reviews the application.
5. Owner approves or rejects the application.
6. Tenant accepts or declines an approved offer.
7. An accepted offer activates the tenancy and updates unit occupancy.

## Bill Payment Workflow

1. Owner creates bills for a tenant.
2. Tenant views unpaid bills.
3. Tenant selects one or multiple bills.
4. Backend creates a payment order.
5. Selected bills are reserved during checkout.
6. Tenant completes checkout through Razorpay.
7. Backend verifies the payment.
8. Payment is recorded and bills are updated.
9. Tenant can view the recent transaction and payment history.
10. Tenant can view and download the PDF receipt.

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

1. Owner or tenant selects a document.
2. Backend validates the upload.
3. File is stored using Cloudinary.
4. Document information is stored in the database.
5. Authorized users can view and download documents.

## Move-Out Workflow

1. Tenant submits a move-out request.
2. Owner reviews the request.
3. Owner approves the request.
4. Tenant and unit records are updated through the move-out process.

---

# 10. API Documentation

RentGuard uses Swagger for API documentation.

After starting the backend, visit:

```text
http://localhost:5000/api-docs
```

## Main API Modules

| Module | Functionality |
|---|---|
| Admin | Admin login, dashboard, owner verification and tenant management |
| User | Owner registration and account management |
| Auth | OTP requests, OTP verification, session information and logout |
| Tenant | Tenant registration, profile, tenancy and move-out management |
| Property | Property CRUD operations |
| Unit | Rental unit management and image uploads |
| Rental Request | Rental applications and approval workflows |
| Bill | Bill creation and management |
| Order | Payment order creation and unpaid bill selection |
| Payment | Razorpay verification, payment history and receipts |
| Document | Property and tenant document management |
| Maintenance | Maintenance complaint management |
| Dashboard | Dashboard statistics |
| Contact | Contact form submissions |

---

# 11. Security

RentGuard includes the following security mechanisms:

- JWT-based authentication.
- HTTP-only authentication cookies.
- Role-based authorization.
- Protected frontend routes.
- Protected backend endpoints.
- OTP expiration and attempt limits.
- Authentication rate limiting.
- Server-side payment verification.
- Payment amount verification.
- File upload validation.
- Session invalidation.
- Owner verification restrictions.
- Restricted access to tenant and property documents.
- Sensitive identity information protection.

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
| Email Service | Brevo / configured email integration |

## Frontend Deployment

1. Connect the GitHub repository to Vercel.
2. Set the frontend project root to `Frontend`.
3. Configure the frontend environment variables.
4. Configure the build command.
5. Deploy the application.

## Backend Deployment

1. Connect the GitHub repository to Render.
2. Set the backend root directory to `Backend`.
3. Configure the start command:

```bash
npm start
```

4. Add all backend environment variables.
5. Configure the production database connection.
6. Deploy the backend.

## Production Checklist

Before releasing changes:

- Verify MongoDB connectivity.
- Verify backend API availability.
- Verify frontend-to-backend communication.
- Verify CORS configuration.
- Test owner registration.
- Test tenant registration and OTP login.
- Test owner verification.
- Test property and unit management.
- Test Cloudinary image uploads.
- Test rental applications.
- Test bill creation and payment.
- Test PDF receipt downloads.
- Test document uploads.
- Test maintenance requests.
- Test move-out workflows.

---

# 13. Future Improvements

Potential areas for future development include:

- Application-wide performance optimization.
- API response optimization.
- MongoDB query and index optimization.
- Improved dashboard loading experience.
- Advanced rental analytics.
- Automated recurring rent bills.
- Monthly financial reports.
- CSV report exports.
- Improved payment failure and retry handling.
- Payment webhook reconciliation.
- Enhanced notification system.
- More advanced property search and filtering.
- Automated reminders for overdue bills.
- Additional tenant and owner reporting tools.

---

# 14. Author

**Harneet Singh**

GitHub: https://github.com/harneetsingh46

Project Repository: https://github.com/harneetsingh46/RentGuard

Live Application: https://rent-guard-1.vercel.app

---

**RentGuard — Simplifying Property Management.**