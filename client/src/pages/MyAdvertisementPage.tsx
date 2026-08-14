import { FC, useState } from 'react';
import { useMyProfile } from '../hooks/useMyProfile';
import { instance } from '../api/axios.api';
import { IAdvertisement } from '../types/advertisement';
import { toast } from 'react-toastify';
import { useLoaderData } from 'react-router-dom';
import { allSubjects } from '../config/subjects';
import { authReadyPromise, accessToken } from '../store/auth-state';

export const myAdvertisementLoader = async () => {
  await authReadyPromise;
  if (!accessToken) {
    return [];
  }
  try {
    const { data } = await instance.post<IAdvertisement[]>(`/advertisement/my`, { email: "" });
    return data;
  } catch {
    return [];
  }
};

const getAvatarUrl = (avatar?: string): string | null => {
    if (!avatar || avatar === 'default.png') return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/avatars/')) return avatar;
    return null;
};

const MyAdvertisementPage: FC = () => {
    const profile = useMyProfile();
    const [myAdvertisements, setMyAdvertisements] = useState<IAdvertisement[]>(
        useLoaderData() as IAdvertisement[]
    );

    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [aboutAdvertisement, setAboutAdvertisement] = useState("");
    const [price, setPrice] = useState(1000);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentId, setCurrentId] = useState("");

    const avatarUrl = getAvatarUrl(profile?.avatar);

    const handleCreate = () => {
        setTitle("");
        setSubject("");
        setAboutAdvertisement("");
        setPrice(1000);
        setIsEditing(false);
        setModalOpen(true);
    };

    const handleEdit = (id: string) => {
        const ad = myAdvertisements.find(ad => ad.advertisementId === id);
        if (ad) {
            setCurrentId(id);
            setTitle(ad.title);
            setSubject(ad.subject);
            setAboutAdvertisement(ad.aboutAdvertisement);
            setPrice(ad.price);
            setIsEditing(true);
            setModalOpen(true);
        }
    };

    const handleDelete = (id: string) => {
        instance.delete(`/advertisement/${id}`)
            .then(() => {
                setMyAdvertisements(prevAds => prevAds.filter(ad => ad.advertisementId !== id));
                toast.success('Объявление удалено');
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || 'Ошибка при удалении объявления');
            });
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setIsEditing(false);
    };

    const createAdvertisementHandler = async () => {
        try {
            const createDto = {
                title,
                subject,
                aboutAdvertisement,
                email: profile?.email,
                price
            };
            const { data } = await instance.post<IAdvertisement>('/advertisement/create', createDto);
            setMyAdvertisements(prevAds => [...prevAds, data]);
            toast.success('Объявление создано.');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Ошибка при создании объявления');
        }
        setModalOpen(false);
    };

    const editAdvertisementHandler = async () => {
        try {
            const updateDto = {
                advertisementId: currentId,
                title,
                aboutAdvertisement,
                price
            };
            const { data } = await instance.put<IAdvertisement>('/advertisement/update', updateDto);
            setMyAdvertisements(prevAds =>
                prevAds.map(ad => ad.advertisementId === currentId ? { ...ad, ...data } : ad)
            );
            toast.success('Объявление обновлено.');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Ошибка при обновлении объявления');
        }
        setModalOpen(false);
    };

    return (
        <div className="p-4 md:p-8 font-montserrat min-h-screen relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Мои объявления</h1>
                <button
                    className="w-full sm:w-auto text-black px-4 py-3 rounded-lg bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white transition font-medium min-h-[44px]"
                    onClick={handleCreate}
                >
                    Добавить объявление
                </button>
            </div>

            <div className="flex flex-col items-stretch space-y-4">
                {myAdvertisements.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <p className="text-gray-500">У вас пока нет объявлений</p>
                        <p className="text-gray-400 text-sm mt-2">Нажмите "Добавить объявление" чтобы создать первое</p>
                    </div>
                ) : (
                    myAdvertisements.map((ad) => (
                        <div
                            key={ad.advertisementId}
                            className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow gap-4"
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={ad.creator}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl sm:text-2xl font-bold text-white">
                                        {ad.creator?.[0]?.toUpperCase() || '?'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 w-full text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                    <h3 className="text-lg font-bold">{ad.creator}</h3>
                                    <span className="text-sm text-yellow-500 font-semibold flex-shrink-0">{ad.stars}★</span>
                                </div>
                                <p className="text-sm text-gray-600">{ad.title}</p>
                                <p className="text-sm text-gray-600">{ad.subject}</p>
                                <p className="text-lg font-semibold mt-2">{ad.price} ₽/час</p>
                                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                    <button
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 min-h-[44px] font-medium transition-colors"
                                        onClick={() => handleEdit(ad.advertisementId)}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        className="flex-1 px-4 py-3 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white min-h-[44px] font-medium transition-colors"
                                        onClick={() => handleDelete(ad.advertisementId)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto safe-area-top safe-area-bottom">
                        <h2 className="text-lg sm:text-xl font-bold mb-4">
                            {isEditing ? 'Редактировать объявление' : 'Создать объявление'}
                        </h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 text-sm font-medium">Название объявления:</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                            />
                        </div>
                        {!isEditing && (
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2 text-sm font-medium">Предмет:</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6] bg-white"
                                >
                                    <option value="">Выберите предмет</option>
                                    {allSubjects.map((subj) => (
                                        <option key={subj} value={subj}>{subj}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 text-sm font-medium">Описание:</label>
                            <textarea
                                value={aboutAdvertisement}
                                onChange={(e) => setAboutAdvertisement(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#96C3D6] resize-none"
                                rows={4}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 text-sm font-medium">Цена (₽/час):</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                                min={0}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 min-h-[44px] font-medium"
                                onClick={handleModalClose}
                            >
                                Отмена
                            </button>
                            <button
                                className="px-4 py-3 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black rounded-lg min-h-[44px] font-medium transition-colors"
                                onClick={isEditing ? editAdvertisementHandler : createAdvertisementHandler}
                            >
                                {isEditing ? 'Сохранить' : 'Создать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAdvertisementPage;