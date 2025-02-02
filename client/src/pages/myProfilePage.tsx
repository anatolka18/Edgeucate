import { FC, useState } from 'react';
import { removeTokenFromLocalStorage } from '../helpers/localstorage.helper';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { toast } from 'react-toastify';
import { MySocket } from "../App";
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

    const logoutHandler = () => {
        dispatch(logout());
        removeTokenFromLocalStorage('token');
        toast.success('Вы вышли из аккаунта');
        if (MySocket.socket) {
            MySocket.socket.disconnect();
            MySocket.socket = null;
        }
        navigate('/');
    };

    const editProfileHandler = () => {
        setModalOpen(true);
    };

    const saveProfileHandler = async (newDescription: string) => {
        try {
            const updateDto = { email: profile?.email, description: newDescription };
            const { data } = await instance.put<IUser>('/profile', updateDto);
            setDescription(data.description);
            toast.success('Информация обновлена.');
        } catch (err: any) {
            const error = err.response?.data.message;
            toast.error(error.toString());
        }
        setModalOpen(false);
    };

    return (
        <div className="flex flex-col items-center min-h-screen font-montserrat py-10">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mb-12">
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
                            <h2 className="text-xl font-bold">Редактировать информацию о пользователе</h2>
                            <textarea
                                className="w-full p-2 border rounded"
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <div className="flex justify-end space-x-4">
                                <button
                                    className="py-2 px-4 bg-red-400 hover:bg-red-600 rounded"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Отмена
                                </button>
                                <button
                                    className="py-2 px-4 bg-[#96C3D6] hover:bg-[#3D5B82] text-white rounded"
                                    onClick={() => saveProfileHandler(description)}
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <div className="h-40 w-40 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-4xl font-bold text-gray-400">{profile?.username?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profile?.username}</h2>
                            <p className="text-gray-600 text-lg">Email: {profile?.email || "Не указано"}</p>
                            <p className="text-gray-600 text-lg">Роль: {profile?.role || "Не указана"}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Подробная информация о пользователе</h3>
                    <p className="text-gray-800 leading-6">
                        {profile?.description || "Информация не указана"}
                    </p>
                </div>

                <div className="flex justify-between p-8">
                    <button
                        className="bg-red-400 text-black py-2 px-6 rounded hover:bg-red-600 transition"
                        onClick={logoutHandler}
                    >
                        Выйти из аккаунта
                    </button>
                    <button
                        className="text-black py-2 px-6 rounded bg-[#96C3D6] hover:bg-[#3D5B82] transition"
                        onClick={editProfileHandler}
                    >
                        Редактировать профиль
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyProfilePage;