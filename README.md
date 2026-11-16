# RentGuard

RentGuard is a rental management platform designed to simplify property management for property owners and tenants. Owners can manage properties, units, tenants, bills, payments, documents, rental applications and maintenance requests. Tenants can register, browse available rentals, apply for properties, pay bills online and manage their tenancy.

**Live Application:** https://rent-guard-1.vercel.app  
**API Documentation:** `/api-docs` on the backend (through the app: `/api/api-docs`)

---

## Features

### 1. Authentication & Registration
- Separate registration flows for property owners and tenants.
- Owner registration with username, email, phone number, Aadhaar and PAN details.
- Tenant self-registration with personal and contact information.
- Passwordless authentication using email OTP.
- Role-based login for owners and tenants.
- Secure session management using JWT and httpOnly cookies.
- OTP verification and rate limiting.

### 2. Owner Features
- Create, view, update and manage properties.
- Create and manage property units.
- Track unit availability: Available, Occupied and Maintenance.
- Register and manage tenants.
- View active tenants and previous tenant history.
- Review tenant rental applications.
- Approve or reject rental applications.
- Create and manage tenant bills.
- Manage rent, electricity, water and other charges.
- View payment activity and download PDF receipts.
- Upload and manage property and tenant documents.
- View and manage maintenance complaints.
- Update complaint status and add owner remarks.
- Owner dashboard with property, unit, tenant and collection summaries.

### 3. Tenant Features
- Register as a tenant independently.
- Browse available rental properties and units.
- View property details, address, rent, unit type and available units.
- View property owner information.
- Apply for available rental units.
- Track rental application status.
- Accept or decline approved rental offers.
- View unpaid bills.
- Select multiple bills for combined payment.
- Pay bills securely through Razorpay.
- View recent transactions and payment history.
- View and download PDF payment receipts.
- Upload and download personal documents.
- Submit maintenance complaints with title, category, priority, description and optional photo.
- Track maintenance complaint status.
- Update profile information and profile picture.
- Submit move-out requests.

### 4. Payment Management
- Razorpay payment gateway integration.
- Multiple bill selection and combined checkout.
- Automatic bill reservation during active checkout.
- Server-side payment signature verification.
- Payment confirmation through Razorpay.
- Transaction history for tenants.
- Payment records and receipts.
- PDF receipt generation and download.
- Payment confirmation email notifications.
- Checkout dismissal handling with a retry flow.

### 5. Maintenance Management
- Tenants can submit maintenance complaints.
- Complaints are automatically associated with the tenant, owner, property and unit.
- Optional photo upload through Cloudinary.
- Owners receive email notifications for new complaints.
- Owners can update complaint status:
  - Pending
  - In Progress
  - Resolved
  - Rejected
- Owners can add remarks to maintenance complaints.
- Tenants can track complaint progress.

### 6. Document Management
- Owners can upload property-level documents.
- Owners can upload documents for individual tenants.
- Tenants can upload personal documents.
- View and download uploaded documents.
- Delete documents where permitted.
- Cloudinary integration for file storage.

### 7. Platform Features
- Role-based access control.
- Protected API routes.
- Secure session cookies.
- Rate-limited authentication and registration.
- Email notifications.
- Contact form.
- Backend health-check endpoint.
- Swagger API documentation.
- Responsive UI.
- Light and dark theme support.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| API Integration | Axios |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT, Email OTP |
| Payment Gateway | Razorpay |
| Email Service | Brevo |
| File Storage | Cloudinary |
| File Uploads | Multer |
| PDF Generation | PDFKit |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## Application Architecture

```text
                 ┌──────────────────────┐
                 │       Users          │
                 │   Owner / Tenant     │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    React Frontend    │
                 │      Vercel          │
                 └──────────┬───────────┘
                            │
                       API Requests
                            │
                            ▼
                 ┌──────────────────────┐
                 │    Express Backend   │
                 │       Render         │
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
│   │
│   └── src/
│       ├── config/
│       │
│       ├── controllers/
│       │   ├── user.controller.js
│       │   ├── tenant.controller.js
│       │   ├── property.controller.js
│       │   ├── unit.controller.js
│       │   ├── bill.controller.js
│       │   ├── order.controller.js
│       │   ├── payment.controller.js
│       │   ├── maintenance.controller.js
│       │   └── dashboard.controller.js
│       │
│       ├── models/
│       │
│       ├── routes/
│       │
│       └── utils/
│
├── Frontend/
│   ├── public/
│   │
│   └── src/
│       ├── ApiClient/
│       ├── common/
│       ├── context/
│       │
│       └── pages/
│           ├── auth/
│           ├── Owner/
│           ├── Tenant/
│           ├── About/
│           ├── Contact/
│           └── Hero/
│
└── PROJECT_SPEC.md
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later.
- MongoDB replica set (MongoDB Atlas recommended).
- Razorpay account and API credentials.
- Cloudinary account.
- Brevo account and API key.

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

```bash
cd ../Frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `Backend` directory.

```env
PORT=5000
MONGO_URL=your_mongodb_connection_string

JWT_SECRET_KEY=your_jwt_secret
OTP_SECRET_KEY=your_otp_secret

NODE_ENV=development
TRUST_PROXY=0

BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=your_verified_sender_email

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create a `.env` file inside the `Frontend` directory.

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Important:** Never commit environment files, API keys or secrets to GitHub.

### 5. Configure Frontend API Proxy

In `Frontend/vite.config.js`, configure the local backend proxy:

```js
server: {
  proxy: {
    "/api": {
      target: "http://localhost:5000",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
  },
},
```

Keep this inside your existing Vite configuration.

### 6. Run the Backend

```bash
cd Backend
npm run dev
```

### 7. Run the Frontend

Open another terminal:

```bash
cd Frontend
npm run dev
```

Open the local URL provided by Vite.

---

## Main Application Workflows

### Tenant Rental Application Workflow

1. Tenant creates an account.
2. Tenant logs in using email OTP.
3. Tenant browses available properties and units.
4. Tenant selects a unit and submits a rental application.
5. Owner reviews the application.
6. Owner approves or rejects the application.
7. Tenant accepts or declines an approved offer.
8. On acceptance, the tenancy is activated and the unit becomes occupied.

### Bill Payment Workflow

1. Owner creates bills for the tenant.
2. Tenant views unpaid bills.
3. Tenant selects one or multiple bills.
4. Backend creates an order and reserves the selected bills.
5. Tenant completes payment using Razorpay.
6. Backend verifies the payment.
7. Payment is recorded and bills are updated.
8. Tenant can view the transaction and download the PDF receipt.

### Maintenance Workflow

1. Tenant submits a maintenance complaint.
2. Complaint is linked to the relevant property, unit and owner.
3. Optional complaint photo is uploaded.
4. Owner receives an email notification.
5. Owner reviews the complaint and updates its status.
6. Tenant tracks the complaint status.

---

## API Documentation

Swagger documentation is available through:

```text
/api-docs
```

Main API modules include:

| Module | Functionality |
|---|---|
| Authentication | Registration, OTP login, verification and logout |
| User | Owner profile and account management |
| Tenant | Tenant registration, profile and tenancy management |
| Property | Property CRUD operations |
| Unit | Unit management |
| Rental Request | Rental applications and approval workflow |
| Bill | Tenant bill creation and management |
| Order | Bill selection and payment order creation |
| Payment | Razorpay verification, transactions and receipts |
| Document | Document upload, download and management |
| Maintenance | Complaint submission and status management |
| Dashboard | Owner dashboard statistics |
| Contact | Contact form submissions |

---

## Security and Important Notes

- Passwordless OTP authentication.
- JWT authentication using httpOnly cookies.
- Role-based authorization.
- OTP rate limiting.
- Server-side Razorpay payment verification.
- MongoDB transactions for payment settlement.
- Aadhaar and PAN values must not be exposed in API responses or logs.
- Never commit secrets or environment files.
- A MongoDB replica set is required for transaction-based operations.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Payments | Razorpay |
| Email | Brevo |
| File Storage | Cloudinary |

**Live Application:** https://rent-guard-1.vercel.app

---

## Author

**Harneet Singh**

GitHub: https://github.com/harneetsingh46
