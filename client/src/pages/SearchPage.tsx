import React, { useState, useEffect } from "react";
import { NavLink, useLoaderData } from "react-router-dom";
import { IAdvertisement } from "../types/advertisement";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { subjectCategories, isCategory } from "../config/subjects";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const advertisementLoader = async () => {
    const { data } = await instance.get<IAdvertisement[]>(`/advertisement`);
    return data;
};

const SearchPage: React.FC = () => {
    const isAuth = useAuth();
    const initialAdvertisements = useLoaderData() as IAdvertisement[];
    const [advertisements, setAdvertisements] = useState<IAdvertisement[]>(initialAdvertisements);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState("");
    const advertisementsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(advertisements.length / advertisementsPerPage));
    const startIndex = (currentPage - 1) * advertisementsPerPage;
    const currentAdvertisements = advertisements.slice(startIndex, startIndex + advertisementsPerPage);

    const handleSearch = async () => {
        try {
            let endpoint = "/advertisement";
            if (searchTerm) {
                endpoint = `/advertisement/search/${encodeURIComponent(searchTerm)}`;
            }
            const { data } = await instance.get<IAdvertisement[]>(endpoint);
            let filteredData = data;
            if (selectedSubject && !isCategory(selectedSubject)) {
                filteredData = data.filter((ad) => ad.subject === selectedSubject);
            }
            if (filteredData && filteredData.length > 0) {
                setAdvertisements(filteredData);
                setCurrentPage(1);
            } else {
                toast.error("Ничего не найдено.");
            }
        } catch (error) {
            toast.error("Ошибка при выполнении поиска.");
        }
    };

    const loadAllAdvertisements = async () => {
        try {
            const { data } = await instance.get<IAdvertisement[]>("/advertisement");
            if (data && data.length > 0) {
                setAdvertisements(data);
                setCurrentPage(1);
            }
        } catch (error) {
            toast.error("Ошибка при загрузке объявлений.");
        }
    };

    useEffect(() => {
        if (selectedSubject && !isCategory(selectedSubject)) {
            handleSearch();
        }
    }, [selectedSubject]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleClearFilter = () => {
        setSelectedSubject("");
        setOpenCategory(null);
        loadAllAdvertisements();
    };

    return (
        <div className="p-8">
            <div className="max-w-[800px] mx-auto mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Поиск по предметам..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D5B82]"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-[#3D5B82] hover:bg-[#2D4B6E] text-white rounded-lg transition-colors"
                    >
                        Найти
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {subjectCategories.map((category) => (
                        <button
                            key={category.name}
                            onClick={() =>
                                setOpenCategory(openCategory === category.name ? null : category.name)
                            }
                            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
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
                                        }}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
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
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm bg-[#F16E4B]/10 text-[#F16E4B] px-3 py-1 rounded-full">
                            {selectedSubject}
                        </span>
                        <button
                            onClick={handleClearFilter}
                            className="text-sm text-gray-500 hover:text-red-500"
                        >
                            Сбросить
                        </button>
                    </div>
                )}
            </div>

            {advertisements.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-400 text-lg">Ничего не найдено</p>
                    <p className="text-gray-400 text-sm mt-2">Попробуйте изменить параметры поиска</p>
                </div>
            ) : (
                <>
                    <p className="mb-6 text-center text-gray-600">
                        Найдено {advertisements.length} репетиторов
                    </p>
                    <div className="flex flex-col items-center gap-4">
                        {currentAdvertisements.map((advertisement) => (
                            <div
                                key={advertisement.advertisementId}
                                className="w-full max-w-3xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[#3D5B82] to-[#5B7DB8] rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-xl">
                                            {advertisement.creator?.[0]?.toUpperCase() || "?"}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold">{advertisement.creator}</h3>
                                        <p className="text-gray-600">{advertisement.title}</p>
                                        <p className="text-sm text-gray-400">{advertisement.subject}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <span className="text-yellow-500">★</span>
                                            <span className="font-medium">{advertisement.stars.toFixed(1)}</span>
                                            <span className="text-gray-400 ml-2">{advertisement.price} ₽/час</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <NavLink
                                        to={
                                            isAuth
                                                ? `/advertisement/${advertisement.advertisementId}`
                                                : "/auth"
                                        }
                                        className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Подробнее
                                    </NavLink>
                                    {isAuth && (
                                        <NavLink
                                            to={`/chat/${advertisement.email}`}
                                            className="flex-1 text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Написать
                                        </NavLink>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm text-gray-600">
                                {currentPage} из {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchPage;