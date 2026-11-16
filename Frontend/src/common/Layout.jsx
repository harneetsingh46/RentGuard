import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Layout = () => {
  const { pathname } = useLocation();
  const isSignupPage = pathname === "/signup";
  const isLoginPage = pathname === "/login";
  const isAuthPage = isSignupPage || isLoginPage;

  return (
    <div className={isAuthPage ? "flex h-[100svh] flex-col overflow-hidden" : "flex min-h-screen flex-col"}>
      <Navbar />

      <main className={isAuthPage ? "min-h-0 flex-1 overflow-hidden" : "flex"}>
        <Outlet />
      </main>

      {!isAuthPage && <Footer />}
    </div>
  );
};

export default Layout;