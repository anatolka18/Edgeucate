import React, { useState, useCallback, useEffect } from "react";
import { useLoaderData, useNavigate, useParams, NavLink } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { IAdvertisement } from "../types/advertisement";
import { IFeedback } from "../types/user";
import { useMyProfile } from "../hooks/useMyProfile";
import FeedbackForm from "../components/FeedbackForm";
import { Star, User } from "lucide-react";

interface IAdvertisementResponse {
  advertisement: IAdvertisement;
  feedbacks: IFeedback[];
}

export const advertisementDetailLoader = async ({ params }: any) => {
  const { id } = params;
  if (!id) throw new Error("ID is required");
  const { data } = await instance.get<IAdvertisementResponse>(`/advertisement/${id}`);
  return data;
};

const AdvertisementPage: React.FC = () => {
  const initialData = useLoaderData() as IAdvertisementResponse;
  const [data, setData] = useState<IAdvertisementResponse>(initialData);
  const myProfile = useMyProfile();
  const { id } = useParams();
  const isAdmin = myProfile?.role === "Admin";
  const navigate = useNavigate();

  const loadFreshData = useCallback(async () => {
    try {
      const { data: updatedData } = await instance.get<IAdvertisementResponse>(
        `/advertisement/${id}`
      );
      setData(updatedData);
    } catch (error) {
      toast.error("Не удалось обновить данные");
    }
  }, [id]);

  const handleDeleteAdvertisement = useCallback(async () => {
    try {
      await instance.delete(`/advertisement/${data.advertisement.advertisementId}`);
      toast.success("Объявление успешно удалено");
      navigate("/search");
    } catch (error) {
      toast.error("Не удалось удалить объявление");
    }
  }, [data.advertisement, navigate]);

  const handleDeleteFeedback = useCallback(
    async (username: string) => {
      try {
        const teacherEmail = data.advertisement.email;
        const advertisementId = data.advertisement.advertisementId;
        await instance.delete(`/feedback/delete/${teacherEmail}/${advertisementId}/${username}`);
        toast.success("Отзыв успешно удален");
        await loadFreshData();
      } catch (error) {
        toast.error("Не удалось удалить отзыв");
      }
    },
    [data.advertisement, loadFreshData]
  );

  useEffect(() => {
    loadFreshData();
  }, []);

  if (!data?.advertisement) {
    return <div className="p-4 md:p-8 text-center">Объявление не найдено</div>;
  }

  const { advertisement, feedbacks } = data;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-xl flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
              <span className="text-white font-bold text-3xl">
                {advertisement.creator?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-1">{advertisement.creator}</h1>
              <p className="text-gray-600 mb-2">{advertisement.title}</p>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{advertisement.stars?.toFixed(1) ?? '0'}</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="font-semibold text-lg">{advertisement.price} ₽/час</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {myProfile && myProfile.email !== advertisement.email && (
                  <NavLink
                    to={`/chat/${advertisement.email}`}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium min-h-[44px] flex items-center justify-center"
                  >
                    Написать сообщение
                  </NavLink>
                )}
                {isAdmin && (
                  <button
                    onClick={handleDeleteAdvertisement}
                    className="px-4 py-3 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium min-h-[44px]"
                  >
                    Удалить объявление
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">О преподавателе</h2>
          <p className="text-gray-700 leading-relaxed break-words">{advertisement.aboutTeacher || "Информация не указана"}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">О занятии</h2>
          <p className="text-gray-700 leading-relaxed break-words">{advertisement.aboutAdvertisement}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4">
            Отзывы учеников
            <span className="text-gray-400 font-normal ml-2">({feedbacks?.length || 0})</span>
          </h2>

          {myProfile && myProfile.email !== advertisement.email && (
            <FeedbackForm
              advertisementId={advertisement.advertisementId}
              teacherEmail={advertisement.email}
              advertisementTitle={advertisement.title}
              onFeedbackAdded={loadFreshData}
            />
          )}

          {feedbacks && feedbacks.length > 0 ? (
            <div className="mt-6 space-y-4">
              {feedbacks.map((feedback, index) => (
                <div key={feedback.username + index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <span className="font-semibold break-words">{feedback.username}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < feedback.stars
                                    ? "text-yellow-500 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteFeedback(feedback.username)}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 min-h-[32px] rounded hover:bg-red-50 transition-colors"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 break-words">{feedback.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(feedback.date).toLocaleDateString("ru-RU", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-gray-400">Пока нет отзывов</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertisementPage;