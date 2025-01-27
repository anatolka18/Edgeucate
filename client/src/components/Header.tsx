import { FC, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import FullLogo from "../assets/FullLogo.png";
import { useAuth } from "../hooks/useAuth";
import { useMyProfile } from "../hooks/useMyProfile";
import { Role } from "../types/user";
import {
  Search,
  User,
  BookOpen,
  Calendar,
  MessageCircle,
  Video,
  Menu,
  X,
  Shield,
} from "lucide-react";

const Header: FC = () => {
  const isAuth = useAuth();
  const profile = useMyProfile();
  const isTeacher = profile?.role === Role.TEACHER;
  const isAdmin = profile?.role === Role.ADMIN;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-[#3D5B82] text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-3">
            <img src={FullLogo} alt="Edgeucate" className="h-10" />
          </Link>

          {/* Десктопная навигация */}
          <nav className="hidden lg:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              <BookOpen className="w-4 h-4" />
              <span>Главная</span>
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              <Search className="w-4 h-4" />
              <span>Поиск</span>
            </NavLink>
            {isAuth && isTeacher && (
              <NavLink to="/myadvertisement" className={navLinkClass}>
                <BookOpen className="w-4 h-4" />
                <span>Мои объявления</span>
              </NavLink>
            )}
            {isAuth && !isAdmin && (
              <NavLink to="/calendar" className={navLinkClass}>
                <Calendar className="w-4 h-4" />
                <span>Календарь</span>
              </NavLink>
            )}
            {isAuth && (
              <NavLink to="/chats" className={navLinkClass}>
                <MessageCircle className="w-4 h-4" />
                <span>Чаты</span>
              </NavLink>
            )}
            {isAuth && !isAdmin && (
              <NavLink to="/rooms" className={navLinkClass}>
                <Video className="w-4 h-4" />
                <span>Комнаты</span>
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin/users" className={navLinkClass}>
                <Shield className="w-4 h-4" />
                <span>Пользователи</span>
              </NavLink>
            )}
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-3">
            {isAuth ? (
              <NavLink to="/myprofile" className={navLinkClass}>
                <User className="w-4 h-4" />
                <span className="hidden sm:block">{profile?.username || "Профиль"}</span>
              </NavLink>
            ) : (
              <NavLink to="/auth" className={navLinkClass}>
                <User className="w-4 h-4" />
                <span>Войти</span>
              </NavLink>
            )}

            {/* Мобильное меню */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Мобильная навигация */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-gray-200 space-y-2">
            <NavLink to="/" className={navLinkClass} end onClick={() => setMobileMenuOpen(false)}>
              <BookOpen className="w-4 h-4" />
              <span>Главная</span>
            </NavLink>
            <NavLink to="/search" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
              <Search className="w-4 h-4" />
              <span>Поиск</span>
            </NavLink>
            {isAuth && isTeacher && (
              <NavLink to="/myadvertisement" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <BookOpen className="w-4 h-4" />
                <span>Мои объявления</span>
              </NavLink>
            )}
            {isAuth && !isAdmin && (
              <NavLink to="/calendar" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <Calendar className="w-4 h-4" />
                <span>Календарь</span>
              </NavLink>
            )}
            {isAuth && (
              <NavLink to="/chats" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <MessageCircle className="w-4 h-4" />
                <span>Чаты</span>
              </NavLink>
            )}
            {isAuth && !isAdmin && (
              <NavLink to="/rooms" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <Video className="w-4 h-4" />
                <span>Комнаты</span>
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin/users" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <Shield className="w-4 h-4" />
                <span>Пользователи</span>
              </NavLink>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;