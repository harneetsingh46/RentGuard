import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Layout = () => {
  const { pathname } = useLocation();
  const isSignupPage = pathname === "/signup";

  return (
    <div className={isSignupPage ? "flex h-[100svh] flex-col overflow-hidden" : "flex min-h-screen flex-col"}>
      <Navbar />

      <main className={isSignupPage ? "min-h-0 flex-1 overflow-hidden" : "flex"}>
        <Outlet />
      </main>

      {!isSignupPage && <Footer />}
    </div>
  );
};

export default Layout;