import React, { useState } from "react";
import { NavLink, useLoaderData } from "react-router-dom";
import { IAdvertisement } from "../types/advertisement";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { subjectCategories, isCategory } from "../config/subjects";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const advertisementLoader = async () => {
  const { data } = await instance.get<{ data: IAdvertisement[]; total: number; page: number; totalPages: number }>(`/advertisement?page=1&limit=100`);
  return data.data;
};

const getAvatarUrl = (avatar?: string): string | null => {
    if (!avatar || avatar === 'default.png') return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/avatars/')) return avatar;
    return null;
};

const SearchPage: React.FC = () => {
    const isAuth = useAuth();
    const initialAdvertisements = useLoaderData() as IAdvertisement[];
    const [advertisements, setAdvertisements] = useState<IAdvertisement[]>(initialAdvertisements);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const advertisementsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(advertisements.length / advertisementsPerPage));
    const startIndex = (currentPage - 1) * advertisementsPerPage;
    const currentAdvertisements = advertisements.slice(startIndex, startIndex + advertisementsPerPage);

    const fetchAdvertisements = async (query = "", subject = "") => {
        setIsLoading(true);
        try {
            const endpoint = `/advertisement/search?query=${encodeURIComponent(query)}&subject=${encodeURIComponent(subject)}`;
            const { data } = await instance.get<IAdvertisement[]>(endpoint);
            setAdvertisements(data);
            setCurrentPage(1);
            if (data.length === 0) {
                toast.info("Ничего не найдено");
            }
        } catch (error) {
            toast.error("Ошибка при выполнении поиска.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        fetchAdvertisements(searchTerm, selectedSubject && !isCategory(selectedSubject) ? selectedSubject : "");
    };

    const handleClearFilter = () => {
        setSelectedSubject("");
        setOpenCategory(null);
        setSearchTerm("");
        setAdvertisements(initialAdvertisements);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-[800px] mx-auto mb-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Поиск по предметам, преподавателям..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D5B82]"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-3 bg-[#3D5B82] hover:bg-[#2D4B6E] text-white rounded-lg transition-colors font-medium min-h-[44px]"
                        disabled={isLoading}
                    >
                        {isLoading ? "Поиск..." : "Найти"}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {subjectCategories.map((category) => (
                        <button
                            key={category.name}
                            onClick={() =>
                                setOpenCategory(openCategory === category.name ? null : category.name)
                            }
                            className={`px-4 py-2 rounded-full text-sm transition-colors min-h-[44px] ${
                                openCategory === category.name
                                    ? "bg-[#3D5B82] text-white"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {openCategory && (
                    <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                            {subjectCategories
                                .find((cat) => cat.name === openCategory)
                                ?.subjects.map((subject) => (
                                    <button
                                        key={subject}
                                        onClick={() => {
                                            setSelectedSubject(subject);
                                            setOpenCategory(null);
                                            fetchAdvertisements(searchTerm, subject);
                                        }}
                                        className={`px-3 py-2 text-sm rounded-full transition-colors min-h-[44px] ${
                                            selectedSubject === subject
                                                ? "bg-[#3D5B82] text-white"
                                                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {selectedSubject && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-sm bg-[#F16E4B]/10 text-[#F16E4B] px-3 py-2 rounded-full min-h-[44px] flex items-center">
                            {selectedSubject}
                        </span>
                        <button
                            onClick={handleClearFilter}
                            className="text-sm text-gray-500 hover:text-red-500 px-3 py-2 min-h-[44px]"
                        >
                            Сбросить
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-center mt-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3D5B82]"></div>
                    </div>
                )}
            </div>

            {!isLoading && advertisements.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-400 text-lg">Ничего не найдено</p>
                    <p className="text-gray-400 text-sm mt-2">Попробуйте изменить параметры поиска</p>
                </div>
            ) : (
                !isLoading && (
                    <>
                        <p className="mb-6 text-center text-gray-600">
                            Найдено {advertisements.length} репетиторов
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            {currentAdvertisements.map((advertisement) => {
                                const avatarUrl = getAvatarUrl((advertisement as any).avatar);
                                return (
                                    <div
                                        key={advertisement.advertisementId}
                                        className="w-full max-w-3xl bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={advertisement.creator}
                                                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-xl">
                                                        {advertisement.creator?.[0]?.toUpperCase() || "?"}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1 w-full text-center sm:text-left">
                                                <h3 className="text-lg font-bold">{advertisement.creator}</h3>
                                                <p className="text-gray-600">{advertisement.title}</p>
                                                <p className="text-sm text-gray-400">{advertisement.subject}</p>
                                                <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                                                    <span className="text-yellow-500">★</span>
                                                    <span className="font-medium">
                                                        {advertisement.stars?.toFixed(1) ?? '0'}
                                                    </span>
                                                    <span className="text-gray-400 ml-2">{advertisement.price} ₽/час</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                            <NavLink
                                                to={
                                                    isAuth
                                                        ? `/advertisement/${advertisement.advertisementId}`
                                                        : "/auth"
                                                }
                                                className="flex-1 text-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-[44px] flex items-center justify-center"
                                            >
                                                Подробнее
                                            </NavLink>
                                            {isAuth && (
                                                <NavLink
                                                    to={`/chat/${advertisement.email}`}
                                                    className="flex-1 text-center px-4 py-3 bg-[#96C3D6] text-black rounded-lg hover:bg-[#3D5B82] hover:text-white transition-colors font-medium min-h-[44px] flex items-center justify-center"
                                                >
                                                    Написать
                                                </NavLink>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-3 rounded-lg hover:bg-gray-100 disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-gray-600">
                                    {currentPage} из {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-3 rounded-lg hover:bg-gray-100 disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )
            )}
        </div>
    );
};

export default SearchPage;