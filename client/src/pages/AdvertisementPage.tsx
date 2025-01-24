import React, { useState, useCallback, useEffect } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { IAdvertisement } from "../types/advertisement";
import { IFeedback } from "../types/user";
import { useMyProfile } from "../hooks/useMyProfile";
import FeedbackForm from "../components/FeedbackForm";

interface IAdvertisementResponse {
  advertisement: IAdvertisement;
  feedbacks: IFeedback[];
}

export const advertisementDetailLoader = async ({ params }: any) => {
  const { id } = params;
  const { data } = await instance.get<IAdvertisementResponse>(`/advertisement/${id}`);
  return data;
};

const AdvertisementPage: React.FC = () => {
  const initialData = useLoaderData() as IAdvertisementResponse;
  const [data, setData] = useState<IAdvertisementResponse>(initialData);
  const myProfile = useMyProfile();
  const { id } = useParams();
  const isAdmin = myProfile?.role === 'Admin';
  const navigate = useNavigate();

  const loadFreshData = useCallback(async () => {
    try {
      const { data: updatedData } = await instance.get<IAdvertisementResponse>(
        `/advertisement/${id}`
      );
      setData(updatedData);
    } catch (error) {
      console.error("Ошибка при обновлении данных:", error);
      toast.error("Не удалось обновить данные");
    }
  }, [id]);

  const handleDeleteAdvertisement = useCallback(async () => {
    try {
      if (!data.advertisement) return;
      const advertisementId = data.advertisement.advertisementId;
      await instance.delete(`/advertisement/${advertisementId}`);
      toast.success("Объявление успешно удалено");
      navigate('/search');
    } catch (error) {
      console.error("Ошибка при удалении объявления:", error);
      toast.error("Не удалось удалить объявление");
    }
  }, [data.advertisement, navigate]);

  const handleDeleteFeedback = useCallback(async (username: string) => {
    try {
      if (!data.advertisement) return;
      const teacherEmail = data.advertisement.email;
      const advertisementId = data.advertisement.advertisementId;
      await instance.delete(`/feedback/delete/${teacherEmail}/${advertisementId}/${username}`);
      toast.success("Отзыв успешно удален");
      await loadFreshData();
    } catch (error) {
      console.error("Ошибка при удалении отзыва:", error);
      toast.error("Не удалось удалить отзыв");
    }
  }, [data.advertisement, loadFreshData]);

  const handleFeedbackAdded = useCallback(async () => {
    await loadFreshData();
  }, [loadFreshData]);

  useEffect(() => {
    loadFreshData();
  }, [loadFreshData]);

  if (!data?.advertisement) {
    return <div className="p-8 font-montserrat text-center">Объявление не найдено</div>;
  }

  const { advertisement, feedbacks } = data;

  return (
    <div className="p-8 font-montserrat">
      <div className="max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="w-40 h-40 bg-gray-200 rounded-md flex items-center justify-center mr-6 mb-4 md:mb-0">
            <span className="text-4xl font-bold text-gray-400">
              {advertisement.creator?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{advertisement.creator}</h1>
            <p className="text-gray-700 mb-4">{advertisement.title}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">
                  Рейтинг: <span className="text-yellow-500">{advertisement.stars.toFixed(1)}★</span>
                </p>
                <p className="text-lg font-semibold">
                  Цена: <span className="font-normal">{advertisement.price} ₽/час</span>
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={handleDeleteAdvertisement}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white"
                  title="Удалить объявление"
                >
                  Удалить объявление
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">О преподавателе</h2>
        <p className="text-gray-700">{advertisement.aboutTeacher}</p>
      </div>

      <div className="max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">О занятии</h2>
        <p className="text-gray-700">{advertisement.aboutAdvertisement}</p>
      </div>

      <div className="max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Отзывы учеников</h2>
        <div className="mb-4">
          <p className="text-2xl font-bold text-yellow-500">{advertisement.stars.toFixed(1)}★</p>
          <p className="text-gray-700">{feedbacks?.length || 0} отзывов</p>
        </div>

        {myProfile && myProfile.email !== advertisement.email && (
          <FeedbackForm
            advertisementId={advertisement.advertisementId}
            teacherEmail={advertisement.email}
            advertisementTitle={advertisement.title}
            onFeedbackAdded={handleFeedbackAdded}
          />
        )}

        {feedbacks && feedbacks.length > 0 ? (
          <div className="mt-6 space-y-6">
            {feedbacks.map((feedback, index) => (
              <div className="flex flex-col sm:flex-row border-b border-gray-200 pb-4 last:border-b-0" key={index}>
                <div className="flex items-start mb-3 sm:mb-0 sm:mr-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-400">
                      {feedback.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-bold">{feedback.username}</p>
                    <p className="text-gray-600 text-sm">
                      {new Date(feedback.date).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteFeedback(feedback.username)}
                        className="px-2 py-1 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white text-sm"
                        title="Удалить отзыв"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                  <div className="flex items-center mt-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < feedback.stars ? "text-yellow-500" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700">{feedback.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Пока нет отзывов</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertisementPage;