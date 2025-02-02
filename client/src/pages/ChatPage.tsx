import React, { useState, useEffect, useRef } from "react";
import { useLoaderData, useParams, NavLink } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { IMessage } from "../types/user";
import { getTokenFromLocalStorage } from "../helpers/localstorage.helper";
import * as jose from "jose";
import { MySocket } from "../App";
import { useMyProfile } from "../hooks/useMyProfile";

export const chatLoader = async ({ params }: { params: { email?: string } }): Promise<{ messages: IMessage[]; interlocutorName: string }> => {
    const token = getTokenFromLocalStorage();
    if (!token) throw new Error("Токен отсутствует.");

    const senderEmail = jose.decodeJwt(token).email as string;
    const recipientEmail = params.email;
    if (!recipientEmail) throw new Error("Параметр email обязателен.");

    try {
        const { data } = await instance.post<{ messages: IMessage[]; interlocutorName: string }>(
            "/profile/messages",
            { sender: senderEmail, recipient: recipientEmail }
        );
        return data;
    } catch (error) {
        toast.error("Ошибка при загрузке сообщений.");
        throw new Error("Ошибка при загрузке сообщений.");
    }
};

const ChatPage: React.FC = () => {
    const { email } = useParams<{ email: string }>();
    const myProfile = useMyProfile();
    const myEmail = myProfile?.email;
    const { messages: initialMessages, interlocutorName } = useLoaderData() as {
        messages: IMessage[];
        interlocutorName: string;
    };

    const [messages, setMessages] = useState<IMessage[]>(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (MySocket.socket) {
            MySocket.socket.emit("read_messages", { from: email });

            const handleIncomingMessage = (data: IMessage) => {
                if (data.sender === email || data.sender === myEmail) {
                    setMessages((prev) => [...prev, data]);
                    if (data.sender === email) {
                        MySocket.socket?.emit("read_messages", { from: email });
                    }
                }
            };

            const handleError = (data: { message: string }) => {
                toast.error(data.message);
            };

            MySocket.socket.on("on_send_message", handleIncomingMessage);
            MySocket.socket.on("error", handleError);

            return () => {
                MySocket.socket?.off("on_send_message", handleIncomingMessage);
                MySocket.socket?.off("error", handleError);
            };
        }
    }, [email, myEmail]);

    const handleSendMessage = () => {
        if (newMessage.trim() && email && myEmail && MySocket.socket?.connected) {
            MySocket.socket.emit("send_message", {
                recipient: email,
                message: newMessage,
            });
            setNewMessage("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSendMessage();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-3xl mx-auto">
                <div className="mb-4 flex items-center">
                    <NavLink to="/chats" className="flex items-center text-[#3D5B82] hover:text-[#96C3D6] mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Назад
                    </NavLink>
                    <h2 className="text-lg font-semibold">{interlocutorName}</h2>
                </div>

                <div className="border border-gray-200 rounded-lg shadow-md flex flex-col h-[calc(100vh-12rem)] bg-white">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 py-8">Начните общение</div>
                        )}
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.sender === myEmail ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`p-3 rounded-lg max-w-[70%] ${
                                        message.sender === myEmail
                                            ? "bg-[#96C3D6] text-black rounded-br-none"
                                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                                    }`}
                                >
                                    <p className="break-words">{message.message}</p>
                                    <p className={`text-xs mt-1 ${message.sender === myEmail ? "text-gray-700" : "text-gray-500"}`}>
                                        {new Date(message.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Введите сообщение"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="p-3 bg-[#96C3D6] text-black rounded-lg hover:bg-[#3D5B82] disabled:opacity-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;