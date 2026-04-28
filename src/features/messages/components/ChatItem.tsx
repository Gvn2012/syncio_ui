import React from 'react';
import { type Conversation } from '../types';
import { useParticipant } from '../hooks/useParticipant';
import { UserAvatar } from '../../../components/UserAvatar';

interface ChatItemProps {
  conv: Conversation;
  isActive: boolean;
  currentUserId: string | null;
  onClick: () => void;
}

export const ChatItem: React.FC<ChatItemProps> = React.memo(({ conv, isActive, currentUserId, onClick }) => {
  const otherParticipantId = conv.participants.find(id => id !== currentUserId);
  const { participant } = useParticipant(otherParticipantId);
  const displayName = conv.name || participant?.name || (otherParticipantId ? `User ${otherParticipantId.substring(0, 4)}` : 'Sync User');

  return (
    <div 
      className={`chat-item ${isActive ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''}`}
      onClick={onClick}
    >
      <UserAvatar size={48} userId={otherParticipantId} src={participant?.avatar} showLink={false} />
      <div className="chat-info">
        <div className="chat-info-top">
          <span className="chat-name">{displayName}</span>
          <span className="chat-time">
            {conv.lastMessage && new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="chat-info-bottom">
          <span className="chat-last-msg">
            {conv.lastMessage?.content || (conv.lastMessage?.type !== 'TEXT' ? 'Media' : '')}
          </span>
          {(conv.unreadCount ?? 0) > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
        </div>
      </div>
    </div>
  );
});

ChatItem.displayName = 'ChatItem';
