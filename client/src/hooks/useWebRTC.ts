import { useEffect, useRef, useCallback, useState } from 'react';
import freeice from 'freeice';
import useStateWithCallback from './useStateWithCallback';
import { MySocket } from '../App';
import { ACTIONS } from './actions';

export const LOCAL_VIDEO = 'LOCAL_VIDEO';

interface PeerConnections {
  [peerID: string]: RTCPeerConnection;
}

interface MediaElements {
  [key: string]: HTMLVideoElement | null;
}

interface Client {
  email: string;
}

export default function useWebRTC(roomID: string) {
  const [clients, updateClients] = useStateWithCallback<Client[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef<PeerConnections>({});
  const localMediaStream = useRef<MediaStream | null>(null);
  const peerMediaElements = useRef<MediaElements>({ [LOCAL_VIDEO]: null });
  const screenStream = useRef<MediaStream | null>(null);

  const addNewClient = useCallback((newClient: string, cb?: () => void) => {
    updateClients((list) => {
      if (!list.find((client) => client.email === newClient)) {
        return [...list, { email: newClient }];
      }
      return list;
    }, cb);
  }, [updateClients]);

  // Обработка подключения новых пиров
  useEffect(() => {
    async function handleNewPeer({ peerID, createOffer }: { peerID: string; createOffer: boolean }) {
      if (peerID in peerConnections.current) {
        return console.warn(`Already connected to peer ${peerID}`);
      }

      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: freeice(),
      });

      peerConnections.current[peerID].onicecandidate = (event) => {
        if (event.candidate && MySocket.socket) {
          MySocket.socket.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      };

      let tracksNumber = 0;
      peerConnections.current[peerID].ontrack = ({ streams: [remoteStream] }) => {
        tracksNumber++;

        if (tracksNumber === 2) {
          tracksNumber = 0;
          addNewClient(peerID, () => {
            if (peerMediaElements.current[peerID]) {
              peerMediaElements.current[peerID]!.srcObject = remoteStream;
            } else {
              let settled = false;
              const interval = setInterval(() => {
                if (peerMediaElements.current[peerID]) {
                  peerMediaElements.current[peerID]!.srcObject = remoteStream;
                  settled = true;
                }
                if (settled) clearInterval(interval);
              }, 1000);
            }
          });
        }
      };

      localMediaStream.current?.getTracks().forEach((track) => {
        peerConnections.current[peerID].addTrack(track, localMediaStream.current!);
      });

      if (createOffer) {
        const offer = await peerConnections.current[peerID].createOffer();
        await peerConnections.current[peerID].setLocalDescription(offer);
        MySocket.socket?.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: offer,
        });
      }
    }

    MySocket.socket?.on(ACTIONS.ADD_PEER, handleNewPeer);
    return () => {
      MySocket.socket?.off(ACTIONS.ADD_PEER);
    };
  }, []);

  // Обработка SDP
  useEffect(() => {
    async function setRemoteMedia({
      peerID,
      sessionDescription: remoteDescription,
    }: {
      peerID: string;
      sessionDescription: RTCSessionDescriptionInit;
    }) {
      await peerConnections.current[peerID]?.setRemoteDescription(
        new RTCSessionDescription(remoteDescription)
      );
      if (remoteDescription.type === 'offer') {
        const answer = await peerConnections.current[peerID]!.createAnswer();
        await peerConnections.current[peerID]!.setLocalDescription(answer);
        MySocket.socket?.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: answer,
        });
      }
    }

    MySocket.socket?.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
    return () => {
      MySocket.socket?.off(ACTIONS.SESSION_DESCRIPTION);
    };
  }, []);

  // Обработка ICE
  useEffect(() => {
    MySocket.socket?.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }: { peerID: string; iceCandidate: RTCIceCandidateInit }) => {
      peerConnections.current[peerID]?.addIceCandidate(new RTCIceCandidate(iceCandidate));
    });
    return () => {
      MySocket.socket?.off(ACTIONS.ICE_CANDIDATE);
    };
  }, []);

  // Отключение пиров
  useEffect(() => {
    const handleRemovePeer = ({ peerID }: { peerID: string }) => {
      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }
      delete peerConnections.current[peerID];
      delete peerMediaElements.current[peerID];
      updateClients((list) => list.filter((c) => c.email !== peerID));
    };

    MySocket.socket?.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
    return () => {
      MySocket.socket?.off(ACTIONS.REMOVE_PEER);
    };
  }, []);

  // Инициализация медиа
  useEffect(() => {
    async function startCapture() {
      try {
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        });
      } catch (e) {
        console.error('Error getting userMedia:', e);
        return;
      }

      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      setIsAudioEnabled(audioTrack?.enabled ?? true);

      addNewClient(LOCAL_VIDEO, () => {
        const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];
        if (localVideoElement) {
          localVideoElement.volume = 0;
          localVideoElement.srcObject = localMediaStream.current;
        }
      });

      if (MySocket.socket) {
        MySocket.socket.emit(ACTIONS.JOIN, { room: roomID });
      }
    }

    startCapture()
      .catch((e) => console.error('Error starting capture:', e));

    return () => {
      localMediaStream.current?.getTracks().forEach((track) => track.stop());
      if (MySocket.socket) {
        MySocket.socket.emit(ACTIONS.LEAVE);
      }
    };
  }, [roomID]);

  // Рефы для видео
  const provideMediaRef = useCallback((id: string, node: HTMLVideoElement | null) => {
    peerMediaElements.current[id] = node;
  }, []);

  // Управление аудио
  const toggleAudio = () => {
    if (localMediaStream.current) {
      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Управление видео
  const toggleVideo = () => {
    if (localMediaStream.current) {
      const videoTrack = localMediaStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Начало шаринга экрана
  const startScreenShare = async () => {
    try {
      screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);

      localMediaStream.current?.getVideoTracks().forEach((track) => track.stop());

      screenStream.current.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          Object.values(peerConnections.current).forEach((peerConnection) => {
            peerConnection.getSenders().forEach((sender) => {
              if (sender.track?.kind === 'video') {
                sender.replaceTrack(track);
              }
            });
          });
        }
      });

      localMediaStream.current = screenStream.current;

      if (peerMediaElements.current[LOCAL_VIDEO]) {
        peerMediaElements.current[LOCAL_VIDEO]!.srcObject = screenStream.current;
      }

      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      setIsAudioEnabled(audioTrack?.enabled ?? true);
    } catch (e) {
      console.error('Error starting screen share', e);
    }
  };

  // Остановка шаринга и возврат к камере
  const stopScreenShare = () => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
      setIsScreenSharing(false);

      navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      }).then((newLocalStream) => {
        localMediaStream.current = newLocalStream;

        newLocalStream.getTracks().forEach((track) => {
          if (track.kind === 'video') {
            Object.values(peerConnections.current).forEach((peerConnection) => {
              peerConnection.getSenders().forEach((sender) => {
                if (sender.track?.kind === 'video') {
                  sender.replaceTrack(track);
                }
              });
            });
          }
        });

        if (peerMediaElements.current[LOCAL_VIDEO]) {
          peerMediaElements.current[LOCAL_VIDEO]!.srcObject = newLocalStream;
        }

        const audioTrack = newLocalStream.getAudioTracks()[0];
        setIsAudioEnabled(audioTrack?.enabled ?? true);
      }).catch((e) => {
        console.error('Error restoring video stream', e);
      });
    }
  };

  return {
    clients,
    provideMediaRef,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
  };
}