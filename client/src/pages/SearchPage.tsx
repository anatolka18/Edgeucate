import React, { useState, useEffect } from "react";
import { NavLink, useLoaderData } from "react-router-dom";
import { IAdvertisement } from "../types/advertisement";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
//import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { subjectCategories, isCategory } from "../config/subjects";

export const advertisementLoader = async () => {
    const { data } = await instance.get<IAdvertisement[]>(`/advertisement`)
    return data
}

const SearchPage: React.FC = () => {
    const isAuth = useAuth();
    //const navigate = useNavigate();
    const initialAdvertisements = useLoaderData() as IAdvertisement[];
    const [advertisements, setAdvertisements] = useState<IAdvertisement[]>(initialAdvertisements);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState("");
    const advertisementsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(advertisements.length / advertisementsPerPage));
    const startIndex = (currentPage - 1) * advertisementsPerPage;
    const endIndex = startIndex + advertisementsPerPage;
    const currentAdvertisements = advertisements.slice(startIndex, endIndex);

    const handleSearch = async () => {
        try {
            let endpoint = "/advertisement";
            if (searchTerm) {
                endpoint = `/advertisement/search/${encodeURIComponent(searchTerm)}`;
            }
            
            const { data } = await instance.get<IAdvertisement[]>(endpoint);
            
            let filteredData = data;
            if (selectedSubject && !isCategory(selectedSubject)) {
                filteredData = data.filter(ad => ad.subject === selectedSubject);
            }
            
            if (filteredData && filteredData.length > 0) {
                setAdvertisements(filteredData);
                setCurrentPage(1);
            } else {
                toast.error('Ничего не найдено.');
            }
        } catch (error) {
            toast.error('Ошибка при выполнении поиска.');
        }
    };

    const loadAllAdvertisements = async () => {
        try {
            const { data } = await instance.get<IAdvertisement[]>("/advertisement");
            if (data && data.length > 0) {
                setAdvertisements(data);
                setCurrentPage(1);
            } else {
                toast.error('Не удалось загрузить объявления.');
            }
        } catch (error) {
            toast.error('Ошибка при загрузке объявлений.');
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

    const handleCategoryClick = (category: string) => {
        if (openCategory === category) {
            setOpenCategory(null);
        } else {
            setOpenCategory(category);
            setSelectedSubject("");
        }
    };

    const handleSubjectClick = (subject: string) => {
        setSelectedSubject(subject);
    };

    const handleClearFilter = () => {
        setSelectedSubject("");
        setOpenCategory(null);
        loadAllAdvertisements();
    };

    return (
        <div className="p-8 font-montserrat">
            <div className="max-w-[800px] mx-auto mb-6">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            placeholder="Введите предмет"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                        />
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-black rounded-md"
                        >
                            Найти
                        </button>
                    </div>
                    
                    <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium mb-3">Фильтр по предметам:</h3>
                        
                        <div className="flex flex-wrap gap-2">
                            {subjectCategories.map((category) => (
                                <div key={category.name} className="mb-3">
                                    <button 
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium 
                                            ${openCategory === category.name 
                                                ? 'bg-[#96C3D6] text-white' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                                        onClick={() => handleCategoryClick(category.name)}
                                    >
                                        {category.name}
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {openCategory && (
                            <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
                                <h4 className="font-medium mb-2 text-sm text-gray-700">{openCategory}:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {subjectCategories
                                        .find(cat => cat.name === openCategory)
                                        ?.subjects.map((subject: string) => (
                                            <button
                                                key={subject}
                                                className={`px-2 py-1 text-xs rounded-md 
                                                    ${selectedSubject === subject 
                                                        ? 'bg-[#3D5B82] text-white' 
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                                                onClick={() => handleSubjectClick(subject)}
                                            >
                                                {subject}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}
                        
                        {selectedSubject && !isCategory(selectedSubject) && (
                            <div className="mt-3 flex items-center">
                                <span className="mr-2 text-sm">
                                    Выбранный предмет: <span className="font-medium">{selectedSubject}</span>
                                </span>
                                <button 
                                    onClick={handleClearFilter}
                                    className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                                >
                                    Сбросить
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <p className="mb-4 text-2xl font-semibold text-center">
                По вашему запросу было найдено {advertisements.length} репетиторов:
            </p>
            <div className="flex flex-col items-center space-y-4">
                {currentAdvertisements.length > 0 ? (
                    currentAdvertisements.map((advertisement, index) => (
                        <div
                            key={index}
                            className="w-full max-w-3xl flex items-start border border-gray-200 rounded-lg p-4 shadow-md"
                        >
                            <div className="flex-1">
                                <h3 className="text-lg font-bold">{advertisement.creator}</h3>
                                <p className="text-sm text-gray-600">{advertisement.title}</p>
                                <p className="text-sm text-gray-600">
                                    {advertisement.subject || "Предмет не указан"}
                                </p>
                                <p className="text-lg font-semibold mt-2">
                                    {advertisement.price} ₽/час
                                </p>
                                <div className="flex space-x-2 mt-2">
                                    <NavLink
                                        to={isAuth 
                                            ? `/advertisement/${advertisement.advertisementId}` 
                                            : "/auth"
                                        }
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                    >
                                        Перейти к объявлению
                                    </NavLink>
                                </div>
                            </div>
                            <div className="flex flex-col items-end ml-4">
                                <p className="text-lg font-semibold">
                                    {advertisement.stars}★
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Ничего не найдено</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col items-center mt-6 space-y-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                            Назад
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                            Вперед
                        </button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            value={currentPage}
                            onChange={(e) => handlePageChange(Number(e.target.value))}
                            className="w-16 p-2 border border-gray-300 rounded-md text-center"
                            min={1}
                            max={totalPages}
                        />
                        <span className="text-lg">из {totalPages}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;