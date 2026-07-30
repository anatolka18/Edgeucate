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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Недействительная ссылка</h2>
          <p className="text-gray-600">Токен отсутствует. Запросите сброс пароля заново.</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 px-6 py-2 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E] transition-colors"
          >
            На страницу входа
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-2xl font-bold text-center mb-6">Сброс пароля</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Новый пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3D5B82]"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-12 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#3D5B82] ${confirmPassword && password !== confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
              required
              minLength={8}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3D5B82] text-white py-2 rounded hover:bg-[#273b56] transition disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}