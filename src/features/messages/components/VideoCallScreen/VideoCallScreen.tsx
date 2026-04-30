import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck } from 'lucide-react';
import { UserAvatar } from '../../../../components/UserAvatar';
import { useParticipant } from '../../hooks/useParticipant';
import './VideoCallScreen.css';

interface VideoCallScreenProps {
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  callerInfo: { id: string; name?: string; avatar?: string } | null;
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export const VideoCallScreen: React.FC<VideoCallScreenProps> = ({
  remoteStream,
  localStream,
  callerInfo,
  duration,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { participant } = useParticipant(callerInfo?.id);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayName = participant?.name || callerInfo?.name || 'Unknown';
  
  const remoteHasVideo = remoteStream?.getVideoTracks().some(track => track.enabled) ?? false;

  return (
    <div className="video-call-screen">
      <div className="remote-video-container">
        {remoteHasVideo ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="remote-video"
          />
        ) : (
          <div className="remote-video-fallback">
            <UserAvatar size={120} userId={callerInfo?.id || ''} src={participant?.avatar} />
            <div className="remote-user-info">
              <h2>{displayName}</h2>
              <p>Voice Call • {duration > 0 ? formatTime(duration) : 'Connecting...'}</p>
            </div>
            <audio 
              autoPlay 
              ref={(audio) => { if (audio) audio.srcObject = remoteStream; }} 
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      <div className="video-call-top-bar">
        <div className="secure-badge">
          <ShieldCheck size={16} /> End-to-end Encrypted
        </div>
        {remoteHasVideo && (
          <div className="video-timer">
            {formatTime(duration)}
          </div>
        )}
      </div>

      {isVideoEnabled && (
        <div className="local-video-pip">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="local-video"
          />
        </div>
      )}

      <div className="video-call-controls">
        <button 
          onClick={onToggleMute}
          className={`btn-control ${isMuted ? 'active' : ''}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button 
          onClick={onToggleVideo}
          className={`btn-control ${!isVideoEnabled ? 'active' : ''}`}
        >
          {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        <button 
          onClick={onEndCall}
          className="btn-end"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
