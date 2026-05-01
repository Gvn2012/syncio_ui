import React from 'react';
import { type Conversation } from '../types';
import { useParticipant } from '../hooks/useParticipant';
import { UserAvatar } from '../../../components/UserAvatar';
import { Users } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';

interface ChatItemProps {
  conv: Conversation;
  isActive: boolean;
  currentUserId: string | null;
  isTyping?: boolean;
  onClick: () => void;
}

export const ChatItem: React.FC<ChatItemProps> = React.memo(({ conv, isActive, currentUserId, isTyping, onClick }) => {
  const isGroup = conv.type === 'GROUP';
  const otherParticipantId = !isGroup ? conv.participants.find(id => id !== currentUserId) : undefined;
  const { participant } = useParticipant(otherParticipantId);
  
  const displayName = isGroup 
    ? (conv.name || 'Group Chat')
    : (conv.name || participant?.name || (otherParticipantId ? `User ${otherParticipantId.substring(0, 4)}` : 'Sync User'));

  return (
    <div 
      className={`chat-item ${isActive ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''} ${isGroup ? 'group-item' : ''}`}
      onClick={onClick}
    >
      <UserAvatar 
        size={48} 
        userId={!isGroup ? otherParticipantId : undefined} 
        src={isGroup ? conv.groupAvatar : participant?.avatar} 
        showLink={false}
        isGroup={isGroup}
      />
      <div className="chat-info">
        <div className="chat-info-top">
          <span className="chat-name">
            {isGroup && <Users size={14} className="group-list-icon" style={{ marginRight: '4px', verticalAlign: 'middle', opacity: 0.8 }} />}
            {displayName}
          </span>
          <span className="chat-time">
            {conv.lastMessage && new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="chat-info-bottom">
          <span className="chat-last-msg">
            {isTyping ? (
              <TypingIndicator isSmall />
            ) : (
              conv.lastMessage?.content || (conv.lastMessage?.type !== 'TEXT' ? 'Media' : '')
            )}
          </span>
          {(conv.unreadCount ?? 0) > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
        </div>
      </div>
    </div>
  );
});

ChatItem.displayName = 'ChatItem';
