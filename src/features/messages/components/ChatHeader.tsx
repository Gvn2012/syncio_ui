import React, { useRef, useState, useEffect } from 'react';
import { MoreVertical, Phone, Video, User, BellOff, Trash, Menu, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Conversation } from '../types';
import { useParticipant } from '../hooks/useParticipant';
import { UserAvatar } from '../../../components/UserAvatar';

interface ChatHeaderProps {
  activeChat: Conversation;
  currentUserId: string | null;
  isOnline: boolean;
  isTyping: boolean;
  onDeleteConversation: () => void;
  onToggleSidebar: () => void;
  onCallClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeChat, 
  currentUserId, 
  isOnline, 
  isTyping, 
  onDeleteConversation,
  onToggleSidebar,
  onCallClick
}) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const otherParticipantId = activeChat.participants.find(id => id !== currentUserId);
  const { participant } = useParticipant(otherParticipantId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = activeChat.name || participant?.name || 'Sync User';

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <button 
          className="mobile-only back-button" 
          onClick={() => navigate('/messages')}
        >
          <ArrowLeft size={20} />
        </button>
        <button className="icon-btn sidebar-toggle desktop-only" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <UserAvatar size={40} userId={otherParticipantId} src={participant?.avatar} showLink={false} />
        <div className="chat-header-content">
          <div className="chat-header-name">{displayName}</div>
          <div className={`chat-header-status ${isOnline ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            {isTyping ? <span className="typing-text">typing...</span> : (isOnline ? 'Online' : 'Offline')}
          </div>
        </div>
      </div>
      <div className="chat-header-actions">
        <button className="icon-btn" onClick={onCallClick}><Phone size={18} /></button>
        <button className="icon-btn"><Video size={18} /></button>
        <div className="options-menu-container" ref={optionsRef}>
          <button className="icon-btn" onClick={() => setShowOptions(!showOptions)}>
            <MoreVertical size={18} />
          </button>
          {showOptions && (
            <div className="options-menu dropdown-menu">
              <button className="dropdown-item" onClick={() => { setShowOptions(false); if (otherParticipantId) navigate(`/profile/${otherParticipantId}`); }}>
                <User size={16} className="dropdown-icon" /> View Profile
              </button>
              <button className="dropdown-item" onClick={() => setShowOptions(false)}>
                <BellOff size={16} className="dropdown-icon" /> Mute
              </button>
              <button className="dropdown-item delete" onClick={() => { setShowOptions(false); onDeleteConversation(); }}>
                <Trash size={16} className="dropdown-icon" /> Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
