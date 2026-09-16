import { FC, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'edgeucate_cookie_consent';

const CookieConsent: FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 z-50"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Мы используем cookie-файлы для улучшения работы сайта. Продолжая использовать сайт,
            вы соглашаетесь с{' '}
            <Link
              to="/privacy"
              className="text-[#3D5B82] dark:text-[#96C3D6] hover:underline font-medium"
            >
              Политикой конфиденциальности
            </Link>
            .
          </p>
        </div>
        <button
          onClick={handleAccept}
          className="px-6 py-2 bg-[#3D5B82] hover:bg-[#2D4B6E] text-white rounded-lg transition-colors font-medium whitespace-nowrap min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5B82] focus-visible:ring-offset-2"
        >
          Принять
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;