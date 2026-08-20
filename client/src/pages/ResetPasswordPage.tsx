import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { instance } from '../api/axios.api';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock } from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Токен отсутствует');
      return;
    }
    if (password.length < 8) {
      toast.error('Пароль должен быть не менее 8 символов');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await instance.post('/auth/reset-password', { token, password });
      toast.success('Пароль успешно изменён!');
      setTimeout(() => navigate('/auth'), 1500);
    } catch {
      toast.error('Недействительная ссылка. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Недействительная ссылка</h2>
          <p className="text-gray-600 dark:text-gray-400">Токен отсутствует. Запросите сброс пароля заново.</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 w-full sm:w-auto px-6 py-3 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E] transition-colors font-medium"
          >
            На страницу входа
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-[400px] mx-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Сброс пароля</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Новый пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 p-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#3D5B82] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-12 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#3D5B82] bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${confirmPassword && password !== confirmPassword ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              minLength={8}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3D5B82] text-white py-3 rounded hover:bg-[#273b56] transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}