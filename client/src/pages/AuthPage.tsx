import { FC, useState, useEffect } from 'react'
import { AuthService } from '../services/auth.service'
import { toast } from 'react-toastify'
import { useAppDispatch } from '../store/hooks'
import { login } from '../store/user/userSlice'
import { useNavigate } from 'react-router-dom';
import Logo from "../assets/Logo.png";
import { ensureSocket } from '../App';
import { accessToken } from '../store/auth-state';
import { instance } from '../api/axios.api';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage: FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('Student');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordTwo, setPasswordTwo] = useState('');
    const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordTwo, setShowPasswordTwo] = useState(false);

    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api', { credentials: 'include' }).catch(() => {});
    }, []);

    const loginHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const dataLogin = await AuthService.login({ email, password });

            if (dataLogin?.accessToken) {
                dispatch(login(dataLogin));
                ensureSocket(accessToken!);
                toast.success('Вы успешно вошли в систему.');
                navigate('/');
            }
        } catch (err: any) {
            if (err.message.startsWith('BLOCKED:')) {
                const reason = err.message.split(':')[1];
                setBlockReason(reason);
                setIsBlockedModalOpen(true);
            } else if (err.response?.status === 401) {
                const message = err.response?.data?.message || '';
                if (message.includes('Подтвердите email')) {
                    toast.error('Подтвердите email, перейдя по ссылке в письме');
                } else {
                    toast.error('Неверный email или пароль');
                }
            } else {
                toast.error(err.response?.data?.message || err.message || "Ошибка авторизации");
            }
        }
    };

    const registrationHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== passwordTwo) {
            toast.error("Пароли не совпадают!");
            return;
        }

        try {
            const dataRegist = await AuthService.registration({ username, password, email, role })

            if (dataRegist) {
                toast.success('Аккаунт создан! На вашу почту отправлено письмо с подтверждением.');
                setIsLogin(true);
                setEmail('');
                setPassword('');
                setPasswordTwo('');
                setUsername('');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'Ошибка при регистрации');
        }
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            toast.error('Введите email');
            return;
        }
        setResetLoading(true);
        try {
            await instance.post('/auth/forgot-password', { email: resetEmail });
            toast.success('Если аккаунт существует, письмо отправлено');
            setShowForgotPassword(false);
            setResetEmail('');
        } catch {
            toast.error('Ошибка при отправке письма');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 font-montserrat">
            {isBlockedModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Аккаунт заблокирован</h2>
                        <p className="mb-4">Ваш аккаунт был заблокирован администратором.</p>
                        <p className="mb-4 font-semibold">Причина:</p>
                        <div className="bg-gray-100 p-3 rounded mb-4">
                            <p className="text-gray-800">{blockReason}</p>
                        </div>
                        <button
                            onClick={() => setIsBlockedModalOpen(false)}
                            className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white"
                        >
                            Понятно
                        </button>
                    </div>
                </div>
            )}

            {showForgotPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Восстановление пароля</h2>
                        <p className="text-sm text-gray-600 mb-4">Введите email, на который отправить ссылку для сброса пароля.</p>
                        <input
                            type="email"
                            placeholder="Email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full mb-3 p-2 border border-gray-300 rounded"
                            autoComplete="email"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowForgotPassword(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleForgotPassword}
                                disabled={resetLoading}
                                className="px-4 py-2 bg-[#3D5B82] text-white rounded hover:bg-[#273b56] transition disabled:opacity-50"
                            >
                                {resetLoading ? 'Отправка...' : 'Отправить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-200 p-6 rounded-lg shadow-lg w-[400px]">
                <div className="flex justify-center mb-4">
                    <img src={Logo} alt="Logo" className="h-12" />
                </div>

                <h2 className="text-center text-xl font-semibold mb-6">{isLogin ? 'Вход' : 'Регистрация'}</h2>

                <form onSubmit={isLogin ? loginHandler : registrationHandler}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Ваше имя"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full mb-3 p-2 border border-gray-300 rounded"
                            autoComplete="username"
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full mb-3 p-2 border border-gray-300 rounded"
                        autoComplete="email"
                        required
                    />

                    <div className="relative mb-3">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 pr-10 border border-gray-300 rounded"
                            autoComplete="current-password"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="relative mb-3">
                            <input
                                type={showPasswordTwo ? 'text' : 'password'}
                                placeholder="Подтвердите пароль"
                                value={passwordTwo}
                                onChange={(e) => setPasswordTwo(e.target.value)}
                                className="w-full p-2 pr-10 border border-gray-300 rounded"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPasswordTwo(!showPasswordTwo)}
                            >
                                {showPasswordTwo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                    {!isLogin && (
                        <div className="flex justify-between items-center mb-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="Student"
                                    checked={role === 'Student'}
                                    onChange={() => setRole('Student')}
                                    className="mr-2"
                                    required
                                />
                                Студент
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="Teacher"
                                    checked={role === 'Teacher'}
                                    onChange={() => setRole('Teacher')}
                                    className="mr-2"
                                />
                                Репетитор
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#3D5B82] text-white py-2 rounded hover:bg-[#273b56] transition"
                    >
                        {isLogin ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-3 w-full text-blue-500 hover:underline"
                >
                    {isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт? Войти'}
                </button>

                {isLogin && (
                    <button
                        onClick={() => setShowForgotPassword(true)}
                        className="mt-2 w-full text-sm text-gray-500 hover:text-[#3D5B82] hover:underline transition"
                    >
                        Забыли пароль?
                    </button>
                )}
            </div>
        </div>
    )
}

export default AuthPage