import { FC } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import FullLogo from "../assets/FullLogo.png";

const Footer: FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link to="/" className="flex items-center gap-3 min-w-[44px] min-h-[44px]">
                <img src={FullLogo} alt="Edgeucate" className="h-10" />
              </Link>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Платформа для поиска репетиторов и онлайн-обучения.
            </p>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Навигация</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/" className="block py-2 min-h-[44px] flex items-center text-gray-500 dark:text-gray-400 hover:text-[#3D5B82] transition-colors text-sm">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/search" className="block py-2 min-h-[44px] flex items-center text-gray-500 dark:text-gray-400 hover:text-[#3D5B82] transition-colors text-sm">
                  Поиск репетитора
                </Link>
              </li>
              <li>
                <Link to="/auth" className="block py-2 min-h-[44px] flex items-center text-gray-500 dark:text-gray-400 hover:text-[#3D5B82] transition-colors text-sm">
                  Регистрация
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Контакты</h3>
            <ul className="space-y-1">
              <li>
                <a href="mailto:support@edgeucate.ru" className="flex items-center gap-2 py-2 min-h-[44px] text-sm text-gray-500 dark:text-gray-400 hover:text-[#3D5B82] transition-colors">
                  <Mail className="w-4 h-4 text-[#3D5B82] flex-shrink-0" />
                  <span>support@edgeucate.ru</span>
                </a>
              </li>
              <li>
                <a href="tel:+79991234567" className="flex items-center gap-2 py-2 min-h-[44px] text-sm text-gray-500 dark:text-gray-400 hover:text-[#3D5B82] transition-colors">
                  <Phone className="w-4 h-4 text-[#3D5B82] flex-shrink-0" />
                  <span>+7 (666) 666-66-66</span>
                </a>
              </li>
              <li className="flex items-center gap-2 py-2 min-h-[44px] text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-[#3D5B82] flex-shrink-0" />
                <span>Россия, онлайн</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Мы в сети</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com/anatolka18/Edgeucate"
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-[#3D5B82] hover:text-white transition-all text-gray-600 dark:text-gray-300"
                aria-label="GitHub"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © {new Date().getFullYear()} Edgeucate. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
