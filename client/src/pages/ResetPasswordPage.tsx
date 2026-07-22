import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { instance } from '../api/axios.api';
import { toast } from 'react-toastify';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Токен отсутствует');
      return;
    }
    if (password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
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
          <input
            type="password"
            placeholder="Новый пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3D5B82]"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3D5B82]"
            required
            minLength={6}
          />
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