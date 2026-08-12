import { useEffect, useRef, useCallback, useState } from 'react';
import { MySocket } from '../store/auth-state';
import { ACTIONS } from './actions';
import { toast } from 'react-toastify';
import { instance } from '../api/axios.api';
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
  username?: string;
}

interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
}

export interface PeerStatus {
  video: boolean;
  audio: boolean;
  screenShare: boolean;
}

const DEFAULT_PEER_STATUS: PeerStatus = {
  video: true,
  audio: true,
  screenShare: false,
};

const FALLBACK_STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:3478" },
  { urls: "stun:stun4.l.google.com:19302" },
];

const TURN_FETCH_TIMEOUT_MS = 5000;

const buildIceServers = (turn?: TurnCredentials | null): RTCIceServer[] => {
  const servers: RTCIceServer[] = [...FALLBACK_STUN_SERVERS];

  if (turn && turn.urls && turn.username && turn.credential) {
    servers.push({
      urls: turn.urls,
      username: turn.username,
      credential: turn.credential,
    });
  }

  return servers;
};

export default function useWebRTC(roomID: string) {
  const [clients, updateClients] = useStateWithCallback<Client[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerStatuses, setPeerStatuses] = useState<Map<string, PeerStatus>>(new Map());

  const peerConnections = useRef<PeerConnections>({});
  const localMediaStream = useRef<MediaStream | null>(null);
  const peerMediaElements = useRef<MediaElements>({ [LOCAL_VIDEO]: null });
  const screenStream = useRef<MediaStream | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_STUN_SERVERS);
  const isStoppingScreen = useRef(false);
  const trackIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const lastStatusEmit = useRef(0);

  const addNewClient = useCallback((newClient: string, cb?: () => void, username?: string) => {
    updateClients((list) => {
      if (!list.find((client) => client.email === newClient)) {
        return [...list, { email: newClient, username }];
      }
      return list;
    }, cb);
  }, [updateClients]);

  const emitPeerStatus = useCallback((status: Partial<PeerStatus>) => {
    const now = Date.now();
    if (now - lastStatusEmit.current < 200) return;
    lastStatusEmit.current = now;
    if (!MySocket.socket?.connected) return;
    MySocket.socket.emit(ACTIONS.PEER_STATUS_UPDATE, {
      room: roomID,
      status,
    });
  }, [roomID]);

  const setupPeerConnection = useCallback((peerID: string, username?: string) => {
    const pc = peerConnections.current[peerID];
    if (!pc) return;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        MySocket.socket?.emit(ACTIONS.RELAY_ICE, {
          peerID,
          iceCandidate: event.candidate,
        });
      }
    };

    pc.ontrack = ({ streams: [remoteStream], track }) => {
      addNewClient(peerID, () => {
        const videoEl = peerMediaElements.current[peerID];
        if (videoEl) {
          videoEl.srcObject = remoteStream;
        }
      }, username);

      const interval = setInterval(() => {
        const videoEl = peerMediaElements.current[peerID];
        if (videoEl && !videoEl.srcObject) {
          videoEl.srcObject = remoteStream;
          trackIntervals.current.delete(peerID);
          clearInterval(interval);
        }
      }, 500);
      trackIntervals.current.set(peerID, interval);

      setTimeout(() => {
        if (trackIntervals.current.has(peerID)) {
          clearInterval(trackIntervals.current.get(peerID)!);
          trackIntervals.current.delete(peerID);
        }
      }, 5000);

      track.onmute = () => {
        const videoEl = peerMediaElements.current[peerID];
        if (videoEl) {
          videoEl.style.opacity = '0';
        }
      };

      track.onunmute = () => {
        const videoEl = peerMediaElements.current[peerID];
        if (videoEl) {
          videoEl.style.opacity = '1';
        }
      };
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn(`[WEBRTC] Connection ${peerID} state: ${pc.connectionState}`);
      }
    };

    localMediaStream.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localMediaStream.current!);
    });
  }, [addNewClient]);

  useEffect(() => {
    const handlePeerStatusUpdate = ({
      peerID,
      status,
    }: {
      peerID: string;
      status: Partial<PeerStatus>;
    }) => {
      setPeerStatuses((prev) => {
        const next = new Map(prev);
        const current = next.get(peerID) || { ...DEFAULT_PEER_STATUS };
        next.set(peerID, { ...current, ...status });
        return next;
      });
    };

    MySocket.socket?.on(ACTIONS.PEER_STATUS_UPDATE, handlePeerStatusUpdate);
    return () => {
      MySocket.socket?.off(ACTIONS.PEER_STATUS_UPDATE);
    };
  }, []);

  useEffect(() => {
    async function handleNewPeer({
      peerID,
      email,
      username,
      createOffer = false,
    }: {
      peerID: string;
      email?: string;
      username?: string;
      createOffer?: boolean;
    }) {
      const id = email || peerID;

      if (!(id in peerConnections.current)) {
        peerConnections.current[id] = new RTCPeerConnection({
          iceServers: iceServersRef.current,
        });
        setupPeerConnection(id, username);
      }

      const pc = peerConnections.current[id];
      if (!pc) return;

      if (createOffer && pc.signalingState === 'stable') {
        try {
          const offer = await pc.createOffer();
          if (pc.signalingState === 'stable') {
            await pc.setLocalDescription(offer);
            MySocket.socket?.emit(ACTIONS.RELAY_SDP, {
              peerID: id,
              sessionDescription: offer,
            });
          }
        } catch (e) {
          console.error('[WEBRTC] Error creating offer:', e);
        }
      }
    }

    MySocket.socket?.on(ACTIONS.ADD_PEER, handleNewPeer);
    return () => {
      MySocket.socket?.off(ACTIONS.ADD_PEER);
    };
  }, [setupPeerConnection]);

  useEffect(() => {
    const handleAllPeers = ({
      peers,
    }: {
      peers: Array<{ peerID: string; email?: string; username?: string }>;
    }) => {
      peers.forEach(({ peerID, email, username }) => {
        const id = email || peerID;
        if (!(id in peerConnections.current)) {
          peerConnections.current[id] = new RTCPeerConnection({
            iceServers: iceServersRef.current,
          });
          setupPeerConnection(id, username);
        }
      });
    };

    MySocket.socket?.on(ACTIONS.ALL_PEERS, handleAllPeers);
    return () => {
      MySocket.socket?.off(ACTIONS.ALL_PEERS);
    };
  }, [setupPeerConnection]);

  useEffect(() => {
    async function setRemoteMedia({
      peerID,
      sessionDescription: remoteDescription,
    }: {
      peerID: string;
      sessionDescription: RTCSessionDescriptionInit;
    }) {
      if (!peerConnections.current[peerID]) {
        peerConnections.current[peerID] = new RTCPeerConnection({
          iceServers: iceServersRef.current,
        });
        setupPeerConnection(peerID);
      }

      const pc = peerConnections.current[peerID];
      if (!pc || pc.signalingState === 'closed') return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(remoteDescription));

        if (remoteDescription.type === 'offer' && pc.signalingState === 'have-remote-offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          MySocket.socket?.emit(ACTIONS.RELAY_SDP, {
            peerID,
            sessionDescription: answer,
          });
        }
      } catch (e) {
        console.error('[WEBRTC] Error setting remote description:', e);
      }
    }

    MySocket.socket?.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
    return () => {
      MySocket.socket?.off(ACTIONS.SESSION_DESCRIPTION);
    };
  }, [setupPeerConnection]);

  useEffect(() => {
    const handler = ({ peerID, iceCandidate }: { peerID: string; iceCandidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current[peerID];
      if (pc && pc.signalingState !== 'closed') {
        pc.addIceCandidate(new RTCIceCandidate(iceCandidate)).catch(() => {});
      }
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
      if (trackIntervals.current.has(peerID)) {
        clearInterval(trackIntervals.current.get(peerID)!);
        trackIntervals.current.delete(peerID);
      }
      setPeerStatuses((prev) => {
        const next = new Map(prev);
        next.delete(peerID);
        return next;
      });
      updateClients((list) => list.filter((c) => c.email !== peerID));
    };

    MySocket.socket?.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
    return () => {
      MySocket.socket?.off(ACTIONS.REMOVE_PEER);
    };
  }, [updateClients]);

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
    updateClients([{ email: LOCAL_VIDEO }]);
    setPeerStatuses(new Map());

    async function fetchTurnCredentials(): Promise<TurnCredentials | null> {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TURN_FETCH_TIMEOUT_MS);

        const { data } = await instance.get<TurnCredentials>('/turn/config', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return data;
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          console.warn('[WEBRTC] TURN fetch timeout, using STUN only');
        } else {
          console.warn('[WEBRTC] Failed to fetch TURN credentials, using STUN only:', error);
        }
        return null;
      }
    }

    async function startCapture() {
      const turnCredentials = await fetchTurnCredentials();
      iceServersRef.current = buildIceServers(turnCredentials);

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

      setTimeout(() => {
        if (MySocket.socket?.connected) {
          emitPeerStatus({
            video: videoTrack?.enabled ?? true,
            audio: audioTrack?.enabled ?? true,
            screenShare: false,
          });
        }
      }, 1000);
    }

    startCapture().catch((e) => console.error('[WEBRTC] startCapture error:', e));

    return () => {
      localMediaStream.current?.getTracks().forEach((track) => track.stop());
      localMediaStream.current = null;
      audioTrackRef.current = null;
      cameraVideoTrackRef.current = null;

      trackIntervals.current.forEach(interval => clearInterval(interval));
      trackIntervals.current.clear();

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
  }, [roomID, emitPeerStatus]);

  const provideMediaRef = useCallback((id: string, node: HTMLVideoElement | null) => {
    peerMediaElements.current[id] = node;
  }, []);

  const toggleAudio = () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = !audioTrackRef.current.enabled;
      setIsAudioEnabled(audioTrackRef.current.enabled);
      emitPeerStatus({ audio: audioTrackRef.current.enabled });
    }
  };

  const toggleVideo = () => {
    const currentVideoTrack = cameraVideoTrackRef.current;
    if (currentVideoTrack && !isScreenSharing) {
      currentVideoTrack.enabled = !currentVideoTrack.enabled;
      setIsVideoEnabled(currentVideoTrack.enabled);
      emitPeerStatus({ video: currentVideoTrack.enabled });
    }
  };

  const restoreCamera = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      const newVideoTrack = cameraStream.getVideoTracks()[0];
      if (!newVideoTrack) return false;

      cameraVideoTrackRef.current = newVideoTrack;

      Object.values(peerConnections.current).forEach((peerConnection) => {
        peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'video') {
            sender.replaceTrack(newVideoTrack).catch(() => {});
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

      return true;
    } catch (e) {
      console.error('[WEBRTC] Error restoring video stream:', e);
      return false;
    }
  };

  const startScreenShare = async () => {
    try {
      screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);

      const newVideoTrack = screenStream.current.getVideoTracks()[0];
      if (!newVideoTrack) {
        screenStream.current = null;
        setIsScreenSharing(false);
        toast.error('Не удалось получить видео трек');
        return;
      }

      newVideoTrack.onended = () => {
        if (!isStoppingScreen.current) {
          stopScreenShare();
        }
      };

      Object.values(peerConnections.current).forEach((peerConnection) => {
        peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'video') {
            sender.replaceTrack(newVideoTrack).catch(() => {});
          }
        });
      });

      if (audioTrackRef.current) {
        localMediaStream.current = new MediaStream([
          audioTrackRef.current,
          newVideoTrack,
        ]);
      }

      if (peerMediaElements.current[LOCAL_VIDEO]) {
        peerMediaElements.current[LOCAL_VIDEO]!.srcObject = localMediaStream.current;
      }

      emitPeerStatus({ screenShare: true, video: true });
    } catch (e) {
      setIsScreenSharing(false);
      toast.error('Не удалось начать демонстрацию экрана');
    }
  };

  const stopScreenShare = async () => {
    if (!screenStream.current) return;

    isStoppingScreen.current = true;

    screenStream.current.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    screenStream.current = null;
    setIsScreenSharing(false);

    const restored = await restoreCamera();

    if (!restored && cameraVideoTrackRef.current) {
      cameraVideoTrackRef.current.enabled = true;
    }

    emitPeerStatus({ screenShare: false, video: cameraVideoTrackRef.current?.enabled ?? true });

    isStoppingScreen.current = false;
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
    peerStatuses,
  };
}