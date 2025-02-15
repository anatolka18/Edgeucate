import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { instance } from "../api/axios.api";
import { toast } from "react-toastify";
import { IResponseUser } from "../types/user";

const AllUsersPage: React.FC = () => {
  const [users, setUsers] = useState<IResponseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IResponseUser | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get<IResponseUser[]>('/profile');
      const filteredUsers = data.filter(user => user.role !== 'Admin');
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

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Список пользователей</h1>
        
        {blockModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Блокировка пользователя</h2>
              <p className="mb-4">Вы собираетесь заблокировать пользователя <span className="font-semibold">{selectedUser.username}</span> ({selectedUser.email})</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Причина блокировки</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Укажите причину блокировки"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setBlockModalOpen(false);
                    setBlockReason("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBlockUser}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Заблокировать
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя пользователя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'Teacher' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role === 'Teacher' ? 'Преподаватель' : 'Ученик'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.isBlocked ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleSendMessage(user.email)}
                          className="text-[#3D5B82] hover:text-[#96C3D6] px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="Написать сообщение"
                        >
                          Написать
                        </button>
                        {user.isBlocked ? (
                          <button
                            onClick={() => handleUnblockUser(user.email)}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 transition-colors"
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
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Пользователи не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllUsersPage;