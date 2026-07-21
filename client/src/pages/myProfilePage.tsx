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

const MyProfilePage: FC = () => {
    const profile = useMyProfile();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [isModalOpen, setModalOpen] = useState(false);
    const [description, setDescription] = useState(profile?.description || '');
    const [isSaving, setIsSaving] = useState(false);

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
            const error = err.response?.data.message;
            toast.error(error.toString());
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
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
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Сохранение...
                                    </>
                                ) : (
                                    'Сохранить'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProfilePage;