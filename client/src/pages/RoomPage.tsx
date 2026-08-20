import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC';
import { MySocket } from '../store/auth-state';
import { ACTIONS } from '../hooks/actions';
import { useMyProfile } from '../hooks/useMyProfile';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaSignOutAlt,
  FaDesktop,
} from 'react-icons/fa';

interface RoomParams {
  [key: string]: string | undefined;
}

function getUserName(email: string, username?: string): string {
  if (email === LOCAL_VIDEO) return 'Вы';
  if (username && username.trim()) return username;
  return email.split('@')[0] || email;
}

export default function RoomPage() {
  const { id: roomID } = useParams<RoomParams>();
  const profile = useMyProfile();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRoomDeleted = ({ roomID: deletedRoomID }: { roomID: string }) => {
      if (deletedRoomID === roomID) {
        toast.info('Комната была удалена создателем');
        navigate('/');
      }
    };

    MySocket.socket?.on(ACTIONS.ROOM_DELETED, handleRoomDeleted);
    return () => {
      MySocket.socket?.off(ACTIONS.ROOM_DELETED, handleRoomDeleted);
    };
  }, [roomID, navigate]);

  if (!roomID) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950 text-white text-lg p-4">
        Ошибка: ID комнаты отсутствует!
      </div>
    );
  }

  const {
    clients,
    provideMediaRef,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    peerStatuses,
  } = useWebRTC(roomID);

  const getGridLayout = () => {
    const count = clients.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-gray-950 text-white font-sans select-none">
      <div className="flex-1 w-full overflow-hidden px-2 sm:px-4 pb-24 sm:pb-28 pt-2 sm:pt-4">
        <div className={`grid gap-2 sm:gap-4 auto-rows-fr h-full ${getGridLayout()}`}>
          {clients.map((client) => {
            const email = client.email;
            if (!email) return null;

            const isLocal = email === LOCAL_VIDEO;
            const displayName = isLocal
              ? profile?.username || getUserName(email)
              : getUserName(email, (client as any).username);

            const peerStatus = peerStatuses.get(email);
            const videoActive = isLocal ? isVideoEnabled : (peerStatus?.video ?? true);
            const audioActive = isLocal ? isAudioEnabled : (peerStatus?.audio ?? true);
            const peerScreenSharing = isLocal ? isScreenSharing : (peerStatus?.screenShare ?? false);
            const isMuted = !isLocal && peerStatus?.video === false;

            return (
              <VideoTile
                key={email}
                email={email}
                displayName={displayName}
                isLocal={isLocal}
                videoActive={videoActive}
                audioActive={audioActive}
                isMuted={isMuted}
                isScreenSharing={peerScreenSharing}
                provideMediaRef={provideMediaRef}
              />
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 rounded-3xl bg-gray-900/95 dark:bg-gray-800/95 px-3 sm:px-6 py-2 sm:py-3 backdrop-blur-lg border border-gray-800 dark:border-gray-700 shadow-xl safe-area-bottom max-w-[calc(100vw-2rem)]">
        <button
          onClick={() => toggleAudio()}
          title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          aria-label={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-base sm:text-lg transition-all hover:scale-105 active:scale-95 ${
            isAudioEnabled
              ? 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
              : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
          }`}
        >
          {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>

        <button
          onClick={() => toggleVideo()}
          title={isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
          aria-label={isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
          className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-base sm:text-lg transition-all hover:scale-105 active:scale-95 ${
            isVideoEnabled
              ? 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
              : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
          }`}
        >
          {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>

        <button
          onClick={() => isScreenSharing ? stopScreenShare() : startScreenShare()}
          title={isScreenSharing ? 'Остановить показ экрана' : 'Демонстрация экрана'}
          aria-label={isScreenSharing ? 'Остановить показ экрана' : 'Демонстрация экрана'}
          className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-base sm:text-lg transition-all hover:scale-105 active:scale-95 ${
            isScreenSharing
              ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
              : 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          <FaDesktop />
        </button>

        <div className="h-6 w-px bg-gray-700 dark:bg-gray-600 flex-shrink-0" />

        <button
          onClick={() => navigate('/')}
          title="Покинуть встречу"
          aria-label="Покинуть встречу"
          className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}

function VideoTile({
  email,
  displayName,
  isLocal,
  videoActive,
  audioActive,
  isMuted,
  isScreenSharing,
  provideMediaRef,
}: {
  email: string;
  displayName: string;
  isLocal: boolean;
  videoActive: boolean;
  audioActive: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  provideMediaRef: (id: string, node: HTMLVideoElement | null) => void;
}) {
  const showVideo = videoActive && !isMuted;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl bg-gray-900 dark:bg-gray-800 border border-gray-800 dark:border-gray-700 shadow-lg min-h-0">
      <div className="absolute inset-0">
        <video
          ref={(node) => provideMediaRef(email, node)}
          autoPlay
          playsInline
          muted={isLocal}
          className={`h-full w-full object-cover transition-opacity duration-200 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 gap-2">
          <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] text-lg sm:text-2xl font-bold uppercase text-white">
            {initial}
          </div>
          {isScreenSharing && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <FaDesktop size={10} /> Демонстрация экрана
            </span>
          )}
        </div>
      )}

      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between rounded-lg bg-black/60 px-2 py-1.5 sm:px-3 sm:py-2 backdrop-blur-md text-xs sm:text-sm text-white">
        <span className="truncate max-w-[75%] font-medium flex items-center gap-1">
          {isScreenSharing && <FaDesktop size={10} className="text-green-400" />}
          {displayName} {isLocal && '(Вы)'}
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          {!audioActive && (
            <span className="text-red-400" title="Микрофон выключен">
              <FaMicrophoneSlash size={12} />
            </span>
          )}
          {!showVideo && (
            <span className="text-red-400" title="Камера выключена">
              <FaVideoSlash size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}