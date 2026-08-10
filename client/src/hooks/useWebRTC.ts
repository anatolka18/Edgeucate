import { useEffect, useRef, useCallback, useState } from 'react';
import { MySocket } from '../store/auth-state';
import { ACTIONS } from './actions';
import { toast } from 'react-toastify';
import useStateWithCallback from './useStateWithCallback';

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

const buildIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:3478" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

  if (turnUrl && turnUsername && turnPassword) {
    servers.push({
      urls: [
        `turn:${turnUrl}:80`,
        `turn:${turnUrl}:80?transport=tcp`,
        `turn:${turnUrl}:443?transport=tcp`,
      ],
      username: turnUsername,
      credential: turnPassword,
    });
  }

  return servers;
};

const ICE_SERVERS = buildIceServers();

export default function useWebRTC(roomID: string) {
  const [clients, updateClients] = useStateWithCallback<Client[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef<PeerConnections>({});
  const localMediaStream = useRef<MediaStream | null>(null);
  const peerMediaElements = useRef<MediaElements>({ [LOCAL_VIDEO]: null });
  const screenStream = useRef<MediaStream | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const addNewClient = useCallback((newClient: string, cb?: () => void) => {
    updateClients((list) => {
      if (!list.find((client) => client.email === newClient)) {
        return [...list, { email: newClient }];
      }
      return list;
    }, cb);
  }, [updateClients]);

  useEffect(() => {
    async function handleNewPeer({ peerID, email, createOffer = false }: { peerID: string; email?: string; createOffer?: boolean }) {
      if (peerID in peerConnections.current) {
        return;
      }

      const peerEmail = email || peerID;

      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      });

      peerConnections.current[peerID].onicecandidate = (event) => {
        if (event.candidate) {
          MySocket.socket?.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      };

      peerConnections.current[peerID].ontrack = ({ streams: [remoteStream] }) => {
        addNewClient(peerEmail, () => {
          if (peerMediaElements.current[peerEmail]) {
            peerMediaElements.current[peerEmail]!.srcObject = remoteStream;
          } else {
            let settled = false;
            const interval = setInterval(() => {
              if (peerMediaElements.current[peerEmail]) {
                peerMediaElements.current[peerEmail]!.srcObject = remoteStream;
                settled = true;
              }
              if (settled) clearInterval(interval);
            }, 1000);
          }
        });
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

  useEffect(() => {
    const handler = ({ peerID, iceCandidate }: { peerID: string; iceCandidate: RTCIceCandidateInit }) => {
      peerConnections.current[peerID]?.addIceCandidate(new RTCIceCandidate(iceCandidate));
    };
    MySocket.socket?.on(ACTIONS.ICE_CANDIDATE, handler);
    return () => {
      MySocket.socket?.off(ACTIONS.ICE_CANDIDATE);
    };
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({ peerID }: { peerID: string }) => {
      if (peerConnections.current[peerID]) {
        try {
          peerConnections.current[peerID].close();
        } catch (e) {}
        delete peerConnections.current[peerID];
      }
      if (peerMediaElements.current[peerID]) {
        const videoEl = peerMediaElements.current[peerID];
        if (videoEl) {
          videoEl.srcObject = null;
        }
        delete peerMediaElements.current[peerID];
      }
      updateClients((list) => list.filter((c) => c.email !== peerID));
    };

    MySocket.socket?.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
    return () => {
      MySocket.socket?.off(ACTIONS.REMOVE_PEER);
    };
  }, []);

  useEffect(() => {
    Object.values(peerConnections.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    peerConnections.current = {};
    Object.keys(peerMediaElements.current).forEach((key) => {
      if (key !== LOCAL_VIDEO) {
        delete peerMediaElements.current[key];
      }
    });
    updateClients([
      { email: LOCAL_VIDEO }
    ]);

    async function startCapture() {
      try {
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        });
      } catch (e) {
        localMediaStream.current = new MediaStream();
        try {
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const destination = audioContext.createMediaStreamDestination();
          oscillator.connect(destination);
          const audioTrack = destination.stream.getAudioTracks()[0];
          localMediaStream.current.addTrack(audioTrack);
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            audioContext.close();
          }, 1000);
        } catch (audioError) {
          console.error('[WEBRTC] Failed to create audio track:', audioError);
        }
      }

      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      const videoTrack = localMediaStream.current.getVideoTracks()[0];
      audioTrackRef.current = audioTrack;
      cameraVideoTrackRef.current = videoTrack;
      setIsAudioEnabled(audioTrack?.enabled ?? false);

      const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];
      if (localVideoElement) {
        localVideoElement.volume = 0;
        localVideoElement.srcObject = localMediaStream.current;
      }

      MySocket.socket?.emit(ACTIONS.JOIN, { room: roomID });
    }

    startCapture().catch((e) => console.error('[WEBRTC] startCapture error:', e));

    return () => {
      localMediaStream.current?.getTracks().forEach((track) => track.stop());
      localMediaStream.current = null;
      audioTrackRef.current = null;
      cameraVideoTrackRef.current = null;
      
      Object.values(peerConnections.current).forEach((pc) => {
        try {
          pc.close();
        } catch (e) {}
      });
      peerConnections.current = {};
      
      Object.keys(peerMediaElements.current).forEach((key) => {
        if (key !== LOCAL_VIDEO) {
          const videoEl = peerMediaElements.current[key];
          if (videoEl) {
            videoEl.srcObject = null;
          }
          delete peerMediaElements.current[key];
        }
      });

      if (screenStream.current) {
        screenStream.current.getTracks().forEach((track) => track.stop());
        screenStream.current = null;
        setIsScreenSharing(false);
      }

      MySocket.socket?.emit(ACTIONS.LEAVE);
    };
  }, [roomID]);

  const provideMediaRef = useCallback((id: string, node: HTMLVideoElement | null) => {
    peerMediaElements.current[id] = node;
  }, []);

  const toggleAudio = () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = !audioTrackRef.current.enabled;
      setIsAudioEnabled(audioTrackRef.current.enabled);
    }
  };

  const toggleVideo = () => {
    const currentVideoTrack = cameraVideoTrackRef.current;
    if (currentVideoTrack && !isScreenSharing) {
      currentVideoTrack.enabled = !currentVideoTrack.enabled;
      setIsVideoEnabled(currentVideoTrack.enabled);
    }
  };

  const startScreenShare = async () => {
    try {
      screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);

      const newVideoTrack = screenStream.current.getVideoTracks()[0];

      Object.values(peerConnections.current).forEach((peerConnection) => {
        peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'video') {
            sender.replaceTrack(newVideoTrack);
          }
        });
      });

      if (audioTrackRef.current && newVideoTrack) {
        localMediaStream.current = new MediaStream([
          audioTrackRef.current,
          newVideoTrack,
        ]);
      }

      if (peerMediaElements.current[LOCAL_VIDEO]) {
        peerMediaElements.current[LOCAL_VIDEO]!.srcObject = localMediaStream.current;
      }
    } catch (e) {
      toast.error('Не удалось начать демонстрацию экрана');
    }
  };

  const stopScreenShare = () => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
      setIsScreenSharing(false);

      navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      }).then((cameraStream) => {
        const newVideoTrack = cameraStream.getVideoTracks()[0];
        cameraVideoTrackRef.current = newVideoTrack;

        Object.values(peerConnections.current).forEach((peerConnection) => {
          peerConnection.getSenders().forEach((sender) => {
            if (sender.track?.kind === 'video') {
              sender.replaceTrack(newVideoTrack);
            }
          });
        });

        if (audioTrackRef.current && newVideoTrack) {
          localMediaStream.current = new MediaStream([
            audioTrackRef.current,
            newVideoTrack,
          ]);
        }

        if (peerMediaElements.current[LOCAL_VIDEO]) {
          peerMediaElements.current[LOCAL_VIDEO]!.srcObject = localMediaStream.current;
        }

        setIsVideoEnabled(audioTrackRef.current?.enabled !== false);
      }).catch((e) => {
        console.error('[WEBRTC] Error restoring video stream:', e);
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