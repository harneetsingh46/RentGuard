import React from 'react'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Login } from './pages/Login'
import Layout from './common/Layout'
import Signup from './pages/Signup'
import OwnerDashboard from './pages/OwnerDashboard'
import TenantDashboard from './pages/TenantDashboard'
import ProtectedRoutes from './utils/ProtectedRoutes'
import SignOut from './pages/SignOut'
import PublicRoutes from './utils/PublicRoutes'
import OwnerLayout from "./common/OwnerLayout";
import Hero from './pages/Hero'

const App = () => {
  const router = createBrowserRouter([{
    element: <Layout />,
    children: [
      {
        element: <PublicRoutes />,
        children: [
          {
            path:"/",
            element:<Hero/>
          },
          {
            path: "/login",
            element: <Login />
          },
          {
            path: "/signup",
            element: <Signup />
          },
        ]
      },
      {
        element: <ProtectedRoutes requiredRole={"owner"} />,
        children: [
          {
            element: <OwnerLayout />,
            children: [
              {
                path: "/owner/dashboard",
                element: <OwnerDashboard />
              },
              {
                path: "/owner/properties",
                element: <div>Properties page coming soon</div>
              },
              {
                path: "/owner/tenants",
                element: <div>Tenants & Rent page coming soon</div>
              },
              {
                path: "/owner/transactions",
                element: <div>Transactions page coming soon</div>
              },
              {
                path: "/owner/documents",
                element: <div>Documents page coming soon</div>
              }
            ]
          }
        ]
      },
      {
        element: <ProtectedRoutes requiredRole={"tenant"} />,
        children: [
          {
            path: "/tenant/dashboard",
            element: <TenantDashboard />
          }
        ]
      },
      {
        element: <ProtectedRoutes />,
        children: [
          {
            path: "/sign-out",
            element: <SignOut />
          }
        ]
      },
    ]
  }])
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App