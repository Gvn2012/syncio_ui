import React, { useRef, useState, useEffect } from 'react';
import { MoreVertical, Phone, Video, User, BellOff, Trash, Menu, ArrowLeft, LogOut, Edit3, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Conversation } from '../types';
import { useParticipant } from '../hooks/useParticipant';
import { UserAvatar } from '../../../components/UserAvatar';
import { TypingIndicator } from './TypingIndicator';

interface ChatHeaderProps {
  activeChat: Conversation;
  currentUserId: string | null;
  isOnline: boolean;
  isTyping: boolean;
  typingUserIds?: string[];
  onDeleteConversation: () => void;
  onToggleSidebar: () => void;
  onCallClick?: () => void;
  onVideoCallClick?: () => void;
  onInfoClick?: () => void;
  onLeaveGroup?: () => void;
  onChangeGroupName?: () => void;
  onAddMember?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeChat, 
  currentUserId, 
  isOnline, 
  isTyping, 
  typingUserIds = [],
  onDeleteConversation,
  onToggleSidebar,
  onCallClick,
  onVideoCallClick,
  onLeaveGroup,
  onChangeGroupName,
  onAddMember
}) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isGroup = activeChat.type === 'GROUP';
  const otherParticipantId = isGroup ? undefined : activeChat.participants.find(id => id !== currentUserId);
  const { participant } = useParticipant(otherParticipantId);
  const isAdmin = activeChat.adminIds?.includes(currentUserId || '');

  const displayName = activeChat.name || participant?.name || 'Sync User';
  const avatarSrc = isGroup ? activeChat.groupAvatar : participant?.avatar;



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
        <UserAvatar 
          size={40} 
          userId={otherParticipantId} 
          src={avatarSrc} 
          showLink={false} 
        />
        <div className="chat-header-content">
          <div className="chat-header-name">{displayName}</div>
          <div className={`chat-header-status ${!isTyping && !isGroup ? (isOnline ? 'online' : 'offline') : ''}`}>
            {isTyping ? (
              <TypingIndicator 
                names={isGroup ? typingUserIds.map(id => activeChat.participantPreviews?.find(p => p.userId === id)?.displayName || 'Someone') : []} 
              />
            ) : isGroup ? (
              <span className="group-members-count">{activeChat.participants.length} members</span>
            ) : (
              <>
                <span className="status-dot"></span>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="chat-header-actions">
        <button className="icon-btn" onClick={onCallClick}><Phone size={18} /></button>
        <button className="icon-btn" onClick={onVideoCallClick}><Video size={18} /></button>
        <div className="options-menu-container" ref={optionsRef}>
          <button className="icon-btn" onClick={() => setShowOptions(!showOptions)}>
            <MoreVertical size={18} />
          </button>
          {showOptions && (
            <div className="options-menu dropdown-menu">
              {!isGroup && (
                <button className="dropdown-item" onClick={() => { setShowOptions(false); if (otherParticipantId) navigate(`/profile/${otherParticipantId}`); }}>
                  <User size={16} className="dropdown-icon" /> View Profile
                </button>
              )}
              {isGroup && isAdmin && (
                <>
                  <button className="dropdown-item" onClick={() => { setShowOptions(false); onChangeGroupName?.(); }}>
                    <Edit3 size={16} className="dropdown-icon" /> Change Name
                  </button>
                  <button className="dropdown-item" onClick={() => { setShowOptions(false); onAddMember?.(); }}>
                    <UserPlus size={16} className="dropdown-icon" /> Add Member
                  </button>
                </>
              )}
              <button className="dropdown-item" onClick={() => setShowOptions(false)}>
                <BellOff size={16} className="dropdown-icon" /> Mute
              </button>
              {isGroup && (
                <button className="dropdown-item" onClick={() => { setShowOptions(false); onLeaveGroup?.(); }}>
                  <LogOut size={16} className="dropdown-icon" /> Leave Group
                </button>
              )}
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
