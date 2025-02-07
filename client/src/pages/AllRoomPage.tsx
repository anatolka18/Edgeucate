import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MySocket } from '../App';
import { ACTIONS } from '../hooks/actions';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

interface Room {
  roomID: string;
}

export default function AllRoomPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomIDInput, setRoomIDInput] = useState<string>('');
  const [newRoomID, setNewRoomID] = useState<string>('');

  useEffect(() => {
    if (!MySocket.socket) return;

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

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center mb-6">Видеочаты</h1>

        {rooms.length > 0 && (
          <ul className="space-y-4 mb-6">
            {rooms.map(({ roomID }) => (
              <li key={roomID} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium truncate">{roomID}</span>
                <button
                  onClick={() => navigate(`/room/${roomID}`)}
                  className="px-4 py-2 bg-[#96C3D6] text-black rounded-lg hover:bg-[#3D5B82] transition-colors"
                >
                  Войти
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleCreateRoom}
          className="w-full mb-6 bg-[#96C3D6] hover:bg-[#3D5B82] text-black py-2 rounded-lg transition-colors"
        >
          Создать комнату
        </button>

        {newRoomID && (
          <div className="mb-4 text-center text-sm">
            <p>Код для входа: <strong>{newRoomID}</strong></p>
            <button
              onClick={handleEnterCreatedRoom}
              className="mt-2 px-4 py-2 bg-[#3D5B82] text-white rounded-lg hover:bg-[#2D4B6E] transition-colors"
            >
              Войти в комнату
            </button>
          </div>
        )}

        {!newRoomID && (
          <div className="flex flex-col items-center">
            <input
              type="text"
              placeholder="Введите ID комнаты"
              value={roomIDInput}
              onChange={(e) => setRoomIDInput(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleJoinRoom}
              className="bg-[#96C3D6] hover:bg-[#3D5B82] text-black py-2 px-4 rounded-lg transition-colors"
            >
              Присоединиться
            </button>
          </div>
        )}
      </div>
    </div>
  );
}