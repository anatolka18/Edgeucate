import { FC } from "react";
import { NavLink } from "react-router-dom";
import "../index.css";

const Header: FC = () => {
    return (
        <header className="flex flex-wrap items-center justify-between px-4 py-2 bg-white shadow-md gap-4 font-montserrat">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">Edgeucate</span>
                </div>
                <NavLink
                    to="/"
                    className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                >
                    Главная
                </NavLink>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4 flex-wrap justify-end">
                <NavLink
                    to="/auth"
                    className="px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-black rounded-md"
                >
                    Мой аккаунт
                </NavLink>
            </div>
        </header>
    );
};

export default Header;