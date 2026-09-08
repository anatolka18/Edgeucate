import { FC, useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Star,
  Calendar,
  Megaphone,
  MessageCircle,
  Inbox,
} from "lucide-react";
import { notificationsWebSocket, Notification } from "../services/notificationsWebSocket";

const NotificationBell: FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUnread = (count: number) => setUnreadCount(count);

    const handleNew = (notification: Notification) => {
      setNotifications(prev => {
        const exists = prev.some(n =>
          n.title === notification.title &&
          n.message === notification.message &&
          n.type === notification.type
        );
        if (exists) return prev;
        return [notification, ...prev].slice(0, 20);
      });
    };

    const handleList = (list: Notification[]) => {
      setNotifications(list);
      setIsLoading(false);
    };

    const handleMarkedAll = () => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    notificationsWebSocket.on("unread_count", handleUnread);
    notificationsWebSocket.on("new_notification", handleNew);
    notificationsWebSocket.on("notifications_list", handleList);
    notificationsWebSocket.on("marked_all_read", handleMarkedAll);

    return () => {
      notificationsWebSocket.off("unread_count", handleUnread);
      notificationsWebSocket.off("new_notification", handleNew);
      notificationsWebSocket.off("notifications_list", handleList);
      notificationsWebSocket.off("marked_all_read", handleMarkedAll);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setIsLoading(true);
      notificationsWebSocket.getNotifications(20);

      if (unreadCount > 0) {
        notificationsWebSocket.markAllAsRead();
      }
    }
  }, [isOpen, unreadCount]);

  const getIcon = (type: string) => {
    switch (type) {
      case "new_review":
        return <Star className="w-5 h-5 text-yellow-500" />;
      case "booking_request":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "system_announcement":
        return <Megaphone className="w-5 h-5 text-purple-500" />;
      case "new_message":
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "только что";
    if (diffMin < 60) return `${diffMin} мин назад`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[60] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Уведомления</h3>
          </div>

          <div
            className="max-h-[400px] overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
            }}
          >
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                Загрузка...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <Inbox className="w-8 h-8" />
                <span>Нет уведомлений</span>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id || notification.createdAt}
                  className="w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;