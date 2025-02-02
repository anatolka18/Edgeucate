import React, { useState, useEffect } from "react";
import { NavLink, useLoaderData } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { IChat, IMessage } from "../types/user";
import { motion } from "framer-motion";
import * as jose from "jose";
import { getTokenFromLocalStorage } from "../helpers/localstorage.helper";
import { MessageCircle } from "lucide-react";
import { MySocket } from "../App";

export const chatListLoader = async (): Promise<IChat[]> => {
    const token = getTokenFromLocalStorage();
    if (!token) {
        toast.error("Токен отсутствует.");
        return [];
    }
    try {
        const email = jose.decodeJwt(token).email as string;
        const { data } = await instance.post<IChat[]>("/profile/chats", { email });
        return data;
    } catch (error) {
        toast.error("Ошибка при загрузке чатов.");
        return [];
    }
};

const ChatListPage: React.FC = () => {
    const initialChats = useLoaderData() as IChat[];
    const [chats, setChats] = useState<IChat[]>(initialChats);

    useEffect(() => {
        if (!MySocket.socket) return;

        const handleUnreadCount = ({ from, count }: { from: string; count: number }) => {
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.interlocutor === from ? { ...chat, unreadCount: count } : chat
                )
            );
        };

        const handleNewMessage = (message: IMessage) => {
            setChats(prevChats =>
                prevChats.map(chat => {
                    if (chat.interlocutor === message.sender || chat.interlocutor === message.sender) {
                        return {
                            ...chat,
                            messages: [...chat.messages, message],
                            unreadCount: (chat.unreadCount || 0) + 1
                        };
                    }
                    return chat;
                })
            );
        };

        MySocket.socket.on("unread_count", handleUnreadCount);
        MySocket.socket.on("on_send_message", handleNewMessage);

        return () => {
            MySocket.socket?.off("unread_count", handleUnreadCount);
            MySocket.socket?.off("on_send_message", handleNewMessage);
        };
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold text-center mb-6">Ваши чаты</h1>
            {chats.length === 0 ? (
                <div className="text-center py-8">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Нет доступных чатов</p>
                    <p className="text-gray-400 text-sm mt-2">
                        Напишите преподавателю через страницу объявления, чтобы начать общение
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-4">
                    {chats.map((chat) => (
                        <motion.div
                            key={chat.interlocutor}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-3xl"
                        >
                            <NavLink
                                to={`/chat/${chat.interlocutor}`}
                                className="flex items-center border border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow bg-white"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] rounded-full flex items-center justify-center mr-4">
                                    <span className="text-white font-bold text-lg">
                                        {chat.username?.[0]?.toUpperCase() || "?"}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold">{chat.username}</h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {chat.messages.length > 0
                                            ? chat.messages[chat.messages.length - 1].message
                                            : "Сообщений пока нет"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {chat.unreadCount != null && chat.unreadCount > 0 && (
                                        <div className="bg-[#96C3D6] text-black text-xs font-semibold px-2 py-1 rounded-full">
                                            {chat.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </NavLink>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatListPage;