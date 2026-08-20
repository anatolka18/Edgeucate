import { FC } from 'react';

const PASSWORD_RULES = {
  minLength: 8,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasDigit: /\d/,
};

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: FC<PasswordStrengthProps> = ({ password }) => (
  <div className="mt-2 text-xs space-y-1.5">
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${password.length >= PASSWORD_RULES.minLength ? 'bg-[#3D5B82] dark:bg-[#96C3D6]' : 'bg-gray-300 dark:bg-gray-600'}`} />
      <span className={password.length >= PASSWORD_RULES.minLength ? 'text-[#3D5B82] dark:text-[#96C3D6]' : 'text-gray-500 dark:text-gray-400'}>Минимум 8 символов</span>
    </div>
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PASSWORD_RULES.hasUpper.test(password) ? 'bg-[#3D5B82] dark:bg-[#96C3D6]' : 'bg-gray-300 dark:bg-gray-600'}`} />
      <span className={PASSWORD_RULES.hasUpper.test(password) ? 'text-[#3D5B82] dark:text-[#96C3D6]' : 'text-gray-500 dark:text-gray-400'}>Заглавная буква</span>
    </div>
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PASSWORD_RULES.hasLower.test(password) ? 'bg-[#3D5B82] dark:bg-[#96C3D6]' : 'bg-gray-300 dark:bg-gray-600'}`} />
      <span className={PASSWORD_RULES.hasLower.test(password) ? 'text-[#3D5B82] dark:text-[#96C3D6]' : 'text-gray-500 dark:text-gray-400'}>Строчная буква</span>
    </div>
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PASSWORD_RULES.hasDigit.test(password) ? 'bg-[#3D5B82] dark:bg-[#96C3D6]' : 'bg-gray-300 dark:bg-gray-600'}`} />
      <span className={PASSWORD_RULES.hasDigit.test(password) ? 'text-[#3D5B82] dark:text-[#96C3D6]' : 'text-gray-500 dark:text-gray-400'}>Одна цифра</span>
    </div>
  </div>
);

export default PasswordStrength;