import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;