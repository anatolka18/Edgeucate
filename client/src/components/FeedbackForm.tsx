import React, { useState, useEffect } from "react";
import { instance } from "../api/axios.api";
import { toast } from "sonner";
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
  const [justSubmitted, setJustSubmitted] = useState(false);
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

  useEffect(() => {
    if (canLeaveFeedback) {
      setText("");
      setStars(5);
    }
  }, [canLeaveFeedback]);

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
      setJustSubmitted(true);
      setCanLeaveFeedback(false);
      setReason("Вы уже оставили отзыв. Спасибо за обратную связь!");
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
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Войдите в систему, чтобы оставить отзыв</p>
      </div>
    );
  }

  if (!canLeaveFeedback) {
    return (
      <div className={`mt-6 p-4 rounded-lg border ${
        justSubmitted 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-start gap-3">
          {justSubmitted && (
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <p className={`text-sm sm:text-base ${
            justSubmitted ? 'text-green-800 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {reason || "Вы уже оставили отзыв или не являетесь учеником этого преподавателя"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">Оставить отзыв</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ваша оценка</label>
          <div className="flex items-center gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStars(value)}
                onMouseEnter={() => setHoveredStar(value)}
                onMouseLeave={() => setHoveredStar(null)}
                className="p-2 transition-transform hover:scale-110 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label={`Оценка ${value} из 5`}
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 ${
                    (hoveredStar !== null ? value <= hoveredStar : value <= stars)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  } transition-colors`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{stars} из 5</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ваш отзыв</label>
          <textarea
            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#96C3D6] focus:border-transparent resize-none min-h-[100px] text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
          className="w-full px-4 py-3 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black dark:text-white font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Отправка..." : "Отправить отзыв"}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;