import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MySocket } from '../store/auth-state';
import { ACTIONS } from '../hooks/actions';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { Video, Plus, LogIn, Copy } from 'lucide-react';

interface Room {
  roomID: string;
}

export default function AllRoomPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomIDInput, setRoomIDInput] = useState<string>('');
  const [newRoomID, setNewRoomID] = useState<string>('');

  useEffect(() => {
    if (!MySocket.socket) {
      return;
    }

    const handleShareRooms = ({ rooms = [] }: { rooms?: string[] } = {}) => {
      setRooms(rooms.map((roomID) => ({ roomID })));
    };

    MySocket.socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms);

    return () => {
      MySocket.socket?.off(ACTIONS.SHARE_ROOMS, handleShareRooms);
    };
  }, []);

  const handleCreateRoom = () => {
    try {
      const newRoomID = uuidv4();
      const roomIDWithPrefix = `Room_${newRoomID}`;
      MySocket.socket?.emit(ACTIONS.CREATE_ROOM, { roomID: roomIDWithPrefix });
      setNewRoomID(newRoomID);
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
    const roomIDWithPrefix = `Room_${newRoomID}`;
    navigate(`/room/${roomIDWithPrefix}`);
    setNewRoomID('');
  };

  const handleCopyRoomId = () => {
    if (newRoomID) {
      navigator.clipboard.writeText(newRoomID).then(() => {
        toast.success('Код скопирован');
      }).catch(() => {
        toast.error('Не удалось скопировать');
      });
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="bg-white p-5 sm:p-8 rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Video className="w-7 h-7 text-[#3D5B82]" />
          <h1 className="text-xl sm:text-2xl font-semibold text-center">Видеочаты</h1>
        </div>

        {rooms.length > 0 && (
          <ul className="space-y-3 mb-6">
            {rooms.map(({ roomID }) => (
              <li key={roomID} className="bg-gray-50 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <span className="text-sm font-medium truncate text-center sm:text-left">{roomID}</span>
                <button
                  onClick={() => navigate(`/room/${roomID}`)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#96C3D6] text-black rounded-lg hover:bg-[#3D5B82] hover:text-white transition-colors min-h-[44px] font-medium flex-shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  Войти
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleCreateRoom}
          className="w-full mb-6 flex items-center justify-center gap-2 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black py-3 rounded-lg transition-colors min-h-[48px] font-medium"
        >
          <Plus className="w-5 h-5" />
          Создать комнату
        </button>

        {newRoomID && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Код для входа:</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <code className="bg-gray-100 px-4 py-2 rounded-lg text-lg font-mono font-bold text-[#3D5B82] select-all break-all">
                {newRoomID}
              </code>
              <button
                onClick={handleCopyRoomId}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Скопировать код"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={handleEnterCreatedRoom}
              className="w-full sm:w-auto px-6 py-3 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E] transition-colors min-h-[44px] font-medium"
            >
              Войти в комнату
            </button>
          </div>
        )}

        {!newRoomID && (
          <div className="flex flex-col items-stretch gap-3">
            <input
              type="text"
              placeholder="Введите ID комнаты"
              value={roomIDInput}
              onChange={(e) => setRoomIDInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              className="w-full p-3 border border-gray-300 rounded-lg min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6] text-base"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full flex items-center justify-center gap-2 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black py-3 px-4 rounded-lg transition-colors min-h-[48px] font-medium"
            >
              <LogIn className="w-5 h-5" />
              Присоединиться
            </button>
          </div>
        )}
      </div>
    </div>
  );
}