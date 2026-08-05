import { useNavigate, useParams } from 'react-router-dom';
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC';
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

function getUserName(email: string): string {
  if (email === LOCAL_VIDEO) return 'Вы';
  return email.split('@')[0] || email;
}

export default function RoomPage() {
  const { id: roomID } = useParams<RoomParams>();
  const profile = useMyProfile();
  const navigate = useNavigate();

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
            const isLocal = email === LOCAL_VIDEO;
            const displayName = isLocal
              ? profile?.username || 'Вы'
              : getUserName(email);

            const videoActive = isLocal ? isVideoEnabled : true;
            const audioActive = isLocal ? isAudioEnabled : true;

            return (
              <div
                key={email}
                className="relative flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl bg-gray-900 border border-gray-800 shadow-lg min-h-0"
              >
                <div className="absolute inset-0">
                  <video
                    ref={(node) => provideMediaRef(email, node)}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`h-full w-full object-cover ${
                      videoActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>

                {!videoActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
                    <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-blue-600 text-lg sm:text-2xl font-bold uppercase">
                      {displayName.charAt(0)}
                    </div>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between rounded-lg bg-black/60 px-2 py-1.5 sm:px-3 sm:py-2 backdrop-blur-md text-xs sm:text-sm">
                  <span className="truncate max-w-[75%] font-medium">
                    {displayName} {isLocal && '(Вы)'}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {!audioActive && (
                      <span className="text-red-400">
                        <FaMicrophoneSlash size={12} />
                      </span>
                    )}
                    {!videoActive && (
                      <span className="text-red-400">
                        <FaVideoSlash size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 rounded-3xl bg-gray-900/95 px-3 sm:px-6 py-2 sm:py-3 backdrop-blur-lg border border-gray-800 shadow-xl safe-area-bottom max-w-[calc(100vw-2rem)]">
        <button
          onClick={() => toggleAudio()}
          title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          aria-label={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-base sm:text-lg transition-all hover:scale-105 active:scale-95 ${
            isAudioEnabled
              ? 'bg-gray-800 text-white hover:bg-gray-700'
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
              ? 'bg-gray-800 text-white hover:bg-gray-700'
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
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          <FaDesktop />
        </button>

        <div className="h-6 w-px bg-gray-700 flex-shrink-0" />

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