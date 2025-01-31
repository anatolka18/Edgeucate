import { FC } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Github } from "lucide-react";
import FullLogo from "../assets/FullLogo.png";

const Footer: FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {/* Логотип */}
                <Link to="/" className="flex items-center gap-3">
                    <img src={FullLogo} alt="Edgeucate" className="h-10" />
                </Link>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Платформа для поиска репетиторов и онлайн-обучения.
            </p>
          </div>

          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-500 hover:text-[#3D5B82] transition-colors text-sm">Главная</Link></li>
              <li><Link to="/search" className="text-gray-500 hover:text-[#3D5B82] transition-colors text-sm">Поиск репетитора</Link></li>
              <li><Link to="/auth" className="text-gray-500 hover:text-[#3D5B82] transition-colors text-sm">Регистрация</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-[#3D5B82]" />
                <span>support@edgeucate.ru</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-[#3D5B82]" />
                <span>+7 (999) 123-45-67</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-[#3D5B82]" />
                <span>Россия, онлайн</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Мы в сети</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com/anatolka18/Edgeucate"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-[#3D5B82] hover:text-white transition-all text-gray-600"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Edgeucate. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;