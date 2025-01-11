import { FC } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Layout: FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="fixed top-0 left-0 w-full z-10 bg-white shadow-md">
                <Header />
            </header>
            <main className="flex-grow mt-[64px] px-0">
                <Outlet />
            </main>
            <footer className="flex container container-footer text-area justify- bottom-area shadow-inner footerarea-item">
                <Footer />
            </footer>
        </div>
    );
};

export default Layout;