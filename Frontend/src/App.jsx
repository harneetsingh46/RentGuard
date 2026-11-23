import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Login } from "../src/pages/auth/Login";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOwners from "./pages/Admin/AdminOwners";
import AdminTenants from "./pages/Admin/AdminTenants";
import AdminLayout from "./common/AdminLayout";
import Layout from "./common/Layout";
import Signup from "../src/pages/auth/Signup";
import OwnerDashboard from "../src/pages/Owner/OwnerDashboard";
import TenantDashboard from "../src/pages/Tenant/TenantDashboard";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import SignOut from "../src/pages/auth/SignOut";
import PublicRoutes from "./utils/PublicRoutes";
import OwnerLayout from "./common/OwnerLayout";
import Hero from "../src/pages/Hero";
import Property from "../src/pages/Owner/Property";
import Tenant from "../src/pages/Owner/Tenant";
import Bill from "../src/pages/Owner/Bill";
import TenantBills from "./pages/Tenant/TenantBills";
import Documents from "../src/pages/Owner/Documents";
import OwnerProfile from "../src/pages/Owner/OwnerProfile";
import TenantDocument from "./pages/Tenant/TenantDocument";
import TenantLayout from "./common/TenantLayout";
import TenantProfile from "./pages/Tenant/TenantProfile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Maintenance from "./pages/Tenant/Maintenance";
import OwnerMaintenance from "./pages/Owner/OwnerMaintenance";
import BrowseRentals from "./pages/Tenant/BrowseRentals";
import ApprovedOwnerRoute from "./utils/ApprovedOwnerRoute";
import VerificationStatus from "./pages/Owner/VerificationStatus";

const router = createBrowserRouter([
  // Public pages: Navbar + page + Footer
  {
    element: <Layout />,
    children: [
      {
        element: <PublicRoutes />,
        children: [
          {
            path: "/",
            element: <Hero />,
          },
          {
            path: "/login",
            element: <Login />,
          },
          {
            path: "/signup",
            element: <Signup />,
          },
          {
            path: "/about",
            element: <About />,
          },
          {
            path: "/contact",
            element: <Contact />,
          },
        ],
      },
    ],
  },

  // Admin Login: standalone page without public Navbar/Footer
  {
    element: <PublicRoutes />,
    children: [
      {
        path: "/admin/login",
        element: <AdminLogin />,
      },
    ],
  },

  //Admin Protected Routes

  {
    element: <ProtectedRoutes requiredRole="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/admin/dashboard",
            element: <AdminDashboard />,
          },
          {
            path: "/admin/owners",
            element: <AdminOwners />,
          },
          {
            path: "/admin/tenants",
            element: <AdminTenants />,
          },
        ],
      },
    ],
  },

  // Owner pages: fixed sidebar + independently scrollable page
  {
    element: <ProtectedRoutes requiredRole="owner" />,
    children: [
      {
        element: <OwnerLayout />,
        children: [
          {
            element: <ApprovedOwnerRoute />,
            children: [
              {
                path: "/owner/dashboard",
                element: <OwnerDashboard />,
              },
              {
                path: "/owner/properties",
                element: <Property />,
              },
              {
                path: "/owner/tenants",
                element: <Tenant />,
              },
              {
                path: "/owner/bill",
                element: <Bill />,
              },
              {
                path: "/owner/documents",
                element: <Documents />,
              },
              {
                path: "/owner/documents/:propertyId",
                element: <Documents />,
              },
              {
                path: "/owner/maintenance",
                element: <OwnerMaintenance />,
              },
            ],
          },
          {
            path: "/owner/profile",
            element: <OwnerProfile />,
          },
          {
            path: "/owner/verification",
            element: <VerificationStatus />,
          },
        ],
      },
    ],
  },

  // Tenant pages: protected by tenant role
  {
    element: <ProtectedRoutes requiredRole="tenant" />,
    children: [
      {
        element: <TenantLayout />,
        children: [
          {
            path: "/tenant/dashboard",
            element: <TenantDashboard />,
          },
          {
            path: "/tenant/rentals",
            element: <BrowseRentals />,
          },
          {
            path: "/tenant/bills",
            element: <TenantBills />,
          },
          {
            path: "/tenant/documents",
            element: <TenantDocument />
          },
          {
            path: "/tenant/documents/:propertyId",
            element: <TenantDocument />
          },
          {
            path: "/tenant/profile",
            element: <TenantProfile />
          },
          {
            path: "/tenant/maintenance",
            element: <Maintenance />
          }
        ],
      }
    ],
  },

  // Sign out: any authenticated user
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: "/sign-out",
        element: <SignOut />
      }
    ],
  },
]);

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "8px",
            padding: "12px 16px",
          },
        }}
      />
    </>
  )
};

export default App;