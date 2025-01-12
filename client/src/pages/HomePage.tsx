import { FC } from "react";
import "../index.css";
import { NavLink } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import {
    BookOpen,
    Target,
    Users
} from "lucide-react";

const HomePage: FC = () => {

    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: "easeOut" as const,
        },
      },
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-montserrat">
            <section className="w-full bg-gradient-to-r from-[#F16E4B] to-[#FF8A5B] text-white py-16 px-6 md:px-12 lg:px-24">
                <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-8">
                    <motion.div
                        className="flex-1 text-center lg:text-left"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                            Edgeucate: Ваш путь к знаниям
                        </h1>
                        <p className="text-lg md:text-xl mb-8 leading-relaxed">
                            Платформа, которая соединяет талантливых учеников с опытными репетиторами.
                            Индивидуальный подход. Максимальный результат.
                        </p>
                        <NavLink
                            to="/search"
                            className="px-8 py-3 bg-white text-[#F16E4B] font-bold rounded-full 
                            hover:bg-gray-100 transition duration-300 inline-block 
                            shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Найти репетитора
                        </NavLink>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 px-6 md:px-12 lg:px-24 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
                        Почему <span className="text-[#F16E4B]">Edgeucate</span>?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center text-white border border-white/20"
                        >
                            <BookOpen className="mx-auto mb-6 w-16 h-16 text-[#F16E4B]" />
                            <h3 className="text-xl font-bold mb-4">Качественное обучение</h3>
                            <p>Индивидуальный подход и профессиональные преподаватели</p>
                        </motion.div>
                        <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center text-white border border-white/20"
                            transition={{ delay: 0.2 }}
                        >
                            <Target className="mx-auto mb-6 w-16 h-16 text-[#F16E4B]" />
                            <h3 className="text-xl font-bold mb-4">Эффективность</h3>
                            <p>Быстрый прогресс благодаря подобранным специалистам</p>
                        </motion.div>
                        <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center text-white border border-white/20"
                            transition={{ delay: 0.4 }}
                        >
                            <Users className="mx-auto mb-6 w-16 h-16 text-[#F16E4B]" />
                            <h3 className="text-xl font-bold mb-4">Доступность</h3>
                            <p>Широкий выбор репетиторов по разным предметам</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="py-16 px-6 md:px-12 lg:px-24 bg-white">
                <motion.div
                    className="max-w-4xl mx-auto bg-gradient-to-r from-[#F16E4B] to-[#FF8A5B] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row items-center"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex-1 p-8 md:p-12 text-white text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Начните учиться <span className="text-white bg-black/20 px-2 rounded">сегодня</span>
                        </h2>
                        <p className="mb-8 text-lg">
                            Откройте для себя мир знаний с лучшими преподавателями!
                        </p>
                        <NavLink
                            to="/auth"
                            className="px-8 py-3 bg-white text-[#F16E4B] font-bold rounded-full 
                                     hover:bg-gray-100 transition duration-300 inline-block 
                                       shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Создать аккаунт
                        </NavLink>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default HomePage;