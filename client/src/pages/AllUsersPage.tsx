import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "sonner";
import { IResponseUser } from "../types/user";
import { MessageCircle, Shield, ShieldOff, Megaphone } from "lucide-react";

const AllUsersPage: React.FC = () => {
  const [users, setUsers] = useState<IResponseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IResponseUser | null>(null);
  const [blockReason, setBlockReason] = useState("");
  
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get<{ data: IResponseUser[]; total: number }>('/profile?page=1&limit=200');
      const filteredUsers = data.data.filter(user => user.role !== 'Admin');
      setUsers(filteredUsers);
    } catch (error) {
      toast.error("Не удалось загрузить список пользователей");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    
    try {
      await instance.patch(`/profile/${selectedUser.email}/block`, {
        isBlocked: true,
        blockReason: blockReason || "Причина не указана"
      });
      toast.success(`Пользователь ${selectedUser.username} заблокирован`);
      setBlockModalOpen(false);
      setBlockReason("");
      fetchUsers();
    } catch (error) {
      toast.error("Не удалось заблокировать пользователя");
    }
  };

  const handleUnblockUser = async (email: string) => {
    try {
      await instance.patch(`/profile/${email}/block`, {
        isBlocked: false,
        blockReason: ""
      });
      toast.success("Пользователь разблокирован");
      fetchUsers();
    } catch (error) {
      toast.error("Не удалось разблокировать пользователя");
    }
  };

  const handleSendMessage = (recipient: string) => {
    navigate(`/chat/${recipient}`);
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Заполните заголовок и сообщение");
      return;
    }

    try {
      setIsSending(true);
      const { data } = await instance.post('/notifications/broadcast', {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
      });
      toast.success(`Уведомление отправлено ${data.recipientsCount} пользователям`);
      setBroadcastModalOpen(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Не удалось отправить уведомление";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Список пользователей</h1>
          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2d4565] transition-colors min-h-[44px] font-medium"
          >
            <Megaphone className="w-5 h-5" />
            Отправить уведомление всем
          </button>
        </div>
        
        {blockModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 w-full max-w-md mx-4 safe-area-top safe-area-bottom">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Блокировка пользователя</h2>
              <p className="mb-4 text-sm sm:text-base break-words text-gray-700 dark:text-gray-300">
                Вы собираетесь заблокировать пользователя <span className="font-semibold text-gray-900 dark:text-white">{selectedUser.username}</span> ({selectedUser.email})
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Причина блокировки</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6] resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Укажите причину блокировки"
                  rows={3}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setBlockModalOpen(false);
                    setBlockReason("");
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 min-h-[44px] font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBlockUser}
                  className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 min-h-[44px] font-medium transition-colors"
                >
                  Заблокировать
                </button>
              </div>
            </div>
          </div>
        )}

        {broadcastModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 w-full max-w-lg mx-4 safe-area-top safe-area-bottom">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-6 h-6 text-[#3D5B82] dark:text-[#96C3D6]" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Массовая рассылка</h2>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Уведомление будет отправлено всем {users.length} активным пользователям. Офлайн-пользователи увидят его при следующем входе.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Заголовок <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  maxLength={200}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#96C3D6] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Важное обновление"
                />
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                  {broadcastTitle.length}/200
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Сообщение <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  maxLength={1000}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6] resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Текст уведомления..."
                  rows={4}
                />
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                  {broadcastMessage.length}/1000
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setBroadcastModalOpen(false);
                    setBroadcastTitle("");
                    setBroadcastMessage("");
                  }}
                  disabled={isSending}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 min-h-[44px] font-medium transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBroadcast}
                  disabled={isSending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                  className="px-4 py-3 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2d4565] min-h-[44px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-4 h-4" />
                      Отправить всем
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="md:hidden space-y-3">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.email} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                    user.isBlocked 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  }`}>
                    {user.isBlocked ? 'Заблокирован' : 'Активен'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'Teacher' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {user.role === 'Teacher' ? 'Преподаватель' : 'Ученик'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendMessage(user.email)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-[#3D5B82] dark:text-[#96C3D6] rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors min-h-[44px] font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Написать
                  </button>
                  {user.isBlocked ? (
                    <button
                      onClick={() => handleUnblockUser(user.email)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors min-h-[44px] font-medium"
                    >
                      <Shield className="w-4 h-4" />
                      Разблокировать
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setBlockModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors min-h-[44px] font-medium"
                    >
                      <ShieldOff className="w-4 h-4" />
                      Заблокировать
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Пользователи не найдены</p>
            </div>
          )}
        </div>

        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Имя пользователя</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'Teacher' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
                          {user.role === 'Teacher' ? 'Преподаватель' : 'Ученик'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.isBlocked ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            Заблокирован
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Активен
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleSendMessage(user.email)}
                            className="text-[#3D5B82] dark:text-[#96C3D6] hover:text-[#96C3D6] dark:hover:text-white px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors min-h-[40px] font-medium"
                            title="Написать сообщение"
                          >
                            Написать
                          </button>
                          {user.isBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user.email)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors min-h-[40px] font-medium"
                              title="Разблокировать пользователя"
                            >
                              Разблокировать
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setBlockModalOpen(true);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[40px] font-medium"
                              title="Заблокировать пользователя"
                            >
                              Заблокировать
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllUsersPage;