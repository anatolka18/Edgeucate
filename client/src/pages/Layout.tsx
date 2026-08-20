import { FC } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Layout: FC = () => {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
};

export default Layout;