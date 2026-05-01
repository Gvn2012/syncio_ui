import { useState, useEffect, useRef, useCallback } from 'react';
import { stompService } from '../../../services/StompService';
import ringtoneAudio from '../../../assets/audio/Ringtone.mp3';
import dialingAudio from '../../../assets/audio/Dialing.mp3';
import { callApi } from '../api/call.service';
import { v4 as uuidv4 } from 'uuid';

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
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [callerInfo, setCallerInfo] = useState<{ id: string; name?: string; avatar?: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const targetUserIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const callIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueues = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const dialingToneRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callStateRef = useRef<CallState>(CallState.IDLE);
  const callModeRef = useRef<'VOICE' | 'VIDEO'>('VOICE');
  const durationRef = useRef(0);
  const callStartTimeRef = useRef<number | null>(null);

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { callModeRef.current = callMode; }, [callMode]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { callStartTimeRef.current = callStartTime; }, [callStartTime]);
  useEffect(() => { callIdRef.current = callId; }, [callId]);

  useEffect(() => {
    const ringtone = new Audio(ringtoneAudio);
    ringtone.loop = true;
    ringtoneRef.current = ringtone;

    const dialing = new Audio(dialingAudio);
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
    const payload = { ...signal };
    if (callStartTimeRef.current && !payload.callStartTime) {
      payload.callStartTime = callStartTimeRef.current;
    }
    if (callIdRef.current && !payload.callId) {
      payload.callId = callIdRef.current;
    }
    stompService.publish('/app/call.signal', payload);
  }, []);

  const cleanupCall = useCallback(() => {
    pcsRef.current.forEach(pc => pc.close());
    pcsRef.current.clear();

    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setCallState(CallState.IDLE);
    setCallerInfo(null);
    targetUserIdRef.current = null;
    conversationIdRef.current = null;
    setDuration(0);
    setCallStartTime(null);
    setCallId(null);
    setIsMuted(false);
    setIsVideoEnabled(false);
    setCallMode('VOICE');
    iceCandidatesQueues.current.clear();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    if (pcsRef.current.has(peerId)) {
      console.warn(`Closing existing PC for ${peerId} before creating new one`);
      pcsRef.current.get(peerId)!.close();
      pcsRef.current.delete(peerId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ICE_CANDIDATE',
          recipientId: peerId,
          payload: event.candidate,
          conversationId: conversationIdRef.current
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(peerId, remoteStream);
          return next;
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`WebRTC Connection State for ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pcsRef.current.get(peerId)?.close();
        pcsRef.current.delete(peerId);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
        if (pcsRef.current.size === 0 && callStateRef.current === CallState.CONNECTED) {
          if (!conversationIdRef.current) {
            // Only end the call entirely if it's a direct call
            sendSignal({
              type: 'CALL_ENDED',
              recipientId: null,
              callMode: callModeRef.current,
              conversationId: conversationIdRef.current,
              payload: { duration: durationRef.current }
            });
            cleanupCall();
          }
        }
      } else if (pc.connectionState === 'connected') {
        if (!callStartTimeRef.current) {
          setCallStartTime(Date.now());
        }
        setCallState(CallState.CONNECTED);
        window.dispatchEvent(new CustomEvent('audioPlay', { detail: { id: 'voice-call' } }));
      }
    };

    pcsRef.current.set(peerId, pc);
    return pc;
  }, [sendSignal, cleanupCall]);

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
    if (callStateRef.current !== CallState.IDLE) {
      pcsRef.current.forEach((_, peerId) => {
        sendSignal({
          type: 'CALL_ENDED',
          recipientId: peerId,
          callMode: callModeRef.current,
          conversationId: conversationIdRef.current,
          payload: { duration: durationRef.current }
        });
      });
      
      if (conversationIdRef.current && pcsRef.current.size === 0) {
        sendSignal({
          type: 'CALL_ENDED',
          recipientId: null,
          callMode: callModeRef.current,
          conversationId: conversationIdRef.current,
          payload: { duration: durationRef.current }
        });
      }
    }
    cleanupCall();
  }, [sendSignal, cleanupCall]);

  const initiateCall = async (recipientId: string | null, mode: 'VOICE' | 'VIDEO' = 'VOICE', conversationId?: string) => {
    if (callStateRef.current !== CallState.IDLE) return;

    targetUserIdRef.current = recipientId;
    conversationIdRef.current = conversationId || null;
    setCallerInfo(recipientId ? { id: recipientId } : null);
    setCallMode(mode);
    setCallState(CallState.OUTBOUND_RINGING);
    
    const stream = await initLocalStream(mode);
    if (!stream) return cleanupCall();

    const newCallId = uuidv4();
    setCallId(newCallId);
    callIdRef.current = newCallId;

    if (!recipientId && conversationId) {
      sendSignal({
        type: 'CALL_OFFER',
        recipientId: null,
        callMode: mode,
        conversationId,
        callId: newCallId
      });
    } else if (recipientId) {
      const pc = createPeerConnection(recipientId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: 'CALL_OFFER',
        recipientId,
        callMode: mode,
        conversationId,
        callId: newCallId,
        payload: offer
      });
    }

    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = setTimeout(() => {
      console.log('Call timed out after 30s');
      endCall();
    }, 30000);

    return newCallId;
  };

  const reconnectToCall = async (existingCallId: string, mode: 'VOICE' | 'VIDEO', conversationId: string) => {
    try {
      const session = await callApi.getCallSession(existingCallId);
      if (!session || session.status !== 'ACTIVE') {
        throw new Error('Call session inactive');
      }

      setCallId(existingCallId);
      callIdRef.current = existingCallId;
      conversationIdRef.current = conversationId;
      setCallMode(mode);
      setCallStartTime(session.startedAt);

      const stream = await initLocalStream(mode);
      if (!stream) return cleanupCall();

      setCallState(CallState.CONNECTED);
      sendSignal({
        type: 'JOIN_CALL',
        recipientId: null,
        conversationId,
        callId: existingCallId
      });
      return true;
    } catch (err) {
      console.warn('Failed to reconnect to call', err);
      cleanupCall();
      return false;
    }
  };

  const answerCall = async () => {
    console.log('Answering call...', { target: targetUserIdRef.current, convId: conversationIdRef.current });
    
    const stream = await initLocalStream(callModeRef.current);
    if (!stream) {
      console.error('Failed to init local stream for answer');
      return cleanupCall();
    }

    if (conversationIdRef.current) {
      console.log('Group call identified, sending JOIN_CALL broadcast');
      setCallState(CallState.CONNECTED);
      
      sendSignal({
        type: 'JOIN_CALL',
        recipientId: null,
        conversationId: conversationIdRef.current
      });
      return;
    }

    const peerId = targetUserIdRef.current;
    if (!peerId) {
      console.warn('Cannot answer call: missing target');
      return cleanupCall();
    }

    let pc = pcsRef.current.get(peerId);
    if (!pc) pc = createPeerConnection(peerId);

    const existingTracks = pc.getSenders().map(s => s.track);
    stream.getTracks().forEach(track => {
      if (!existingTracks.includes(track)) {
        pc!.addTrack(track, stream);
      }
    });

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: 'CALL_ANSWER',
        recipientId: peerId,
        payload: answer,
        conversationId: conversationIdRef.current
      });
      setCallState(CallState.CONNECTED);
    } catch (err) {
      console.error('Error creating answer:', err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (targetUserIdRef.current) {
      sendSignal({
        type: 'CALL_REJECTED',
        recipientId: targetUserIdRef.current,
        callMode: callModeRef.current,
        conversationId: conversationIdRef.current,
      });
    }
    cleanupCall();
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
    if (pcsRef.current.size === 0 || !localStreamRef.current) return;

    if (isVideoEnabled) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            pc.removeTrack(sender);
          }
        });
      }
      setIsVideoEnabled(false);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      
      pcsRef.current.forEach(async (pc, peerId) => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({
          type: 'CALL_OFFER',
          recipientId: peerId,
          callMode: 'VOICE',
          conversationId: conversationIdRef.current,
          payload: offer
        });
      });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        
        pcsRef.current.forEach(pc => {
          pc.addTrack(videoTrack, localStreamRef.current!);
        });
        setIsVideoEnabled(true);
        setCallMode('VIDEO');

        pcsRef.current.forEach(async (pc, peerId) => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({
            type: 'CALL_OFFER',
            recipientId: peerId,
            callMode: 'VIDEO',
            conversationId: conversationIdRef.current,
            payload: offer
          });
        });
      } catch (err) {
        console.error('Failed to access camera:', err);
      }
    }
  };

  useEffect(() => {
    const handleSignal = async (e: CustomEvent) => {
      const signal = e.detail;
      const senderId = signal.senderId;
      const currentState = callStateRef.current;

      if (signal.callStartTime) {
        if (!callStartTimeRef.current || signal.callStartTime < callStartTimeRef.current) {
          setCallStartTime(signal.callStartTime);
        }
      }

      switch (signal.type) {
        case 'CALL_OFFER': {
          if (currentState === CallState.CONNECTED || currentState === CallState.OUTBOUND_RINGING) {
            if (pcsRef.current.has(senderId)) {
              const pc = pcsRef.current.get(senderId)!;
              if (pc.signalingState !== 'stable') {
                console.log('Rolling back local offer to handle remote offer');
                await pc.setLocalDescription({ type: 'rollback' });
              }
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({
                  type: 'CALL_ANSWER',
                  recipientId: senderId,
                  payload: answer,
                  conversationId: conversationIdRef.current
                });
              } catch (err) {
                console.error('Renegotiation failed', err);
              }
            } else if (conversationIdRef.current && signal.conversationId === conversationIdRef.current) {
              // New peer joining the same group call with an offer
              if (signal.payload) {
                const pc = createPeerConnection(senderId);
                if (localStreamRef.current) {
                  localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
                }
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({
                  type: 'CALL_ANSWER',
                  recipientId: senderId,
                  payload: answer,
                  conversationId: signal.conversationId
                });
              }
            }
            return;
          }
          
          if (currentState !== CallState.IDLE && currentState !== CallState.INBOUND_RINGING) return;
          
          targetUserIdRef.current = senderId;
          conversationIdRef.current = signal.conversationId || null;
          if (signal.callId) {
            setCallId(signal.callId);
            callIdRef.current = signal.callId;
          }
          const mode = signal.callMode || 'VOICE';
          setCallMode(mode);
          setCallerInfo({ id: senderId });

          if (currentState === CallState.IDLE) {
            setCallState(CallState.INBOUND_RINGING);
          }

          if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = setTimeout(() => {
            console.log('Inbound call timed out after 30s');
            cleanupCall();
          }, 30000);

          if (signal.payload && signal.payload.type && signal.payload.sdp) {
            const pc = createPeerConnection(senderId);
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
              const queue = iceCandidatesQueues.current.get(senderId) || [];
              while (queue.length > 0) {
                const candidate = queue.shift();
                if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              iceCandidatesQueues.current.delete(senderId);
            } catch (err) {
              console.error('Error setting remote description:', err);
              cleanupCall();
            }
          }
          break;
        }

        case 'JOIN_CALL': {
          if (currentState === CallState.OUTBOUND_RINGING || currentState === CallState.CONNECTED) {
            if (signal.conversationId === conversationIdRef.current) {
              const myId = stompService.currentUserId;
              console.log('User joined group call:', senderId);

              const isInitiator = currentState === CallState.OUTBOUND_RINGING;
              const shouldSendOffer = isInitiator || !pcsRef.current.has(senderId) || (myId && myId < senderId);

              if (myId && shouldSendOffer) {
                console.log('Sending offer to joiner', senderId);
                const pc = pcsRef.current.get(senderId) || createPeerConnection(senderId);

                if (localStreamRef.current) {
                  localStreamRef.current.getTracks().forEach(track => {
                    const senders = pc.getSenders();
                    if (!senders.some(s => s.track === track)) {
                      pc.addTrack(track, localStreamRef.current!);
                    }
                  });
                }

                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  sendSignal({
                    type: 'CALL_OFFER',
                    recipientId: senderId,
                    callMode: callModeRef.current,
                    conversationId: conversationIdRef.current,
                    payload: offer
                  });
                  if (isInitiator) setCallState(CallState.CONNECTED);
                } catch (err) {
                  console.error('Failed to create/send offer to joiner:', err);
                }
              } else {
                console.log('Waiting for offer from joiner', senderId);
              }
            }
          }
          break;
        }

        case 'CALL_ANSWER': {
          const pcA = pcsRef.current.get(senderId);
          if (pcA) {
            if (pcA.signalingState === 'stable') {
              console.log('Ignoring answer: already stable');
              return;
            }
            try {
              if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
              }
              await pcA.setRemoteDescription(new RTCSessionDescription(signal.payload));
              const queue = iceCandidatesQueues.current.get(senderId) || [];
              while (queue.length > 0) {
                const candidate = queue.shift();
                if (candidate) await pcA.addIceCandidate(new RTCIceCandidate(candidate));
              }
              iceCandidatesQueues.current.delete(senderId);
              if (callStateRef.current === CallState.OUTBOUND_RINGING) {
                setCallState(CallState.CONNECTED);
              }
            } catch (err) {
              console.error('Error setting remote description from answer:', err);
            }
          } else if (callStateRef.current === CallState.OUTBOUND_RINGING && conversationIdRef.current) {
            const pcNew = createPeerConnection(senderId);
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => pcNew.addTrack(track, localStreamRef.current!));
            }
          }
          break;
        }

        case 'ICE_CANDIDATE': {
          const pcI = pcsRef.current.get(senderId);
          if (pcI && pcI.remoteDescription) {
            try {
              await pcI.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (err) {
              console.error('Error adding ICE candidate', err);
            }
          } else {
            if (!iceCandidatesQueues.current.has(senderId)) {
              iceCandidatesQueues.current.set(senderId, []);
            }
            iceCandidatesQueues.current.get(senderId)!.push(signal.payload);
          }
          break;
        }

        case 'CALL_REJECTED':
        case 'CALL_ENDED': {
          if (pcsRef.current.has(senderId)) {
            pcsRef.current.get(senderId)?.close();
            pcsRef.current.delete(senderId);
            setRemoteStreams(prev => {
              const next = new Map(prev);
              next.delete(senderId);
              return next;
            });
          }
          
          // For CALL_REJECTED in a direct call, always cleanup
          // For CALL_ENDED, only cleanup when no peers remain (you're the last person)
          if (signal.type === 'CALL_REJECTED' && !conversationIdRef.current) {
            // Direct call rejection — end immediately
            cleanupCall();
          } else if (pcsRef.current.size === 0) {
            // No peers left — you're alone, end the call
            cleanupCall();
          }
          // Otherwise, peers remain — call continues for remaining participants
          break;
        }
      }
    };

    window.addEventListener('webrtc-signal', handleSignal as any);
    return () => window.removeEventListener('webrtc-signal', handleSignal as any);
    // Stable deps only — callState is read via callStateRef to avoid teardown/re-register
  }, [createPeerConnection, cleanupCall, sendSignal]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callStateRef.current !== CallState.IDLE) {
        endCall();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [endCall]);

  // Timer that computes duration from the shared callStartTime
  useEffect(() => {
    let interval: any;
    if (callState === CallState.CONNECTED && callStartTime) {
      // Immediately set the correct elapsed time (for late joiners)
      setDuration(Math.floor((Date.now() - callStartTime) / 1000));
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState, callStartTime]);

  return {
    callState,
    callMode,
    isVideoEnabled,
    localStream,
    remoteStream: remoteStreams.values().next().value || null,
    remoteStreams,
    callerInfo,
    conversationId: conversationIdRef.current,
    isGroupCall: !targetUserIdRef.current && !!conversationIdRef.current,
    duration,
    callId,
    isMuted,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    reconnectToCall,
  };
};
