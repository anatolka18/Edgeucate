import { FC, useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
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
  LifeBuoy,
} from "lucide-react";

const Header: FC = () => {
  const isAuth = useAuth();
  const profile = useMyProfile();
  const isTeacher = profile?.role === Role.TEACHER;
  const isAdmin = profile?.role === Role.ADMIN;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px] ${
      isActive
        ? "bg-[#3D5B82] text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 min-w-[44px] min-h-[44px]">
            <img src={FullLogo} alt="Edgeucate" className="h-10" />
          </Link>

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
                <span>Объявления</span>
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
            {isAuth && (
              <NavLink to="/chat/admin@yandex.ru" className={navLinkClass}>
                <LifeBuoy className="w-4 h-4" />
                <span>Поддержка</span>
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

          <div className="flex items-center gap-2">
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

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-16 bg-black/30 z-40"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <nav className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 py-3 px-4 space-y-1 z-50 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <NavLink to="/" className={navLinkClass} end onClick={closeMobileMenu}>
              <BookOpen className="w-5 h-5" />
              <span>Главная</span>
            </NavLink>
            <NavLink to="/search" className={navLinkClass} onClick={closeMobileMenu}>
              <Search className="w-5 h-5" />
              <span>Поиск</span>
            </NavLink>
            {isAuth && isTeacher && (
              <NavLink to="/myadvertisement" className={navLinkClass} onClick={closeMobileMenu}>
                <BookOpen className="w-5 h-5" />
                <span>Объявления</span>
              </NavLink>
            )}
            {isAuth && !isAdmin && (
              <NavLink to="/calendar" className={navLinkClass} onClick={closeMobileMenu}>
                <Calendar className="w-5 h-5" />
                <span>Календарь</span>
              </NavLink>
            )}
            {isAuth && (
              <NavLink to="/chats" className={navLinkClass} onClick={closeMobileMenu}>
                <MessageCircle className="w-5 h-5" />
                <span>Чаты</span>
              </NavLink>
            )}
            {isAuth && (
              <NavLink to="/chat/admin@yandex.ru" className={navLinkClass} onClick={closeMobileMenu}>
                <LifeBuoy className="w-5 h-5" />
                <span>Поддержка</span>
              </NavLink>
            )}
            {isAuth && !isAdmin && (
              <NavLink to="/rooms" className={navLinkClass} onClick={closeMobileMenu}>
                <Video className="w-5 h-5" />
                <span>Комнаты</span>
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin/users" className={navLinkClass} onClick={closeMobileMenu}>
                <Shield className="w-5 h-5" />
                <span>Пользователи</span>
              </NavLink>
            )}
          </nav>
        </>
      )}
    </header>
  );
};

export default Header;