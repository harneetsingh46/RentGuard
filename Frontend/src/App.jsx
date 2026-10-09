import React from 'react'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Login } from './pages/Login'
import Layout from './common/Layout'
import Signup from './pages/Signup'
import OwnerDashboard from './pages/OwnerDashboard'
import TenantDashboard from './pages/TenantDashboard'

const App = () => {
  const router = createBrowserRouter([{
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/signup",
        element: <Signup />
      },
      {
        path: "/owner/dashboard",
        element: <OwnerDashboard/>
      },
      {
        path: "/tenant/dashboard",
        element: <TenantDashboard/>
      }
    ]
  }])
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App