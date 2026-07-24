import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { toast } from 'react-toastify';
import { MySocket, setAccessToken } from "../store/auth-state";
import { AuthService } from '../services/auth.service';
import { logout } from '../store/user/userSlice';
import { useMyProfile } from '../hooks/useMyProfile';
import { instance } from '../api/axios.api';
import { IUser } from '../types/user';
import { Eye, EyeOff, Lock } from 'lucide-react';

const MyProfilePage: FC = () => {
    const profile = useMyProfile();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [isModalOpen, setModalOpen] = useState(false);
    const [description, setDescription] = useState(profile?.description || '');
    const [isSaving, setIsSaving] = useState(false);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const logoutHandler = async () => {
        await AuthService.logout();
        dispatch(logout());
        toast.success('Вы вышли из аккаунта');
        if (MySocket.socket) {
            MySocket.socket.disconnect();
            MySocket.socket = null;
        }
        setAccessToken(null);
        navigate('/');
    };

    const editProfileHandler = () => {
        setModalOpen(true);
    };

    const saveProfileHandler = async (newDescription: string) => {
        setIsSaving(true);
        try {
            const updateDto = { email: profile?.email, description: newDescription };
            const { data } = await instance.put<IUser>('/profile', updateDto);
            setDescription(data.description);
            toast.success('Информация обновлена.');
            setModalOpen(false);
        } catch (err: any) {
            const msg = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join('. ')
                : err.response?.data?.message || 'Ошибка сохранения';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Новый пароль и подтверждение не совпадают');
            return;
        }
        setIsChangingPassword(true);
        try {
            await instance.post('/auth/change-password', {
                oldPassword,
                newPassword,
            });
            toast.success('Пароль успешно изменён');
            setIsPasswordModalOpen(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            const msg = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join('. ')
                : err.response?.data?.message || 'Ошибка при смене пароля';
            toast.error(msg);
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] rounded-2xl flex items-center justify-center shadow-lg">
                                    <span className="text-4xl font-bold text-white">
                                        {profile?.username?.[0]?.toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl font-bold text-gray-900">{profile?.username}</h1>
                                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm">{profile?.email || "Не указано"}</span>
                                        </div>
                                        <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                                            </svg>
                                            <span className="text-sm capitalize">{profile?.role === 'Teacher' ? 'Учитель' : profile?.role === 'Admin' ? 'Админ' : 'Студент'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-white font-medium rounded-xl transition-colors whitespace-nowrap"
                            >
                                <Lock className="w-4 h-4" />
                                Сменить пароль
                            </button>
                        </div>
                    </div>

                    <div className="p-8 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">О себе</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {profile?.description || "Информация не указана"}
                        </p>
                    </div>

                    <div className="p-8 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={editProfileHandler}
                            className="flex-1 py-3 px-4 bg-[#96C3D6] hover:bg-[#3D5B82] text-white font-medium rounded-xl transition-colors"
                        >
                            Редактировать профиль
                        </button>
                        <button
                            onClick={logoutHandler}
                            className="flex-1 py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors"
                        >
                            Выйти из аккаунта
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Редактировать информацию</h2>
                        <textarea
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96C3D6] resize-none"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Расскажите о себе..."
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                                onClick={() => setModalOpen(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-white rounded-xl transition-colors flex items-center gap-2"
                                onClick={() => saveProfileHandler(description)}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Смена пароля</h2>
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                            <div className="relative">
                                <input
                                    type={showOldPassword ? 'text' : 'password'}
                                    placeholder="Старый пароль"
                                    className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                >
                                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Новый пароль"
                                    className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Подтвердите новый пароль"
                                    className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                                onClick={() => setIsPasswordModalOpen(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-white rounded-xl transition-colors flex items-center gap-2"
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? 'Смена...' : 'Сменить пароль'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProfilePage;