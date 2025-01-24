import React, { useState, useEffect } from "react";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { useMyProfile } from "../hooks/useMyProfile";

interface FeedbackFormProps {
  advertisementId: string;
  teacherEmail: string;
  onFeedbackAdded: () => void;
  advertisementTitle?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ 
  advertisementId,
  teacherEmail,
  onFeedbackAdded 
}) => {
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [canLeaveFeedback, setCanLeaveFeedback] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const myProfile = useMyProfile();

  useEffect(() => {
    const checkFeedbackAbility = async () => {
      if (!myProfile?.email) return;
      
      try {
        const { data } = await instance.post("/feedback/can-leave", {
          teacherEmail,
          studentEmail: myProfile.email,
          advertisementId,
        });
        
        setCanLeaveFeedback(data.canLeaveFeedback);
        if (!data.canLeaveFeedback) {
          setReason(data.reason || "Вы не можете оставить отзыв");
        }
      } catch (error) {
        console.error("Ошибка при проверке возможности оставить отзыв:", error);
        setCanLeaveFeedback(false);
        setReason("Произошла ошибка при проверке. Попробуйте позже.");
      }
    };

    checkFeedbackAbility();
  }, [myProfile?.email, teacherEmail, advertisementId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!myProfile?.email || !canLeaveFeedback || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await instance.post("/feedback/create", {
        advertisementId,
        studentEmail: myProfile.email,
        teacherEmail,
        text,
        title: teacherEmail,
        stars,
      });
      
      setText("");
      setStars(5);
      toast.success("Отзыв успешно добавлен");
      onFeedbackAdded();
    } catch (error) {
      console.error("Ошибка при отправке отзыва:", error);
      toast.error("Не удалось отправить отзыв");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!myProfile) {
    return (
      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
        <p>Войдите в систему, чтобы оставить отзыв</p>
      </div>
    );
  }

  if (!canLeaveFeedback) {
    return (
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-700">{reason || "Вы уже оставили отзыв или не являетесь учеником этого преподавателя"}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Оставить отзыв</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Ваша оценка</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStars(value)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  stars >= value 
                    ? "bg-yellow-400 text-white" 
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Ваш отзыв</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Расскажите о вашем опыте обучения..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Отправка..." : "Отправить отзыв"}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;