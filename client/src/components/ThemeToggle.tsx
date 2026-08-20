import { FC } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
      aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </button>
  );
};
