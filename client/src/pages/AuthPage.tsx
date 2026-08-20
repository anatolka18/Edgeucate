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
import { Eye, EyeOff, Mail, Lock, GraduationCap, BookOpen } from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        fetch('/api/csrf-token', { credentials: 'include' }).catch(() => {});
    }, []);

    const loginHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            toast.error('Введите корректный email');
            return;
        }

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

        if (!validateEmail(email)) {
            toast.error('Введите корректный email');
            return;
        }
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
        if (!validateEmail(resetEmail)) {
            toast.error('Введите корректный email');
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
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 font-montserrat p-4">
            {isBlockedModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Аккаунт заблокирован</h2>
                        <p className="mb-4 text-gray-700 dark:text-gray-300">Ваш аккаунт был заблокирован администратором.</p>
                        <p className="mb-4 font-semibold text-gray-700 dark:text-gray-300">Причина:</p>
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4">
                            <p className="text-gray-800 dark:text-gray-200 break-words">{blockReason}</p>
                        </div>
                        <button
                            onClick={() => setIsBlockedModalOpen(false)}
                            className="w-full sm:w-auto px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                        >
                            Понятно
                        </button>
                    </div>
                </div>
            )}

            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Восстановление пароля</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Введите email, на который отправить ссылку для сброса пароля.</p>
                        <div className="relative mb-4">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                autoComplete="email"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                onClick={() => setShowForgotPassword(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
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

            <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-[400px] mx-4">
                <div className="flex justify-center mb-4">
                    <img src={Logo} alt="Logo" className="h-12" />
                </div>

                <h2 className="text-center text-xl font-semibold mb-6 text-gray-900 dark:text-white">{isLogin ? 'Вход' : 'Регистрация'}</h2>

                <form onSubmit={isLogin ? loginHandler : registrationHandler}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Ваше имя"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full mb-3 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            autoComplete="username"
                            required
                        />
                    )}

                    <div className="relative mb-3">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full pl-10 pr-3 p-3 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${email && !validateEmail(email) ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="relative mb-3">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-12 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            autoComplete="current-password"
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

                    {!isLogin && (
                        <>
                            <PasswordStrength password={password} />
                            <div className="relative mb-3 mt-3">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <input
                                    type={showPasswordTwo ? 'text' : 'password'}
                                    placeholder="Подтвердите пароль"
                                    value={passwordTwo}
                                    onChange={(e) => setPasswordTwo(e.target.value)}
                                    className={`w-full pl-10 pr-12 p-3 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${passwordTwo && password !== passwordTwo ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
                                    onClick={() => setShowPasswordTwo(!showPasswordTwo)}
                                    aria-label={showPasswordTwo ? 'Скрыть пароль' : 'Показать пароль'}
                                >
                                    {showPasswordTwo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </>
                    )}

                    {!isLogin && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Кто вы?</p>
                            <div className="flex rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setRole('Student')}
                                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] ${
                                        role === 'Student'
                                            ? 'bg-[#3D5B82] text-white shadow-inner'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <GraduationCap className="w-4 h-4" />
                                    Студент
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('Teacher')}
                                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] border-l-2 border-gray-300 dark:border-gray-600 ${
                                        role === 'Teacher'
                                            ? 'bg-[#3D5B82] text-white shadow-inner'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Репетитор
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#3D5B82] text-white py-3 rounded hover:bg-[#273b56] transition font-medium"
                    >
                        {isLogin ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-4 w-full py-2 text-blue-500 dark:text-blue-400 hover:underline"
                >
                    {isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт? Войти'}
                </button>

                {isLogin && (
                    <button
                        onClick={() => setShowForgotPassword(true)}
                        className="mt-2 w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#3D5B82] dark:hover:text-[#96C3D6] hover:underline transition"
                    >
                        Забыли пароль?
                    </button>
                )}
            </div>
        </div>
    )
}

export default AuthPage;