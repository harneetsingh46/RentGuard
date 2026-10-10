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

const App = () => {
  const router = createBrowserRouter([{
    path: "/",
    element: <Layout />,
    children: [
      {
        element: <PublicRoutes />,
        children: [
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
            path: "/owner/dashboard",
            element: <OwnerDashboard />
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