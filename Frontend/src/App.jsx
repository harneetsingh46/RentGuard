import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Login } from "../src/pages/auth/Login";
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
import Rent from "../src/pages/Owner/Rent";
import TenantRent from "./pages/Tenant/TenantRent";
import Documents from "../src/pages/Owner/Documents";
import OwnerProfile from "../src/pages/Owner/OwnerProfile";
import TenantDocument from "./pages/Tenant/TenantDocument";
import TenantLayout from "./common/TenantLayout";
import TenantProfile from "./pages/Tenant/TenantProfile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Maintenance from "./pages/Tenant/Maintenance";

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

  // Owner pages: fixed sidebar + independently scrollable page
  {
    element: <ProtectedRoutes requiredRole="owner" />,
    children: [
      {
        element: <OwnerLayout />,
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
            path: "/owner/rent",
            element: <Rent />,
          },
          {
            path: "/owner/documents",
            element: <Documents />
          },
          {
            path: "/owner/documents/:propertyId",
            element: <Documents />
          },
          {
            path: "/owner/profile",
            element: <OwnerProfile />
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
            path: "/tenant/rent",
            element: <TenantRent />,
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