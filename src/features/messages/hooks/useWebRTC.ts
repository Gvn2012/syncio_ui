import { useState, useEffect, useRef, useCallback } from 'react';
import { useMessaging } from './useMessaging';

export enum CallState {
  IDLE = 'IDLE',
  OUTBOUND_RINGING = 'OUTBOUND_RINGING',
  INBOUND_RINGING = 'INBOUND_RINGING',
  CONNECTED = 'CONNECTED',
}

export const useWebRTC = () => {
  const { sendSignal } = useMessaging();
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callerInfo, setCallerInfo] = useState<{ id: string; name?: string; avatar?: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

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
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      } else if (pc.connectionState === 'connected') {
        setCallState(CallState.CONNECTED);
        // Stop all other audio players in the chat
        window.dispatchEvent(new CustomEvent('audioPlay', { detail: { id: 'voice-call' } }));
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal]);

  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      alert('Could not access microphone.');
      return null;
    }
  };

  const endCall = useCallback(() => {
    if (targetUserIdRef.current && callState !== CallState.IDLE) {
      sendSignal({
        type: 'CALL_ENDED',
        recipientId: targetUserIdRef.current,
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
    setDuration(0);
    setIsMuted(false);
  }, [callState, sendSignal]);

  const initiateCall = async (recipientId: string) => {
    targetUserIdRef.current = recipientId;
    setCallState(CallState.OUTBOUND_RINGING);
    
    const stream = await initLocalStream();
    if (!stream) return endCall();

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignal({
      type: 'CALL_OFFER',
      recipientId,
      payload: offer
    });
  };

  const answerCall = async () => {
    if (!targetUserIdRef.current || !pcRef.current) return;
    
    const stream = await initLocalStream();
    if (!stream) return endCall();

    const pc = pcRef.current;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sendSignal({
      type: 'CALL_ANSWER',
      recipientId: targetUserIdRef.current,
      payload: answer
    });
  };

  const rejectCall = () => {
    if (targetUserIdRef.current) {
      sendSignal({
        type: 'CALL_REJECTED',
        recipientId: targetUserIdRef.current,
      });
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

  useEffect(() => {
    const handleSignal = async (e: CustomEvent) => {
      const signal = e.detail;
      const senderId = signal.senderId;

      switch (signal.type) {
        case 'CALL_OFFER':
          if (callState !== CallState.IDLE) {
            sendSignal({ type: 'CALL_REJECTED', recipientId: senderId });
            return;
          }
          targetUserIdRef.current = senderId;
          setCallerInfo({ id: senderId });
          setCallState(CallState.INBOUND_RINGING);
          
          const pc = createPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          break;

        case 'CALL_ANSWER':
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
          }
          break;

        case 'ICE_CANDIDATE':
          if (pcRef.current && pcRef.current.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (err) {
              console.error('Error adding ICE candidate', err);
            }
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

  // Duration timer
  useEffect(() => {
    let interval: any;
    if (callState === CallState.CONNECTED) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  return {
    callState,
    localStream,
    remoteStream,
    callerInfo,
    duration,
    isMuted,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute
  };
};
