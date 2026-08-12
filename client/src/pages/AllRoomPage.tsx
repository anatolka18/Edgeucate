import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MySocket } from '../store/auth-state';
import { ACTIONS } from '../hooks/actions';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { Video, Plus, LogIn, Copy, Users, Check } from 'lucide-react';

interface Room {
  roomID: string;
}

export default function AllRoomPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomIDInput, setRoomIDInput] = useState<string>('');
  const [newRoomID, setNewRoomID] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cleanupFns: Array<() => void> = [];
    let attempts = 0;
    const MAX_ATTEMPTS = 20;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const setupListeners = () => {
      if (!MySocket.socket) return;

      const handleShareRooms = ({ rooms = [] }: { rooms?: string[] } = {}) => {
        setRooms(rooms.map((roomID) => ({ roomID })));
      };

      const handleRoomDeleted = ({ roomID }: { roomID: string }) => {
        setRooms((prev) => prev.filter((room) => room.roomID !== roomID));
        toast.info('Комната была удалена');
      };

      MySocket.socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms);
      MySocket.socket.on(ACTIONS.ROOM_DELETED, handleRoomDeleted);

      cleanupFns.push(() => {
        MySocket.socket?.off(ACTIONS.SHARE_ROOMS, handleShareRooms);
        MySocket.socket?.off(ACTIONS.ROOM_DELETED, handleRoomDeleted);
      });
    };

    const trySetup = () => {
      if (MySocket.socket) {
        if (MySocket.socket.connected) {
          setupListeners();
        } else {
          const onConnect = () => setupListeners();
          MySocket.socket.on('connect', onConnect);
          cleanupFns.push(() => {
            MySocket.socket?.off('connect', onConnect);
          });
          setupListeners();
        }
      } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        retryTimer = setTimeout(trySetup, 500);
      }
    };

    trySetup();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  const handleCreateRoom = () => {
    try {
      const id = uuidv4();
      const roomIDWithPrefix = `Room_${id}`;
      MySocket.socket?.emit(ACTIONS.CREATE_ROOM, { roomID: roomIDWithPrefix });
      setNewRoomID(id);
      toast.success('Комната создана');
    } catch (error) {
      toast.error('Не удалось создать комнату');
    }
  };

  const handleJoinRoom = () => {
    const trimmed = roomIDInput.trim();
    if (!trimmed) {
      toast.error('Введите ID комнаты');
      return;
    }
    const roomIDWithPrefix = trimmed.startsWith('Room_') ? trimmed : `Room_${trimmed}`;
    navigate(`/room/${roomIDWithPrefix}`);
  };

  const handleEnterCreatedRoom = () => {
    if (!newRoomID) return;
    navigate(`/room/Room_${newRoomID}`);
    setNewRoomID('');
  };

  const handleCopyRoomId = () => {
    if (!newRoomID) return;
    navigator.clipboard.writeText(newRoomID).then(() => {
      setCopied(true);
      toast.success('Код скопирован');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Не удалось скопировать');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3D5B82] to-[#5A7FA8] px-6 sm:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Видеочаты</h1>
                <p className="text-blue-100 text-sm mt-1">Создавай комнату и приглашай участников</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {rooms.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#3D5B82]" />
                  Активные комнаты ({rooms.length})
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {rooms.map(({ roomID }) => {
                    const shortID = roomID.replace('Room_', '').substring(0, 8);
                    return (
                      <div
                        key={roomID}
                        className="group bg-gradient-to-r from-gray-50 to-slate-50 hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-[#96C3D6] rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="bg-[#3D5B82]/10 p-2 rounded-xl flex-shrink-0">
                              <Video className="w-5 h-5 text-[#3D5B82]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-sm font-semibold text-gray-800 truncate">
                                {shortID}...
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">Комната активна</p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/room/${roomID}`)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3D5B82] hover:bg-[#2D4B6E] text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg min-h-[44px] font-medium text-sm flex-shrink-0"
                          >
                            <LogIn className="w-4 h-4" />
                            Войти
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-8 text-center py-8">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Нет активных комнат</p>
                <p className="text-gray-400 text-sm mt-1">Создай первую комнату прямо сейчас</p>
              </div>
            )}

            <button
              onClick={handleCreateRoom}
              className="w-full mb-6 flex items-center justify-center gap-3 bg-gradient-to-r from-[#96C3D6] to-[#7BB3CC] hover:from-[#3D5B82] hover:to-[#5A7FA8] text-white py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl min-h-[56px] font-semibold text-lg"
            >
              <Plus className="w-6 h-6" />
              Создать комнату
            </button>

            {newRoomID ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-700">Комната создана!</p>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">Код для входа:</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <code className="bg-white px-5 py-3 rounded-xl text-xl font-mono font-bold text-[#3D5B82] select-all break-all shadow-inner border border-gray-200">
                    {newRoomID}
                  </code>
                  <button
                    onClick={handleCopyRoomId}
                    className={`p-3 rounded-xl transition-all duration-200 min-w-[48px] min-h-[48px] flex items-center justify-center ${
                      copied
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    aria-label="Скопировать код"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                
                <button
                  onClick={handleEnterCreatedRoom}
                  className="w-full sm:w-auto px-8 py-3 bg-[#3D5B82] hover:bg-[#2D4B6E] text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md min-h-[48px] font-semibold"
                >
                  Войти в комнату
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-[#3D5B82]" />
                  Или войди по коду
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Введите ID комнаты"
                    value={roomIDInput}
                    onChange={(e) => setRoomIDInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                    className="flex-1 p-3.5 border-2 border-gray-200 focus:border-[#96C3D6] rounded-xl min-h-[48px] focus:outline-none transition-colors text-base bg-white"
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="flex items-center justify-center gap-2 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-gray-800 py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[48px] font-medium shadow-md"
                  >
                    <LogIn className="w-5 h-5" />
                    Присоединиться
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Edgeucate • Видеозвонки для образования
        </p>
      </div>
    </div>
  );
}