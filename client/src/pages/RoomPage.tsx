import { useNavigate, useParams } from 'react-router-dom';
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC';
import { useMyProfile } from '../hooks/useMyProfile';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaSignOutAlt, FaDesktop } from 'react-icons/fa';

interface RoomParams {
  [key: string]: string | undefined;
}

export default function RoomPage() {
  const { id: roomID } = useParams<RoomParams>();
  const profile = useMyProfile();

  if (!roomID) {
    return <div className="text-white text-xl">Error: Room ID is missing!</div>;
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
    isScreenSharing
  } = useWebRTC(roomID);

  const navigate = useNavigate();

  const getGridLayout = () => {
    const count = clients.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-3";
  };

  return (
    <div className="relative w-full h-screen flex bg-gray-900 p-4">
      <div
        className={`grid w-full gap-4 ${getGridLayout()}`}
        style={{
          gridAutoRows: 'minmax(200px, 1fr)',
        }}
      >
        {clients.map((client) => {
          const clientID = client.email;

          return (
            <div
              key={clientID}
              className="relative border rounded-lg overflow-hidden bg-gray-800 flex justify-center items-center shadow-lg"
            >
              <div className="w-full h-full">
                <video
                  width="100%"
                  height="100%"
                  ref={instance => {
                    provideMediaRef(clientID, instance);
                  }}
                  autoPlay
                  playsInline
                  muted={clientID === LOCAL_VIDEO}
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">
                    {clientID === LOCAL_VIDEO ? profile?.username || 'Вы' : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex space-x-6 bg-gray-800/80 px-6 py-3 rounded-full backdrop-blur-sm shadow-lg">
        <button 
          onClick={toggleAudio} 
          className={`p-3 rounded-full ${isAudioEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
        >
          {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>

        <button 
          onClick={toggleVideo} 
          className={`p-3 rounded-full ${isVideoEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
        >
          {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>

        <button 
          onClick={isScreenSharing ? stopScreenShare : startScreenShare} 
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
        >
          <FaDesktop />
        </button>

        <button 
          onClick={() => navigate("/")} 
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}