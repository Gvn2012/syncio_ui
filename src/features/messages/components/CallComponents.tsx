import React from 'react';
import { Phone, PhoneOff, Mic, MicOff, ShieldCheck, Video, VideoOff, Users } from 'lucide-react';
import { UserAvatar } from '../../../components/UserAvatar';
import { useParticipant } from '../hooks/useParticipant';
import { CallVisualizer } from './CallVisualizer';
import './CallComponents.css';

interface IncomingCallModalProps {
  callerInfo: { id: string; name?: string; avatar?: string } | null;
  callMode: 'VOICE' | 'VIDEO';
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ callerInfo, callMode, onAccept, onReject }) => {
  const { participant } = useParticipant(callerInfo?.id);
  
  if (!callerInfo) return null;

  const displayName = participant?.name || callerInfo.name || 'Incoming Call';
  const displayAvatar = participant?.avatar || callerInfo.avatar;

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card pill-mode">
        <div className="caller-avatar-container">
          <UserAvatar size={48} userId={callerInfo.id} src={displayAvatar} />
          <div className="avatar-ping" />
        </div>
        
        <div className="incoming-call-info">
          <h2>{displayName}</h2>
          <p>Incoming {callMode === 'VIDEO' ? 'Video' : 'Voice'}</p>
        </div>

        <div className="incoming-call-actions">
          <button onClick={onReject} className="btn-reject" title="Decline">
            <PhoneOff size={20} />
          </button>
          <button onClick={onAccept} className="btn-accept" title="Accept">
            {callMode === 'VIDEO' ? <Video size={20} /> : <Phone size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

interface OutgoingCallModalProps {
  recipientId: string | null;
  callMode: 'VOICE' | 'VIDEO';
  onCancel: () => void;
}

export const OutgoingCallModal: React.FC<OutgoingCallModalProps> = ({ recipientId, callMode, onCancel }) => {
  const { participant } = useParticipant(recipientId || '');
  
  const displayName = recipientId ? (participant?.name || 'Calling...') : 'Group Call';

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card outgoing pill-mode">
        <div className="caller-avatar-container">
          {recipientId ? (
            <UserAvatar size={48} userId={recipientId} />
          ) : (
            <div className="group-avatar-placeholder" style={{ 
              width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
            }}>
              <Users size={24} />
            </div>
          )}
          <div className="avatar-ping outbound" />
        </div>
        
        <div className="incoming-call-info">
          <h2>{displayName}</h2>
          <p>{callMode === 'VIDEO' ? 'Video' : 'Voice'} Calling...</p>
        </div>

        <div className="incoming-call-actions">
          <button onClick={onCancel} className="btn-reject" title="End Call">
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ActiveCallBarProps {
  duration: number;
  isMuted: boolean;
  isVideoEnabled?: boolean;
  onToggleMute: () => void;
  onToggleVideo?: () => void;
  onEndCall: () => void;
  remoteStreams: Map<string, MediaStream>;
  localStream?: MediaStream | null;
}

interface RemoteAudioProps {
  stream: MediaStream;
}

export const RemoteAudio: React.FC<RemoteAudioProps> = ({ stream }) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(err => {
        console.warn('Audio auto-play failed, might need user interaction', err);
      });
    }
  }, [stream]);

  return (
    <audio 
      ref={audioRef} 
      autoPlay 
      playsInline
      style={{ display: 'none' }}
    />
  );
};

export const ActiveCallBar: React.FC<ActiveCallBarProps> = ({ 
  duration, 
  isMuted, 
  isVideoEnabled = false,
  onToggleMute, 
  onToggleVideo,
  onEndCall, 
  remoteStreams, 
  localStream 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="active-call-bar">
      {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
        <RemoteAudio key={userId} stream={stream} />
      ))}

      <div className="call-timer">
        <div className="timer-dot" />
        <span className="timer-text">
          {duration > 0 ? formatTime(duration) : 'Connecting...'}
        </span>
        <div className="secure-badge">
          <ShieldCheck size={12} /> Secure
        </div>
      </div>

      <div className="visualizer-container">
        <CallVisualizer stream={localStream || null} height={32} color="rgba(255,255,255,0.4)" />
        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
          <CallVisualizer key={userId} stream={stream} height={32} color="#ffffff" />
        ))}
      </div>

      <div className="active-call-controls">
        <button 
          onClick={onToggleMute}
          className={`btn-control ${isMuted ? 'active' : ''}`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        {onToggleVideo && (
          <button 
            onClick={onToggleVideo}
            className={`btn-control ${!isVideoEnabled ? 'active' : ''}`}
            title="Turn on video"
          >
            {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        )}
        <button 
          onClick={onEndCall}
          className="btn-end"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
};
