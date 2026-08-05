import React, { useState, useEffect } from "react";
import { NavLink, useLoaderData } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { IChat, IMessage } from "../types/user";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { MySocket } from "../store/auth-state";
import { useMyProfile } from "../hooks/useMyProfile";
import { authReadyPromise, accessToken } from '../store/auth-state';

export const chatListLoader = async (): Promise<IChat[]> => {
  await authReadyPromise;
  if (!accessToken) {
    return [];
  }
  try {
    const { data } = await instance.post<IChat[]>("/messages/chats", {});
    return data;
  } catch (error) {
    toast.error("Ошибка при загрузке чатов.");
    return [];
  }
};

const ChatListPage: React.FC = () => {
    const initialChats = useLoaderData() as IChat[];
    const [chats, setChats] = useState<IChat[]>(initialChats);
    const myProfile = useMyProfile();
    const myEmail = myProfile?.email;

    const getUsernameFromEmail = (email: string) => {
        if (!email) return "Unknown";
        return email.split('@')[0];
    };

    useEffect(() => {
        if (!MySocket.socket || !myEmail) return;

        const handleUnreadCount = ({ from, count }: { from: string; count: number }) => {
            if (!from) return;
            setChats(prevChats => {
                const chatExists = prevChats.some(chat => chat.interlocutor === from);
                if (!chatExists && count > 0) {
                    const newChat: IChat = {
                        interlocutor: from,
                        avatar: "",
                        online: false,
                        username: getUsernameFromEmail(from),
                        unreadCount: count
                    };
                    return [newChat, ...prevChats];
                }
                return prevChats.map(chat =>
                    chat.interlocutor === from ? { ...chat, unreadCount: count } : chat
                );
            });
        };

        const handleNewMessage = (message: IMessage) => {
            if (!message || !message.sender) return;
            const interlocutorEmail = message.sender === myEmail ? message.recipient : message.sender;
            if (!interlocutorEmail) return;

            setChats(prevChats => {
                let found = false;
                const updated = prevChats.map(chat => {
                    if (chat.interlocutor === interlocutorEmail) {
                        found = true;
                        return {
                            ...chat,
                            lastMessage: {
                                message: message.message,
                                date: message.date,
                                sender: message.sender
                            },
                        };
                    }
                    return chat;
                });
                if (!found) {
                    const newChat: IChat = {
                        interlocutor: interlocutorEmail,
                        avatar: "",
                        online: false,
                        username: getUsernameFromEmail(interlocutorEmail),
                        unreadCount: 0,
                        lastMessage: {
                            message: message.message,
                            date: message.date,
                            sender: message.sender
                        }
                    };
                    return [newChat, ...updated];
                }
                return updated;
            });
        };

        const handleUserStatus = ({ email, online }: { email: string; online: boolean }) => {
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.interlocutor === email ? { ...chat, online } : chat
                )
            );
        };

        MySocket.socket.on("unread_count", handleUnreadCount);
        MySocket.socket.on("on_send_message", handleNewMessage);
        MySocket.socket.on("user_status", handleUserStatus);

        return () => {
            MySocket.socket?.off("unread_count", handleUnreadCount);
            MySocket.socket?.off("on_send_message", handleNewMessage);
            MySocket.socket?.off("user_status", handleUserStatus);
        };
    }, [MySocket.socket, myEmail]);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-center mb-6">Ваши чаты</h1>
            {chats.length === 0 ? (
                <div className="text-center py-8 px-4">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg">Нет доступных чатов</p>
                    <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                        Напишите преподавателю через страницу объявления, чтобы начать общение
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-stretch space-y-3 sm:space-y-4">
                    {chats.map((chat) => (
                        <motion.div
                            key={chat.interlocutor}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-3xl mx-auto"
                        >
                            <NavLink
                                to={`/chat/${chat.interlocutor}`}
                                className="flex items-center border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md active:shadow-sm active:scale-[0.99] transition-all bg-white min-h-[72px] sm:min-h-[80px]"
                            >
                                <div className="relative mr-3 sm:mr-4 flex-shrink-0">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-base sm:text-lg">
                                        {chat.username?.[0]?.toUpperCase() || "?"}
                                        </span>
                                    </div>
                                    <span
                                        className={`absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white ${
                                        chat.online ? "bg-green-500" : "bg-gray-400"
                                        }`}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                        <h3 className="text-base sm:text-lg font-bold truncate">{chat.username}</h3>
                                        {chat.lastMessage?.date && (
                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                {new Date(chat.lastMessage.date).toLocaleTimeString("ru-RU", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-500 truncate flex-1">
                                            {chat.lastMessage?.message || "Сообщений пока нет"}
                                        </p>
                                        {chat.unreadCount != null && chat.unreadCount > 0 && (
                                            <div className="bg-[#96C3D6] text-black text-xs font-semibold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center flex-shrink-0">
                                                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                                            </div>
                                        )}
                                    </div>
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