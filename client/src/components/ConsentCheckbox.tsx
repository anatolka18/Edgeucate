import { FC } from 'react';
import { Link } from 'react-router-dom';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
  id?: string;
}

const ConsentCheckbox: FC<ConsentCheckboxProps> = ({
  checked,
  onChange,
  compact = false,
  id = 'consent-checkbox',
}) => {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 cursor-pointer select-none ${compact ? 'mt-3 mb-4' : 'mt-1 mb-4'}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 min-w-[20px] rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5B82] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 cursor-pointer accent-[#3D5B82] transition-shadow"
        required
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 leading-relaxed`}>
        Я согласен(на) на обработку персональных данных и принимаю условия{' '}
        <Link
          to="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3D5B82] dark:text-[#96C3D6] font-medium hover:underline focus:outline-none focus-visible:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Политики конфиденциальности
        </Link>{' '}
        и{' '}
        <Link
          to="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3D5B82] dark:text-[#96C3D6] font-medium hover:underline focus:outline-none focus-visible:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Пользовательского соглашения
        </Link>
      </span>
    </label>
  );
};

export default ConsentCheckbox;