import { FC, useState } from 'react';
import { useMyProfile } from '../hooks/useMyProfile';
import { instance } from '../api/axios.api';
import { IAdvertisement } from '../types/advertisement';
import { toast } from 'react-toastify';
import { useLoaderData } from 'react-router-dom';
import * as jose from 'jose';
import { getTokenFromLocalStorage } from '../helpers/localstorage.helper';
import { allSubjects } from '../config/subjects';

export const myAdvertisementLoader = async () => {
    const token = getTokenFromLocalStorage();
    if (token) {
        const email = jose.decodeJwt(token).email as string;
        const { data } = await instance.post<IAdvertisement[]>(`/advertisement/my`, { email });
        return data;
    }
    return [];
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
        <div className="p-8 font-montserrat min-h-screen relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Мои объявления</h1>
                <button
                    className="text-black px-4 py-2 rounded bg-[#96C3D6] hover:bg-[#3D5B82] transition"
                    onClick={handleCreate}
                >
                    Добавить объявление
                </button>
            </div>

            <div className="flex flex-col items-center space-y-4">
                {myAdvertisements.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">У вас пока нет объявлений</p>
                    </div>
                ) : (
                    myAdvertisements.map((ad) => (
                        <div
                            key={ad.advertisementId}
                            className="w-full max-w-3xl flex items-start border border-gray-200 rounded-lg p-4 shadow-md"
                        >
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                                <span className="text-2xl font-bold text-gray-400">
                                    {ad.creator?.[0]?.toUpperCase() || '?'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold">{ad.creator}</h3>
                                <p className="text-sm text-gray-600">{ad.title}</p>
                                <p className="text-sm text-gray-600">{ad.subject}</p>
                                <p className="text-lg font-semibold mt-2">{ad.price} ₽/час</p>
                                <div className="flex space-x-2 mt-2">
                                    <button
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                        onClick={() => handleEdit(ad.advertisementId)}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white"
                                        onClick={() => handleDelete(ad.advertisementId)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col items-end ml-4">
                                <p className="text-lg font-semibold">{ad.stars}★</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? 'Редактировать объявление' : 'Создать объявление'}
                        </h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Название объявления:</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        {!isEditing && (
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Предмет:</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Выберите предмет</option>
                                    {allSubjects.map((subj) => (
                                        <option key={subj} value={subj}>{subj}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Описание:</label>
                            <textarea
                                value={aboutAdvertisement}
                                onChange={(e) => setAboutAdvertisement(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                rows={4}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Цена (₽/час):</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                min={0}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                onClick={handleModalClose}
                            >
                                Отмена
                            </button>
                            <button
                                className="px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-white rounded-md"
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