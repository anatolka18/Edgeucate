import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData, useParams, NavLink } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { ICalendarEvent, IMessage, Role } from "../types/user";
import { MySocket } from "../store/auth-state";
import { useMyProfile } from "../hooks/useMyProfile";
import CalendarView from "../components/CalendarView";
import moment from "moment";
import { authReadyPromise, accessToken } from '../store/auth-state';
import { Pencil, Trash2, Send, ArrowLeft } from 'lucide-react';

interface IStudentStatus {
  isStudent: boolean;
}

const formatMessageDate = (rawDate: any) => {
  try {
    if (!rawDate) return "—";
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};

const formatDateSeparator = (date: Date) => {
  const today = moment().startOf('day');
  const msgDate = moment(date).startOf('day');
  if (msgDate.isSame(today)) return 'Сегодня';
  if (msgDate.isSame(today.clone().subtract(1, 'day'))) return 'Вчера';
  return moment(date).format('D MMMM YYYY');
};

function getMessageKey(message: IMessage, index: number): string {
  if (!message._id) return `msg-${index}`;
  const raw = message._id as any;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    if (typeof raw.$oid === 'string') return raw.$oid;
    if (typeof raw.toString === 'function' && raw.toString() !== '[object Object]') return raw.toString();
  }
  return `msg-${index}`;
}

export const chatLoader = async ({ params }: { params: { email?: string } }): Promise<{
  messages: IMessage[];
  interlocutorName: string;
  hasMore: boolean;
}> => {
  await authReadyPromise;
  const recipientEmail = params.email;
  if (!recipientEmail) throw new Error("Параметр email обязателен.");
  if (!accessToken) {
    return { messages: [], interlocutorName: '', hasMore: false };
  }

  try {
    const { data } = await instance.post<{ messages: IMessage[]; interlocutorName: string; hasMore: boolean }>(
      "/messages/get",
      { recipient: recipientEmail, limit: 30 }
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
  const myUsername = myProfile?.username;
  const myRole = myProfile?.role;
  const { messages: initialMessages, interlocutorName, hasMore: initialHasMore } = useLoaderData() as {
    messages: IMessage[];
    interlocutorName: string;
    hasMore: boolean;
  };

  const [messages, setMessages] = useState<IMessage[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const oldestMessageRef = useRef<string | null>(
    initialMessages[0]?.date
      ? new Date(initialMessages[0].date).toISOString()
      : null
  );
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<ICalendarEvent[]>([]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const isInterlocutorAdmin = email === 'admin@yandex.ru';

  const fetchCalendarEvents = async () => {
    try {
      if (!email || !myEmail) return;
      const teacherEmail = myRole === Role.TEACHER ? myEmail : email;
      const studentEmail = myRole === Role.TEACHER ? email : myEmail;
      const response = await instance.get<ICalendarEvent[]>('/calendar/teacherstudent', {
        params: { teacherEmail, studentEmail }
      });
      const formattedEvents = response.data.map(event => ({
        ...event,
        start: new Date(event.date),
        end: moment(event.date).add(1, 'hour').toDate()
      }));
      setCalendarEvents(formattedEvents);
    } catch (error) {
      toast.error('Не удалось загрузить события календаря');
    }
  };

  useEffect(() => {
    if (isCalendarModalVisible) {
      fetchCalendarEvents();
    }
  }, [isCalendarModalVisible, myEmail, email]);

  useEffect(() => {
    const checkStudentStatus = async () => {
      if (myEmail && email && myRole === Role.TEACHER && !isInterlocutorAdmin) {
        try {
          setCheckingStatus(true);
          const { data } = await instance.post<IStudentStatus>('/profile/student/check', {
            teacherEmail: myEmail,
            studentEmail: email
          });
          setIsStudent(data.isStudent);
        } catch (error) {
          toast.error('Не удалось проверить статус ученика');
        } finally {
          setCheckingStatus(false);
        }
      } else {
        setCheckingStatus(false);
      }
    };

    if (myEmail && email) {
      checkStudentStatus();
    }
  }, [myEmail, email, myRole]);

  const handleAddStudent = async () => {
    if (!myEmail || !email || processingAction) return;
    setProcessingAction(true);
    try {
      await instance.post('/profile/student/add', {
        teacherEmail: myEmail,
        studentEmail: email
      });
      setIsStudent(true);
      toast.success(`${interlocutorName} добавлен(а) в список учеников`);
    } catch (error) {
      toast.error('Не удалось добавить пользователя в список учеников');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!myEmail || !email || processingAction) return;
    setProcessingAction(true);
    try {
      await instance.post('/profile/student/remove', {
        teacherEmail: myEmail,
        studentEmail: email
      });
      setIsStudent(false);
      toast.success(`${interlocutorName} удален(а) из списка учеников`);
    } catch (error) {
      toast.error('Не удалось удалить пользователя из списка учеников');
    } finally {
      setProcessingAction(false);
    }
  };

  const renderStudentManagement = () => {
    if (myRole !== Role.TEACHER || isInterlocutorAdmin) return null;
    return (
      <div className="flex items-center ml-4">
        {checkingStatus ? (
          <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Проверка...
          </div>
        ) : isStudent ? (
          <button
            onClick={handleRemoveStudent}
            disabled={processingAction}
            className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 flex items-center"
          >
            {processingAction ? (
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Удалить из учеников'
            )}
          </button>
        ) : (
          <button
            onClick={handleAddStudent}
            disabled={processingAction}
            className="px-4 py-2 bg-emerald-400 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center"
          >
            {processingAction ? (
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Добавить в ученики'
            )}
          </button>
        )}
      </div>
    );
  };

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestMessageRef.current) return;
    setIsLoadingMore(true);
    const prevScrollHeight = chatContainerRef.current?.scrollHeight || 0;
    try {
      const { data } = await instance.post<{ messages: IMessage[]; interlocutorName: string; hasMore: boolean }>(
        "/messages/get",
        { recipient: email, limit: 30, before: oldestMessageRef.current }
      );
      if (data.messages.length > 0) {
        const newUnique = data.messages.filter(
          msg => !messages.some(m => m._id === msg._id)
        );
        setMessages(prev => [...newUnique, ...prev]);
        oldestMessageRef.current = new Date(data.messages[0].date).toISOString();
      }
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error("Ошибка при загрузке старых сообщений");
    } finally {
      setIsLoadingMore(false);
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          const newScrollHeight = chatContainerRef.current.scrollHeight;
          chatContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    }
  }, [isLoadingMore, hasMore, email, messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (MySocket.socket) {
      MySocket.socket.emit("read_messages", { from: email });
      const handleIncomingMessage = (data: IMessage) => {
        if (data.sender === email || data.sender === myEmail) {
          setMessages((prev) => {
            if (data._id && prev.some(m => m._id === data._id)) return prev;
            return [...prev, data];
          });
          if (data.sender === email) {
            MySocket.socket?.emit("read_messages", { from: email });
          }
        }
      };
      const handleError = (data: { message: string }) => {
        toast.error(data.message);
      };
      const handleTyping = ({ user, typing }: { user: string; typing: boolean }) => {
        if (user === email) setIsTyping(typing);
      };
      const handleEdited = (updatedMsg: IMessage) => {
        setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      };
      const handleDeleted = (updatedMsg: IMessage) => {
        setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      };

      MySocket.socket.on("on_send_message", handleIncomingMessage);
      MySocket.socket.on("error", handleError);
      MySocket.socket.on("typing", handleTyping);
      MySocket.socket.on('message_edited', handleEdited);
      MySocket.socket.on('message_deleted', handleDeleted);

      return () => {
        MySocket.socket?.off("on_send_message", handleIncomingMessage);
        MySocket.socket?.off("error", handleError);
        MySocket.socket?.off("typing", handleTyping);
        MySocket.socket?.off('message_edited', handleEdited);
        MySocket.socket?.off('message_deleted', handleDeleted);
      };
    }
  }, [email, myEmail]);

  const handleEditMessage = (messageId: string, text: string) => {
    setEditingMessageId(messageId);
    setEditText(text);
  };
  const handleSaveEdit = () => {
    if (editText.trim() && editingMessageId && MySocket.socket?.connected) {
      MySocket.socket.emit('edit_message', { messageId: editingMessageId, message: editText.trim() });
      setEditingMessageId(null);
      setEditText('');
    }
  };
  const handleDeleteMessage = (messageId: string) => {
    if (MySocket.socket?.connected) {
      MySocket.socket.emit('delete_message', { messageId });
    }
  };
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleTypingStart = () => {
    if (MySocket.socket && email) {
      MySocket.socket.emit("typing_start", { recipient: email });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleTypingEnd(), 2000);
  };

  const handleTypingEnd = () => {
    if (MySocket.socket && email) {
      MySocket.socket.emit("typing_end", { recipient: email });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && email && myEmail && MySocket.socket?.connected) {
      MySocket.socket.emit("send_message", { recipient: email, message: newMessage });
      setNewMessage("");
      handleTypingEnd();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  let lastDateSeparator = '';

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col rounded-xl shadow-sm border border-gray-200 bg-white overflow-hidden" style={{ height: 'calc(100vh - 6rem)' }}>
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            <NavLink to="/chats" className="flex items-center text-[#3D5B82] hover:text-[#96C3D6] mr-4">
              <ArrowLeft className="w-5 h-5 mr-1" />
            </NavLink>
            <div className="relative">
              <h2 className="text-lg font-semibold">{interlocutorName}</h2>
              {isTyping && (
                <p className="absolute left-0 top-5 text-sm text-gray-500 animate-pulse whitespace-nowrap">
                  печатает...
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {myRole !== Role.ADMIN && !isInterlocutorAdmin && (
              <button
                onClick={() => setIsCalendarModalVisible(true)}
                className="px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] text-black rounded-lg transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Календарь
              </button>
            )}
            {myRole === Role.TEACHER && !isInterlocutorAdmin && renderStudentManagement()}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div ref={chatContainerRef} className="h-full overflow-y-auto overflow-x-hidden px-4 py-4 space-y-1">
            {isLoadingMore && (
              <div className="text-center text-gray-400 py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#3D5B82] mx-auto"></div>
              </div>
            )}
            {messages.length === 0 && !isLoadingMore && (
              <div className="text-center text-gray-400 py-8">Начните общение</div>
            )}
            {messages.map((message, index) => {
              const showDateSeparator = () => {
                const currentDate = formatDateSeparator(new Date(message.date));
                if (currentDate !== lastDateSeparator) {
                  lastDateSeparator = currentDate;
                  return true;
                }
                return false;
              };
              const dateSeparator = showDateSeparator();
              return (
                <React.Fragment key={getMessageKey(message, index)}>
                  {dateSeparator && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        {lastDateSeparator}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${message.sender === myEmail ? "justify-end" : "justify-start"} mb-1`}>
                    {editingMessageId === message._id ? (
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-xs">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#96C3D6] mb-2"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Отмена</button>
                          <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E]">Сохранить</button>
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[75%] min-w-0 flex flex-col ${message.sender === myEmail ? 'items-end' : 'items-start'}`}>
                        <div className={`relative group px-4 py-2.5 rounded-2xl ${
                          message.sender === myEmail
                            ? 'bg-[#3D5B82] text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          {message.deleted ? (
                            <p className="italic opacity-70 break-words">Сообщение удалено</p>
                          ) : (
                            <p className="break-words text-[15px]" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{message.message}</p>
                          )}
                          <div className={`flex items-center gap-1 mt-1 ${message.sender === myEmail ? 'justify-end text-blue-100' : 'justify-start text-gray-400'}`}>
                            <span className="text-xs whitespace-nowrap">{formatMessageDate(message.date)}</span>
                            {message.edited && <span className="text-xs opacity-70">изменено</span>}
                          </div>
                          {message.sender === myEmail && !message.deleted && (
                            <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-gray-200 rounded-full px-1 py-0.5 shadow-sm -translate-y-1/2 translate-x-1/3">
                              <button
                                onClick={() => handleEditMessage(message._id!, message.message)}
                                className="p-1 text-gray-500 hover:text-[#3D5B82] transition-colors"
                                title="Редактировать"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message._id!)}
                                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1 max-w-full">
            <input
              type="text"
              placeholder="Введите сообщение..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTypingStart();
              }}
              onKeyDown={handleKeyPress}
              className="w-full py-3 pl-4 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96C3D6] bg-gray-50 break-words"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#96C3D6] text-black rounded-lg hover:bg-[#3D5B82] disabled:opacity-40 disabled:hover:bg-[#96C3D6] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isCalendarModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                Календарь событий с {interlocutorName}
              </h2>
              <button
                onClick={() => setIsCalendarModalVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex-grow overflow-auto">
              <CalendarView
                events={calendarEvents}
                teacherEmail={myRole === Role.TEACHER ? myEmail : email}
                studentEmail={myRole === Role.TEACHER ? email : myEmail}
                teacherUsername={myRole === Role.TEACHER ? myUsername : interlocutorName}
                studentUsername={myRole === Role.TEACHER ? interlocutorName : myUsername}
                readOnly={myRole !== Role.TEACHER}
                onEventCreated={fetchCalendarEvents}
                onEventDeleted={fetchCalendarEvents}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;