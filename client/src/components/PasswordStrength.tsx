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
  <div className="mt-1 text-xs space-y-1">
    <div className="flex items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded-full ${password.length >= PASSWORD_RULES.minLength ? 'bg-[#3D5B82]' : 'bg-gray-300'}`} />
      <span className={password.length >= PASSWORD_RULES.minLength ? 'text-[#3D5B82]' : 'text-gray-500'}>Минимум 8 символов</span>
    </div>
    <div className="flex items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded-full ${PASSWORD_RULES.hasUpper.test(password) ? 'bg-[#3D5B82]' : 'bg-gray-300'}`} />
      <span className={PASSWORD_RULES.hasUpper.test(password) ? 'text-[#3D5B82]' : 'text-gray-500'}>Заглавная буква</span>
    </div>
    <div className="flex items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded-full ${PASSWORD_RULES.hasLower.test(password) ? 'bg-[#3D5B82]' : 'bg-gray-300'}`} />
      <span className={PASSWORD_RULES.hasLower.test(password) ? 'text-[#3D5B82]' : 'text-gray-500'}>Строчная буква</span>
    </div>
    <div className="flex items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded-full ${PASSWORD_RULES.hasDigit.test(password) ? 'bg-[#3D5B82]' : 'bg-gray-300'}`} />
      <span className={PASSWORD_RULES.hasDigit.test(password) ? 'text-[#3D5B82]' : 'text-gray-500'}>Одна цифра</span>
    </div>
  </div>
);

export default PasswordStrength;