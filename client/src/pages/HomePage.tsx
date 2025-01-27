import { FC } from "react";
import { NavLink } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import {
  BookOpen,
  Target,
  Users,
  Search,
  UserPlus,
  Star,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

const HomePage: FC = () => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <div className="-mt-4">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3D5B82] via-[#4A6FA5] to-[#5B7DB8] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F16E4B] rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-36 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-[#F16E4B] fill-current" />
                <span className="text-sm">Лучшие преподаватели страны</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Найдите своего{" "}
                <span className="text-[#F16E4B]">идеального</span>{" "}
                репетитора
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-lg">
                Edgeucate соединяет учеников с проверенными преподавателями. 
                Индивидуальные занятия, гибкое расписание и гарантированный результат.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <NavLink
                  to="/search"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-[#F16E4B] hover:bg-[#E05A3B] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Search className="w-5 h-5" />
                  Найти репетитора
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </NavLink>
                <NavLink
                  to="/auth"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
                >
                  <UserPlus className="w-5 h-5" />
                  Зарегистрироваться
                </NavLink>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="w-full h-96 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 flex items-center justify-center">
                  <GraduationCap className="w-32 h-32 text-white/30" />
                </div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 -left-4 bg-white rounded-xl shadow-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">4.9/5</p>
                      <p className="text-xs text-gray-500">Средний рейтинг</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">1000+</p>
                      <p className="text-xs text-gray-500">Преподавателей</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Почему выбирают{" "}
              <span className="text-[#3D5B82]">Edge</span>
              <span className="text-[#96C3D6]">ucate</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Мы создали платформу, которая делает обучение удобным, эффективным и доступным каждому
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Качественное обучение",
                description: "Все преподаватели проходят строгий отбор и имеют подтверждённую квалификацию",
              },
              {
                icon: Target,
                title: "Индивидуальный подход",
                description: "Программа занятий составляется под ваши цели и уровень подготовки",
              },
              {
                icon: Users,
                title: "Удобная платформа",
                description: "Встроенные видеочаты, календарь занятий и система отзывов в одном месте",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Как это работает
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Три простых шага к успешному обучению
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Найдите репетитора",
                description: "Используйте поиск и фильтры, чтобы найти преподавателя по нужному предмету",
              },
              {
                step: "2",
                title: "Договоритесь о занятии",
                description: "Обсудите детали в чате и запланируйте занятие через встроенный календарь",
              },
              {
                step: "3",
                title: "Начните обучение",
                description: "Занимайтесь через встроенную видеосвязь и отслеживайте прогресс",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#3D5B82] to-[#5B7DB8]">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Готовы начать обучение?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Присоединяйтесь к тысячам учеников, которые уже нашли своего идеального репетитора
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NavLink
              to="/search"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F16E4B] hover:bg-[#E05A3B] text-white font-semibold rounded-xl transition-all shadow-lg"
            >
              <Search className="w-5 h-5" />
              Найти репетитора
            </NavLink>
            <NavLink
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-[#3D5B82] font-semibold rounded-xl transition-all shadow-lg"
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