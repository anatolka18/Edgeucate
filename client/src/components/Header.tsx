import { FC } from "react";
import { NavLink } from "react-router-dom";
import FullLogo from "../assets/FullLogo.png";
import "../index.css";
import { useAuth } from "../hooks/useAuth";
import { useMyProfile } from "../hooks/useMyProfile";
import { Role } from "../types/user";

const Header: FC = () => {
    const isAuth = useAuth();
    const isTeacher = useMyProfile()?.role === Role.TEACHER;
    const isAdmin = useMyProfile()?.role === Role.ADMIN;

    return (
        <header className="flex flex-wrap items-center justify-between px-4 py-2 bg-white shadow-md gap-4 font-montserrat">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <img src={FullLogo} alt="Логотип" className="h-12" />
                </div>
                <NavLink
                    to="/"
                    className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                >
                    Главная
                </NavLink>
                <NavLink
                    to="/search"
                    className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                >
                    Поиск
                </NavLink>
                {isAuth && isTeacher && (
                    <NavLink
                        to="/myadvertisement"
                        className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                    >
                        Мои объявления
                    </NavLink>
                )}
                {isAdmin && (
                    <NavLink
                        to="/admin/users"
                        className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                    >
                        Пользователи
                    </NavLink>
                )}
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4 flex-wrap justify-end">
                {isAuth && (
                    <>
                        {!isAdmin && (
                            <NavLink
                                to="/calendar"
                                className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                            >
                                Календарь
                            </NavLink>
                        )}
                        <NavLink
                            to="/chats"
                            className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                        >
                            Чаты
                        </NavLink>
                        {!isAdmin && (
                            <NavLink
                                to="/rooms"
                                className="px-4 py-2 text-gray-800 hover:text-[#3D5B82]"
                            >
                                Комнаты
                            </NavLink>
                        )}
                    </>
                )}
                <NavLink
                    to={isAuth ? "/myprofile" : "/auth"}
                    className="px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-black rounded-md"
                >
                    Мой аккаунт
                </NavLink>
            </div>
        </header>
    );
};

export default Header;