import React, { useState, useEffect } from "react";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { useMyProfile } from "../hooks/useMyProfile";
import { Star, Send } from "lucide-react";

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
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
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
      toast.error("Не удалось отправить отзыв");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!myProfile) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
        <p className="text-gray-500">Войдите в систему, чтобы оставить отзыв</p>
      </div>
    );
  }

  if (!canLeaveFeedback) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">{reason || "Вы уже оставили отзыв или не являетесь учеником этого преподавателя"}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Оставить отзыв</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ваша оценка</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStars(value)}
                onMouseEnter={() => setHoveredStar(value)}
                onMouseLeave={() => setHoveredStar(null)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoveredStar !== null ? value <= hoveredStar : value <= stars)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  } transition-colors`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">{stars} из 5</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ваш отзыв</label>
          <textarea
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#96C3D6] focus:border-transparent resize-none"
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
          className="w-full px-4 py-2.5 bg-[#96C3D6] hover:bg-[#3D5B82] text-black font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Отправка..." : "Отправить отзыв"}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;