import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { instance } from '../api/axios.api';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      toast.error('Токен отсутствует');
      navigate('/auth');
      return;
    }

    instance.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        toast.success('Email подтверждён! Теперь вы можете войти.');
        setTimeout(() => navigate('/auth'), 2000);
      })
      .catch(() => {
        setStatus('error');
        toast.error('Недействительная ссылка. Попробуйте снова.');
        setTimeout(() => navigate('/auth'), 3000);
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Подтверждение email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
        {status === 'success' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email подтверждён!</h2>
            <p className="text-gray-600 dark:text-gray-400">Теперь вы можете войти в свой аккаунт.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">Перенаправление на страницу входа...</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Что-то пошло не так</h2>
            <p className="text-gray-600 dark:text-gray-400">Ссылка недействительна или истекла.</p>
            <button
              onClick={() => navigate('/auth')}
              className="mt-4 w-full sm:w-auto px-6 py-3 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E] transition-colors font-medium"
            >
              На страницу входа
            </button>
          </>
        )}
      </div>
    </div>
  );
}