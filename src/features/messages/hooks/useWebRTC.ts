import { useState, useEffect, useRef, useCallback } from 'react';
import { stompService } from '../../../services/StompService';

export enum CallState {
  IDLE = 'IDLE',
  OUTBOUND_RINGING = 'OUTBOUND_RINGING',
  INBOUND_RINGING = 'INBOUND_RINGING',
  CONNECTED = 'CONNECTED',
}

export const useWebRTC = () => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [callMode, setCallMode] = useState<'VOICE' | 'VIDEO'>('VOICE');
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callerInfo, setCallerInfo] = useState<{ id: string; name?: string; avatar?: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const dialingToneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const ringtone = new Audio('https://assets.mixkit.co/active_storage/sfx/1351/1351-preview.mp3');
    ringtone.loop = true;
    ringtoneRef.current = ringtone;

    const dialing = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    dialing.loop = true;
    dialingToneRef.current = dialing;
    
    return () => {
      ringtone.pause();
      dialing.pause();
      ringtoneRef.current = null;
      dialingToneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (callState === CallState.INBOUND_RINGING) {
      ringtoneRef.current?.play().catch(e => console.warn('Ringtone play failed:', e));
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    }

    if (callState === CallState.OUTBOUND_RINGING) {
      dialingToneRef.current?.play().catch(e => console.warn('Dialing tone play failed:', e));
    } else {
      if (dialingToneRef.current) {
        dialingToneRef.current.pause();
        dialingToneRef.current.currentTime = 0;
      }
    }
  }, [callState]);

  const sendSignal = useCallback((signal: any) => {
    stompService.publish('/app/call.signal', signal);
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserIdRef.current) {
        sendSignal({
          type: 'ICE_CANDIDATE',
          recipientId: targetUserIdRef.current,
          payload: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(new MediaStream(event.streams[0].getTracks()));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('WebRTC Connection State:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      } else if (pc.connectionState === 'connected') {
        setCallState(CallState.CONNECTED);
        window.dispatchEvent(new CustomEvent('audioPlay', { detail: { id: 'voice-call' } }));
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal]);

  const initLocalStream = async (mode: 'VOICE' | 'VIDEO') => {
    try {
      const constraints = { audio: true, video: mode === 'VIDEO' };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (mode === 'VIDEO') {
        setIsVideoEnabled(true);
      }
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      alert('Could not access microphone/camera.');
      return null;
    }
  };

  const endCall = useCallback(() => {
    if (targetUserIdRef.current && callState !== CallState.IDLE) {
      sendSignal({
        type: 'CALL_ENDED',
        recipientId: targetUserIdRef.current,
        callMode,
        conversationId: conversationIdRef.current,
        payload: { duration }
      });
    }

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallState(CallState.IDLE);
    setCallerInfo(null);
    targetUserIdRef.current = null;
    conversationIdRef.current = null;
    setDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(false);
    setCallMode('VOICE');
    iceCandidatesQueue.current = [];
  }, [callState, sendSignal, callMode, duration]);

  const initiateCall = async (recipientId: string, mode: 'VOICE' | 'VIDEO' = 'VOICE', conversationId?: string) => {
    targetUserIdRef.current = recipientId;
    conversationIdRef.current = conversationId || null;
    setCallMode(mode);
    setCallState(CallState.OUTBOUND_RINGING);
    
    const stream = await initLocalStream(mode);
    if (!stream) return endCall();

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignal({
      type: 'CALL_OFFER',
      recipientId,
      callMode: mode,
      conversationId,
      payload: offer
    });
  };

  const answerCall = async () => {
    if (!targetUserIdRef.current || !pcRef.current) {
      console.warn('Cannot answer call: missing target or peer connection');
      return;
    }
    
    const stream = await initLocalStream(callMode);
    if (!stream) return endCall();

    const pc = pcRef.current;
    const existingTracks = pc.getSenders().map(s => s.track);
    stream.getTracks().forEach(track => {
      if (!existingTracks.includes(track)) {
        pc.addTrack(track, stream);
      }
    });

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: 'CALL_ANSWER',
        recipientId: targetUserIdRef.current,
        payload: answer
      });
    } catch (err) {
      console.error('Error creating answer:', err);
      endCall();
    }
  };

  const rejectCall = () => {
    if (targetUserIdRef.current) {
      sendSignal({
        type: 'CALL_REJECTED',
        recipientId: targetUserIdRef.current,
        callMode,
        conversationId: conversationIdRef.current,
      });
      targetUserIdRef.current = null;
    }
    endCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    if (!pcRef.current || !localStreamRef.current) return;

    if (isVideoEnabled) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          pcRef.current.removeTrack(sender);
        }
      }
      setIsVideoEnabled(false);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      
      if (targetUserIdRef.current) {
        sendSignal({
          type: 'CALL_OFFER',
          recipientId: targetUserIdRef.current,
          callMode: 'VOICE',
          conversationId: conversationIdRef.current,
          payload: offer
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        
        pcRef.current.addTrack(videoTrack, localStreamRef.current);
        setIsVideoEnabled(true);
        setCallMode('VIDEO');

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        
        if (targetUserIdRef.current) {
          sendSignal({
            type: 'CALL_OFFER',
            recipientId: targetUserIdRef.current,
            callMode: 'VIDEO',
            conversationId: conversationIdRef.current,
            payload: offer
          });
        }
      } catch (err) {
        console.error('Failed to access camera:', err);
      }
    }
  };

  useEffect(() => {
    const handleSignal = async (e: CustomEvent) => {
      const signal = e.detail;
      const senderId = signal.senderId;

      switch (signal.type) {
        case 'CALL_OFFER':
          if (callState !== CallState.IDLE) {
            if (senderId === targetUserIdRef.current && callState === CallState.CONNECTED) {
              setCallMode(signal.callMode || 'VOICE');
              try {
                if (pcRef.current) {
                  await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
                  const answer = await pcRef.current.createAnswer();
                  await pcRef.current.setLocalDescription(answer);
                  sendSignal({
                    type: 'CALL_ANSWER',
                    recipientId: senderId,
                    payload: answer
                  });
                }
              } catch (err) {
                console.error('Renegotiation failed', err);
              }
            } else {
              sendSignal({ type: 'CALL_REJECTED', recipientId: senderId });
            }
            return;
          }
          
          targetUserIdRef.current = senderId;
          conversationIdRef.current = signal.conversationId || null;
          setCallMode(signal.callMode || 'VOICE');
          setCallerInfo({ id: senderId });
          setCallState(CallState.INBOUND_RINGING);
          
          const pc = createPeerConnection();
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (err) {
            console.error('Error setting remote description:', err);
            endCall();
          }
          break;

        case 'CALL_ANSWER':
          if (pcRef.current) {
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
              while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                if (candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } catch (err) {
              console.error('Error setting remote description from answer:', err);
              endCall();
            }
          }
          break;

        case 'ICE_CANDIDATE':
          if (pcRef.current && pcRef.current.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (err) {
              console.error('Error adding ICE candidate', err);
            }
          } else {
            iceCandidatesQueue.current.push(signal.payload);
          }
          break;

        case 'CALL_REJECTED':
        case 'CALL_ENDED':
          if (targetUserIdRef.current === senderId) {
            endCall();
          }
          break;
      }
    };

    window.addEventListener('webrtc-signal', handleSignal as any);
    return () => window.removeEventListener('webrtc-signal', handleSignal as any);
  }, [callState, createPeerConnection, endCall, sendSignal]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState !== CallState.IDLE) {
        endCall();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [callState, endCall]);

  useEffect(() => {
    let interval: any;
    if (callState === CallState.CONNECTED) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  return {
    callState,
    callMode,
    isVideoEnabled,
    localStream,
    remoteStream,
    callerInfo,
    duration,
    isMuted,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  };
};
