import { FC, useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Users,
  Search,
  UserPlus,
  Star,
  ArrowRight,
  GraduationCap,
  Shield,
  Video,
  Calendar,
  MessageCircle,
  Award,
  Zap,
  CheckCircle2,
  Quote,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { subjectCategories } from "../config/subjects";

const useCountUp = (end: number, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!startOnView) {
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
};

const testimonials = [
  {
    name: "Анна Петрова",
    role: "Мама ученика",
    text: "Нашли отличного репетитора по математике за один день. Сын поднял оценку с тройки до пятёрки за четверть!",
    rating: 5,
    avatar: "АП",
  },
  {
    name: "Дмитрий Иванов",
    role: "Студент, подготовка к ЕГЭ",
    text: "Благодаря Edgeucate сдал ЕГЭ по физике на 92 балла. Преподаватель объяснял так, как не могли в школе.",
    rating: 5,
    avatar: "ДИ",
  },
  {
    name: "Елена Соколова",
    role: "Репетитор английского",
    text: "Отличная платформа для преподавателей. Удобный календарь, встроенные видеозвонки и стабильный поток учеников.",
    rating: 5,
    avatar: "ЕС",
  },
];

const HomePage: FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.3]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const stats1 = useCountUp(1200);
  const stats2 = useCountUp(95);
  const stats3 = useCountUp(50);
  const stats4 = useCountUp(4);

  const allSubjects = subjectCategories.flatMap((c) => c.subjects).slice(0, 20);

  return (
    <div className="bg-white overflow-hidden">
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D5B82] via-[#4A6FA5] to-[#5B7DB8]">
          <div className="absolute inset-0 opacity-30">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-1/4 w-96 h-96 bg-[#F16E4B]/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#96C3D6]/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/3 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"
            />
          </div>

          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6"
              >
                <Sparkles className="w-4 h-4 text-[#F16E4B]" />
                <span className="text-sm font-medium">Новый формат образования</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6">
                Найдите{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-[#F16E4B] to-[#FFB199] bg-clip-text text-transparent">
                    идеального
                  </span>
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 12"
                    fill="none"
                  >
                    <motion.path
                      d="M2 9C50 2 150 2 198 9"
                      stroke="#F16E4B"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                    />
                  </motion.svg>
                </span>
                <br />
                репетитора
              </h1>

              <p className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed max-w-xl">
                Платформа, которая соединяет учеников с проверенными преподавателями.
                Видеозвонки, календарь, чат — всё в одном месте.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <NavLink
                  to="/search"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F16E4B] hover:bg-[#E05A3B] text-white font-semibold rounded-2xl transition-all shadow-xl shadow-[#F16E4B]/30 hover:shadow-2xl hover:shadow-[#F16E4B]/40 hover:-translate-y-0.5 min-h-[56px]"
                >
                  <Search className="w-5 h-5" />
                  Найти репетитора
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </NavLink>
                <NavLink
                  to="/auth"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold rounded-2xl transition-all border border-white/20 min-h-[56px]"
                >
                  <UserPlus className="w-5 h-5" />
                  Стать репетитором
                </NavLink>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#96C3D6]" />
                  <span>Без комиссий</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#96C3D6]" />
                  <span>Первое занятие — пробное</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#96C3D6]" />
                  <span>Верифицированные учителя</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative h-[500px]">
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-0 bg-white rounded-3xl shadow-2xl p-6 w-80"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-2xl flex items-center justify-center text-white font-bold">
                      МК
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Мария Козлова</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-600">4.9 · Математика</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">ЕГЭ</span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">ОГЭ</span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">5-11 класс</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">1800 ₽<span className="text-sm text-gray-500">/час</span></span>
                    <button className="px-4 py-2 bg-[#3D5B82] text-white text-sm rounded-xl font-medium">
                      Записаться
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-20 left-0 bg-white rounded-2xl shadow-2xl p-5 w-64"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Средний прогресс</p>
                      <p className="text-lg font-bold text-gray-900">+32 балла</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "78%" }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-1/2 left-10 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-2xl shadow-2xl p-4 w-56 text-white"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium">Идёт занятие</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    <span className="text-sm font-medium">Физика · 45 мин</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-0 right-10 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3"
                >
                  <div className="flex -space-x-2">
                    {["АП", "ДИ", "ЕС"].map((avatar, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      >
                        {avatar}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">1200+ отзывов</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium">Прокрутите вниз</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Верифицированные преподаватели</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium">Только лучшие специалисты</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">Быстрый подбор за 24 часа</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Более 50 предметов
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-3 whitespace-nowrap"
          >
            {[...allSubjects, ...allSubjects].map((subject, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-[#3D5B82]" />
                {subject}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 bg-[#3D5B82]/10 text-[#3D5B82] text-sm font-semibold rounded-full mb-4">
              Нам доверяют
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Цифры говорят сами за себя
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { value: stats1.count, suffix: "+", label: "Репетиторов", icon: Users, color: "from-blue-500 to-blue-600", ref: stats1.ref },
              { value: stats2.count, suffix: "%", label: "Довольных учеников", icon: Star, color: "from-yellow-500 to-orange-500", ref: stats2.ref },
              { value: stats3.count, suffix: "+", label: "Предметов", icon: BookOpen, color: "from-purple-500 to-pink-500", ref: stats3.ref },
              { value: stats4.count, suffix: ".9", label: "Средний рейтинг", icon: Award, color: "from-green-500 to-emerald-500", ref: stats4.ref },
            ].map((stat, i) => (
              <motion.div
                key={i}
                ref={stat.ref}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100 group overflow-hidden"
              >
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-2">
                  {stat.value}
                  <span className="text-[#3D5B82]">{stat.suffix}</span>
                </div>
                <p className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-[#F16E4B]/10 text-[#F16E4B] text-sm font-semibold rounded-full mb-4">
              Возможности
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Всё для комфортного обучения
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Одна платформа заменяет десятки сервисов
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 auto-rows-[180px] md:auto-rows-[220px]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 md:row-span-2 relative bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-3xl p-8 md:p-10 overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                    <Video className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Встроенные видеозвонки
                  </h3>
                  <p className="text-white/80 max-w-md leading-relaxed">
                    Занимайтесь прямо в браузере. Никаких Zoom, Skype и других программ.
                    Демонстрация экрана, чат и запись занятий.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs rounded-full">
                    HD качество
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs rounded-full">
                    Демонстрация экрана
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs rounded-full">
                    До 4 человек
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 overflow-hidden group"
            >
              <Calendar className="w-8 h-8 text-[#F16E4B] mb-3" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Умный календарь</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Планируйте занятия без конфликтов и накладок
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 overflow-hidden group"
            >
              <MessageCircle className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Мгновенные сообщения</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Редактирование, удаление и индикатор печати
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-6 md:p-8 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Реальные отзывы</h3>
              </div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Только ученики, которые действительно занимались с преподавателем, могут оставить отзыв
              </p>
              <div className="flex items-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                ))}
                <span className="ml-2 text-sm font-semibold text-gray-900">4.9 из 5</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 md:p-8 overflow-hidden"
            >
              <Shield className="w-6 h-6 text-green-600 mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Безопасность данных</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Шифрование, защита от атак и модерация всех преподавателей. Ваши данные под надёжной защитой.
              </p>
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">HTTPS</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">CSRF</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">JWT</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-[#3D5B82]/10 text-[#3D5B82] text-sm font-semibold rounded-full mb-4">
              Как это работает
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Три шага к результату
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
            <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#3D5B82] via-[#96C3D6] to-[#F16E4B]" />

            {[
              {
                step: "01",
                title: "Найдите репетитора",
                description: "Используйте умный поиск с фильтрами по предмету, цене и рейтингу",
                icon: Search,
                color: "from-[#3D5B82] to-[#5B7DB8]",
              },
              {
                step: "02",
                title: "Запишитесь на занятие",
                description: "Выберите удобное время в календаре и обсудите детали в чате",
                icon: Calendar,
                color: "from-[#96C3D6] to-[#5B7DB8]",
              },
              {
                step: "03",
                title: "Начните обучение",
                description: "Занимайтесь через встроенные видеозвонки и отслеживайте прогресс",
                icon: GraduationCap,
                color: "from-[#F16E4B] to-[#FFB199]",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform relative z-10`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-gray-100 group-hover:text-gray-200 transition-colors">
                  {item.step}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full mb-4">
              Отзывы
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Что говорят наши пользователи
            </h2>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100"
              >
                <Quote className="w-12 h-12 text-[#3D5B82]/20 mb-6" />
                <p className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-8 font-medium">
                  "{testimonials[currentTestimonial].text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] flex items-center justify-center text-white font-bold text-lg">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</p>
                    <p className="text-sm text-gray-500">{testimonials[currentTestimonial].role}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() =>
                  setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
                }
                className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#3D5B82] hover:text-[#3D5B82] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Предыдущий отзыв"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentTestimonial ? "w-8 bg-[#3D5B82]" : "w-2 bg-gray-300"
                    }`}
                    aria-label={`Отзыв ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#3D5B82] hover:text-[#3D5B82] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Следующий отзыв"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D5B82] via-[#4A6FA5] to-[#5B7DB8]">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 w-96 h-96 bg-[#F16E4B]/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-[#96C3D6]/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#F16E4B]" />
            <span className="text-sm text-white font-medium">Присоединяйтесь сегодня</span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Готовы начать
            <br />
            <span className="bg-gradient-to-r from-[#F16E4B] to-[#FFB199] bg-clip-text text-transparent">
              обучение мечты?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Тысячи учеников уже нашли своего идеального репетитора.
            Ваш следующий шаг — всего в одном клике.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NavLink
              to="/search"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F16E4B] hover:bg-[#E05A3B] text-white font-semibold rounded-2xl transition-all shadow-xl shadow-[#F16E4B]/30 hover:shadow-2xl hover:-translate-y-0.5 min-h-[56px]"
            >
              <Search className="w-5 h-5" />
              Найти репетитора
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </NavLink>
            <NavLink
              to="/auth"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-[#3D5B82] font-semibold rounded-2xl transition-all shadow-xl min-h-[56px]"
            >
              <UserPlus className="w-5 h-5" />
              Зарегистрироваться
            </NavLink>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;