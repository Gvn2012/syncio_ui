import React from 'react';
import { Phone, PhoneOff, Mic, MicOff, ShieldCheck } from 'lucide-react';
import { UserAvatar } from '../../../components/UserAvatar';
import { useParticipant } from '../hooks/useParticipant';
import { CallVisualizer } from './CallVisualizer';
import './CallComponents.css';

interface IncomingCallModalProps {
  callerInfo: { id: string; name?: string; avatar?: string } | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ callerInfo, onAccept, onReject }) => {
  const { participant } = useParticipant(callerInfo?.id);
  
  if (!callerInfo) return null;

  const displayName = participant?.name || callerInfo.name || 'Incoming Call';
  const displayAvatar = participant?.avatar || callerInfo.avatar;

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        <div className="caller-avatar-container">
          <UserAvatar size={80} userId={callerInfo.id} src={displayAvatar} />
          <div className="avatar-ping" />
        </div>
        
        <div className="incoming-call-info">
          <h2>{displayName}</h2>
          <p>Incoming Call</p>
        </div>

        <div className="incoming-call-actions">
          <button onClick={onReject} className="btn-reject">
            <PhoneOff size={32} />
          </button>
          <button onClick={onAccept} className="btn-accept">
            <Phone size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ActiveCallBarProps {
  duration: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  remoteStream: MediaStream | null;
  localStream?: MediaStream | null;
}

export const ActiveCallBar: React.FC<ActiveCallBarProps> = ({ duration, isMuted, onToggleMute, onEndCall, remoteStream, localStream }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="active-call-bar">
      {remoteStream && (
        <audio 
          autoPlay 
          ref={(audio) => { if (audio) audio.srcObject = remoteStream; }} 
          style={{ display: 'none' }}
        />
      )}

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
        <CallVisualizer stream={remoteStream} height={32} color="#ffffff" />
      </div>

      <div className="active-call-controls">
        <button 
          onClick={onToggleMute}
          className={`btn-control ${isMuted ? 'active' : ''}`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
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
