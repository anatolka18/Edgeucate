import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { instance } from '../api/axios.api';
import { toast } from 'react-toastify';

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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82] mx-auto"></div>
          <p className="mt-4 text-gray-600">Подтверждение email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'success' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email подтверждён!</h2>
            <p className="text-gray-600">Теперь вы можете войти в свой аккаунт.</p>
            <p className="text-sm text-gray-400 mt-4">Перенаправление на страницу входа...</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Что-то пошло не так</h2>
            <p className="text-gray-600">Ссылка недействительна или истекла.</p>
            <button
              onClick={() => navigate('/auth')}
              className="mt-4 px-6 py-2 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E] transition-colors"
            >
              На страницу входа
            </button>
          </>
        )}
      </div>
    </div>
  );
}