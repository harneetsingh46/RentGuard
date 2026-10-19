import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Login } from "./pages/Login";
import Layout from "./common/Layout";
import Signup from "./pages/Signup";
import OwnerDashboard from "./pages/OwnerDashboard";
import TenantDashboard from "./pages/TenantDashboard";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import SignOut from "./pages/SignOut";
import PublicRoutes from "./utils/PublicRoutes";
import OwnerLayout from "./common/OwnerLayout";
import Hero from "./pages/Hero";
import Property from "./pages/Property";
import Tenant from "./pages/Tenant";

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
            element: <Tenant/>,
          },
          {
            path: "/owner/rent",
            element: <div>Rent and Transactions page coming soon</div>,
          },
          {
            path: "/owner/documents",
            element: <div>Documents page coming soon</div>,
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
        path: "/tenant/dashboard",
        element: <TenantDashboard />,
      },
    ],
  },

  // Sign out: any authenticated user
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: "/sign-out",
        element: <SignOut />,
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;