import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData, useParams, NavLink } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { ICalendarEvent, IMessage, Role } from "../types/user";
import { MySocket } from "../store/auth-state";
import { useMyProfile } from "../hooks/useMyProfile";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";
import CalendarView from "../components/CalendarView";
import moment from "moment";
import { authReadyPromise, accessToken } from '../store/auth-state';
import { Pencil, Trash2, Send, ArrowLeft, X, Copy } from 'lucide-react';

interface IStudentStatus {
  isStudent: boolean;
}

function normalizeId(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    if (typeof raw.$oid === 'string') return raw.$oid;
    if (raw.buffer && raw.buffer.data && Array.isArray(raw.buffer.data)) {
      return raw.buffer.data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    if (raw.data && Array.isArray(raw.data) && raw.type === 'Buffer') {
      return raw.data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    if (typeof raw.toHexString === 'function') {
      return raw.toHexString();
    }
    if (typeof raw.toString === 'function') {
      const str = raw.toString();
      if (str !== '[object Object]') return str;
    }
  }
  return '';
}

function getMessageKey(message: IMessage, index: number): string {
  const normalized = normalizeId(message._id);
  return normalized || `msg-${index}`;
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

  const { viewportHeight } = useKeyboardHeight();
  const prevViewportHeightRef = useRef(viewportHeight);

  const [messages, setMessages] = useState<IMessage[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const oldestMessageRef = useRef<string | null>(
    initialMessages[0]?.date
      ? new Date(initialMessages[0].date).toISOString()
      : null
  );
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<ICalendarEvent[]>([]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);

  const isInterlocutorAdmin = email === 'admin@yandex.ru';

  useEffect(() => {
    const heightDiff = prevViewportHeightRef.current - viewportHeight;
    prevViewportHeightRef.current = viewportHeight;

    if (heightDiff > 100 && chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 150);
    }
  }, [viewportHeight]);

  const fetchCalendarEvents = async () => {
    try {
      if (!email || !myEmail) return;
      const teacherEmail = myRole === Role.TEACHER ? myEmail : email;
      const studentEmail = myRole === Role.TEACHER ? email : myEmail;
      const response = await instance.get<any[]>('/calendar/teacherstudent', {
        params: { teacherEmail, studentEmail }
      });
      
      const formattedEvents = response.data.map(rawEvent => {
        const event = rawEvent._doc || rawEvent;
        const startDate = new Date(event.date);
        return {
          _id: normalizeId(event._id),
          title: event.title,
          teacher_email: event.teacher_email,
          student_email: event.student_email,
          teacher_username: event.teacher_username,
          student_username: event.student_username,
          date: event.date,
          time: event.time,
          cost: event.cost,
          start: startDate,
          end: new Date(startDate.getTime() + 60 * 60 * 1000),
        };
      });
      
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
    if (!activeMessageMenu) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (messageMenuRef.current && !messageMenuRef.current.contains(e.target as Node)) {
        setActiveMessageMenu(null);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeMessageMenu]);

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
      <div className="flex items-center">
        {checkingStatus ? (
          <div className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center min-h-[40px] text-sm">
            <svg className="animate-spin h-4 w-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="hidden sm:inline">Проверка...</span>
          </div>
        ) : isStudent ? (
          <button
            onClick={handleRemoveStudent}
            disabled={processingAction}
            className="px-3 sm:px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 flex items-center min-h-[40px] text-sm whitespace-nowrap"
          >
            {processingAction ? (
              <svg className="animate-spin h-4 w-4 sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span className="hidden sm:inline">{processingAction ? '' : 'Удалить из учеников'}</span>
            <span className="sm:hidden">{processingAction ? '' : 'Удалить'}</span>
          </button>
        ) : (
          <button
            onClick={handleAddStudent}
            disabled={processingAction}
            className="px-3 sm:px-4 py-2 bg-emerald-400 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center min-h-[40px] text-sm whitespace-nowrap"
          >
            {processingAction ? (
              <svg className="animate-spin h-4 w-4 sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span className="hidden sm:inline">{processingAction ? '' : 'Добавить в ученики'}</span>
            <span className="sm:hidden">{processingAction ? '' : 'Добавить'}</span>
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
          msg => !messages.some(m => normalizeId(m._id) === normalizeId(msg._id))
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

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    container.addEventListener("contextmenu", handleContextMenu);
    return () => container.removeEventListener("contextmenu", handleContextMenu);
  }, []);

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
            const incomingKey = normalizeId(data._id);
            if (incomingKey && prev.some(m => normalizeId(m._id) === incomingKey)) return prev;
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
        const updatedKey = normalizeId(updatedMsg._id);
        setMessages(prev => prev.map(m => normalizeId(m._id) === updatedKey ? updatedMsg : m));
      };
      const handleDeleted = (updatedMsg: IMessage) => {
        const updatedKey = normalizeId(updatedMsg._id);
        setMessages(prev => prev.map(m => normalizeId(m._id) === updatedKey ? updatedMsg : m));
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

  const handleEditMessage = (messageKey: string, text: string) => {
    setEditingMessageId(messageKey);
    setEditText(text);
    setActiveMessageMenu(null);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingMessageId && MySocket.socket?.connected) {
      MySocket.socket.emit('edit_message', { messageId: editingMessageId, message: editText.trim() });
      setEditingMessageId(null);
      setEditText('');
    }
  };

  const handleDeleteMessage = (messageKey: string) => {
    if (MySocket.socket?.connected) {
      MySocket.socket.emit('delete_message', { messageId: messageKey });
    }
    setActiveMessageMenu(null);
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Скопировано в буфер обмена');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        toast.success('Скопировано в буфер обмена');
      } catch {
        toast.error('Не удалось скопировать');
      }
      document.body.removeChild(textarea);
    }
    setActiveMessageMenu(null);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMessageMenu(messageKey);
  };

  const handleLongPressStart = (messageKey: string) => {
    longPressTimeoutRef.current = setTimeout(() => {
      setActiveMessageMenu(messageKey);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleLongPressCancel = () => {
    handleLongPressEnd();
  };

  let lastDateSeparator = '';

  const isDesktop = window.innerWidth >= 768;
  const containerHeight = isDesktop ? 'calc(100vh - 6rem)' : `${viewportHeight}px`;

  return (
    <div 
      className="flex flex-col bg-white md:my-4 md:mx-4 md:rounded-xl md:shadow-sm md:border md:border-gray-200 overflow-hidden"
      style={{ 
        height: containerHeight,
        transition: 'height 0.2s ease-out'
      }}
    >
      <div className="border-b border-gray-200 bg-white px-3 sm:px-4 py-3 flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <NavLink
            to="/chats"
            className="flex items-center justify-center text-[#3D5B82] hover:text-[#96C3D6] min-w-[40px] min-h-[40px] rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Назад к чатам"
          >
            <ArrowLeft className="w-5 h-5" />
          </NavLink>
          <div className="relative min-w-0">
            <h2 className="text-base sm:text-lg font-semibold truncate">{interlocutorName}</h2>
            {isTyping && (
              <p className="text-xs sm:text-sm text-gray-500 animate-pulse truncate">
                печатает...
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {myRole !== Role.ADMIN && !isInterlocutorAdmin && (
            <button
              onClick={() => setIsCalendarModalVisible(true)}
              className="px-3 sm:px-4 py-2 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black rounded-lg transition-colors flex items-center min-h-[40px] text-sm whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Календарь</span>
            </button>
          )}
          {myRole === Role.TEACHER && !isInterlocutorAdmin && renderStudentManagement()}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={chatContainerRef}
          className="h-full overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 sm:py-4 space-y-1 select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {isLoadingMore && (
            <div className="text-center text-gray-400 py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#3D5B82] mx-auto"></div>
            </div>
          )}
          {messages.length === 0 && !isLoadingMore && (
            <div className="text-center text-gray-400 py-8 px-4">
              <p className="text-base">Начните общение</p>
              <p className="text-sm mt-1">Отправьте первое сообщение</p>
            </div>
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
            const isOwn = message.sender === myEmail;
            const messageKey = getMessageKey(message, index);
            const isMenuOpen = activeMessageMenu === messageKey;
            const isEditing = editingMessageId === messageKey;
            return (
              <React.Fragment key={messageKey}>
                {dateSeparator && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                      {lastDateSeparator}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}>
                  {isEditing ? (
                    <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-sm">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#96C3D6] mb-2 min-h-[44px] select-text"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[40px]"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-2 text-sm bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E] min-h-[40px]"
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`group relative px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? 'bg-[#3D5B82] text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        } ${isMenuOpen ? 'scale-95 opacity-90' : ''} transition-all`}
                        onDoubleClick={() => {
                          if (isOwn && !message.deleted && messageKey) {
                            handleEditMessage(messageKey, message.message);
                          }
                        }}
                        onContextMenu={(e) => {
                          if (!message.deleted && messageKey) {
                            handleContextMenu(e, messageKey);
                          }
                        }}
                        onTouchStart={() => {
                          if (!message.deleted && messageKey) {
                            handleLongPressStart(messageKey);
                          }
                        }}
                        onTouchEnd={handleLongPressEnd}
                        onTouchMove={handleLongPressCancel}
                      >
                        {message.deleted ? (
                          <p className="italic opacity-70 break-words">Сообщение удалено</p>
                        ) : (
                          <p className="break-words text-[15px]" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{message.message}</p>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end text-blue-100' : 'justify-start text-gray-400'}`}>
                          <span className="text-xs whitespace-nowrap">{formatMessageDate(message.date)}</span>
                          {message.edited && <span className="text-xs opacity-70">изменено</span>}
                        </div>
                        {!message.deleted && messageKey && isMenuOpen && (
                          <div
                            ref={messageMenuRef}
                            className="absolute -top-2 left-0 bg-white border border-gray-200 rounded-full px-1 py-0.5 shadow-lg -translate-y-1/2 -translate-x-1/3 flex items-center z-50"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyMessage(message.message);
                              }}
                              className="p-2 text-gray-500 hover:text-[#3D5B82] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Копировать"
                              aria-label="Копировать"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {isOwn && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMessage(messageKey, message.message);
                                  }}
                                  className="p-2 text-gray-500 hover:text-[#3D5B82] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                  title="Редактировать"
                                  aria-label="Редактировать"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(messageKey);
                                  }}
                                  className="p-2 text-gray-500 hover:text-red-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                  title="Удалить"
                                  aria-label="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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

      <div className="border-t border-gray-200 bg-white px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 flex-shrink-0 safe-area-bottom">
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
            className="w-full py-3 pl-4 pr-14 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96C3D6] bg-gray-50 min-h-[48px] text-base select-text"
            autoComplete="off"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#96C3D6] text-black rounded-lg hover:bg-[#3D5B82] hover:text-white disabled:opacity-40 disabled:hover:bg-[#96C3D6] disabled:hover:text-black transition-colors flex items-center justify-center active:scale-95"
            aria-label="Отправить сообщение"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isCalendarModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-stretch md:items-center justify-center z-50 p-0 md:p-8">
          <div className="w-full md:max-w-6xl h-full md:h-auto md:max-h-[90vh] bg-white md:rounded-xl shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 flex-shrink-0 safe-area-top">
              <h2 className="text-base sm:text-xl font-bold text-gray-800 truncate pr-2">
                Календарь · {interlocutorName}
              </h2>
              <button
                onClick={() => setIsCalendarModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 safe-area-bottom">
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
              <div className="h-8 md:hidden" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;