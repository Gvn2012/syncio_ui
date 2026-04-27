import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Search, Plus, MoreVertical, Phone, Video, Paperclip, Check, CheckCheck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { ConversationType, MessageStatusType } from '../types';
import type { Conversation, MessageResponse } from '../types';
import { useMessaging } from '../hooks/useMessaging';
import { useParticipant } from '../hooks/useParticipant';
import { 
  fetchConversations, 
  fetchMessages, 
  setActiveConversation 
} from '../../../store/slices/messagingSlice';
import type { RootState, AppDispatch } from '../../../store';
import { isDirectChatId, getParticipantsFromDirectChatId } from '../utils/chatId';
import { UserAvatar } from '../../../components/UserAvatar';
import './MessagesPage.css';

const ChatItem: React.FC<{ 
  conv: Conversation; 
  isActive: boolean; 
  currentUserId: string | null;
  onClick: () => void;
}> = ({ conv, isActive, currentUserId, onClick }) => {
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
            {conv.lastMessage ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="chat-info-bottom">
          <div className="chat-last-msg">
            {conv.lastMessage?.isDeleted ? 'This message was recalled' : conv.lastMessage?.content}
          </div>
          {(conv.unreadCount ?? 0) > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
        </div>
      </div>
    </div>
  );
};

const ChatHeader: React.FC<{ 
  activeChat: Conversation; 
  currentUserId: string | null;
  isOnline: boolean;
}> = ({ activeChat, currentUserId, isOnline }) => {
  const otherParticipantId = activeChat.participants.find(id => id !== currentUserId);
  const { participant } = useParticipant(otherParticipantId || null);
  const displayName = activeChat.name || participant?.name || (otherParticipantId ? `User ${otherParticipantId.substring(0, 8)}` : 'Sync User');

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <UserAvatar size={40} userId={otherParticipantId} src={participant?.avatar} showLink={true} />
        <div className="chat-header-content">
          <div className="chat-header-name">{displayName}</div>
          <div className={`chat-header-status ${isOnline ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
      <div className="chat-header-actions">
        <button className="icon-btn"><Phone size={18} /></button>
        <button className="icon-btn"><Video size={18} /></button>
        <button className="icon-btn"><MoreVertical size={18} /></button>
      </div>
    </div>
  );
};
export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const convid = searchParams.get('convid');
  
  const dispatch = useDispatch<AppDispatch>();
  const { sendMessage, markAsSeen, editMessage, deleteMessage } = useMessaging();
  
  const { conversations, messagesByConversation, activeConversationId: storeActiveId, loading, onlineUsers } = useSelector(
    (state: RootState) => state.messaging
  );
  const currentUserId = useSelector((state: RootState) => state.user.id);

  // Derive active ID from URL if store is not yet updated to prevent flicker
  const activeConversationId = storeActiveId || convid;

  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  React.useLayoutEffect(() => {
    if (convid) {
      dispatch(setActiveConversation(convid));
    } else {
      dispatch(setActiveConversation(null));
    }
  }, [convid, dispatch]);

  const activeChat = useMemo(() => {
    if (!activeConversationId) return null;
    const existing = conversations.find(c => c.id === activeConversationId);
    if (existing) return existing;

    if (isDirectChatId(activeConversationId)) {
      const participantIds = getParticipantsFromDirectChatId(activeConversationId);
      const otherId = participantIds.find(id => id !== currentUserId);

      return {
        id: activeConversationId,
        type: ConversationType.DIRECT,
        participants: participantIds,
        name: `Chat with ${otherId?.substring(0, 8)}...`, 
        unreadCount: 0,
        isEphemeral: true
      } as Conversation & { isEphemeral: boolean };
    }
    return null;
  }, [activeConversationId, conversations, currentUserId]);

  const messages = useMemo(() => {
    if (!activeConversationId) return [];
    return messagesByConversation[activeConversationId] || [];
  }, [activeConversationId, messagesByConversation]);

  const isOtherParticipantOnline = useMemo(() => {
    if (!activeChat || !currentUserId) return false;
    const otherId = activeChat.participants.find(id => id !== currentUserId);
    return otherId ? !!onlineUsers[otherId] : false;
  }, [activeChat, currentUserId, onlineUsers]);

  useEffect(() => {
    if (activeConversationId && !messagesByConversation[activeConversationId]) {
      if (!isDirectChatId(activeConversationId) || conversations.find(c => c.id === activeConversationId)) {
        dispatch(fetchMessages({ conversationId: activeConversationId }));
      }
    }
    if (activeConversationId) {
      markAsSeen(activeConversationId);
      setTimeout(scrollToBottom, 100);
    }
  }, [activeConversationId, dispatch, markAsSeen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Handle outside click
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversationId) return;

    if (editingMessageId) {
      editMessage(editingMessageId, inputText);
      setEditingMessageId(null);
    } else {
      sendMessage(activeConversationId, inputText);
    }
    
    setInputText('');
    setTimeout(scrollToBottom, 100);
  };

  const handleEditClick = (msg: MessageResponse) => {
    setEditingMessageId(msg.id);
    setInputText(msg.content);
    setExpandedMessageId(null);
  };

  const handleDeleteClick = (msg: MessageResponse) => {
    if (window.confirm('Are you sure you want to recall this message?')) {
      deleteMessage(msg.id);
    }
    setExpandedMessageId(null);
  };

  const handleFileSelect = () => {
    // Logic for file selection
  };

  const getStatusIcon = (msg: MessageResponse) => {
    const statuses = Object.values(msg.status || {});
    if (statuses.some(s => s.status === MessageStatusType.SEEN)) {
      return <CheckCheck size={14} className="status-icon read" />;
    }
    if (statuses.some(s => s.status === MessageStatusType.DELIVERED)) {
      return <CheckCheck size={14} className="status-icon" />;
    }
    return <Check size={14} className="status-icon" />;
  };

  const sortedConversations = useMemo(() => {
    // Keep order stable instead of moving to top on every message
    return [...conversations];
  }, [conversations]);

  return (
    <div className="messages-container"> 
      <div className="chat-list-panel">
        <div className="chat-list-header">
          <h2>Conversations</h2>
          <div className="chat-actions">
            <button className="icon-btn"><Plus size={20} /></button>
          </div>
        </div>
        
        <div className="chats-scroll">
          {sortedConversations.map(conv => (
            <ChatItem 
              key={conv.id} 
              conv={conv} 
              isActive={activeConversationId === conv.id} 
              currentUserId={currentUserId}
              onClick={() => setSearchParams({ type: conv.type.toLowerCase(), convid: conv.id })}
            />
          ))}
          {loading && sortedConversations.length === 0 && <div className="loading-text">Updating inbox...</div>}
        </div>
      </div>

      <div className="chat-window">
        {activeChat ? (
          <>
            <ChatHeader activeChat={activeChat} currentUserId={currentUserId} isOnline={isOtherParticipantOnline} />

            <div className="messages-scroll">
              {messages.map((msg, idx) => {
                const isSent = msg.senderId === currentUserId;
                const prevMsg = messages[idx - 1];
                const isGrouped = prevMsg && prevMsg.senderId === msg.senderId;
                const isLast = idx === messages.length - 1;
                const isExpanded = expandedMessageId === msg.id;

                return (
                  <div 
                    key={msg.id} 
                    className={`message-group ${isSent ? 'sent' : 'received'} ${isGrouped ? 'grouped' : 'first-in-group'} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                  >
                    <div className="message-bubble-wrapper">
                      <div className={`message-bubble ${msg.isDeleted ? 'deleted' : ''}`}>
                        <div className="text-content">{msg.content}</div>
                        {msg.isEdited && !msg.isDeleted && <span className="edited-label">(edited)</span>}
                      </div>
                      {(isLast || isExpanded) && (
                        <div className="message-meta-interactive">
                          <span className="time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isSent && getStatusIcon(msg)}
                          {isSent && isExpanded && !msg.isDeleted && (
                            <div className="message-actions">
                              <button onClick={(e) => { e.stopPropagation(); handleEditClick(msg); }}>Edit</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(msg); }}>Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="chat-input-container">
                <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                <button className="icon-btn" onClick={() => fileInputRef.current?.click()}><Paperclip size={20} /></button>
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder={editingMessageId ? "Edit message..." : "Sync a message..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="send-btn" onClick={handleSendMessage}><Send size={18} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-chat-state">
            <Search size={48} />
            <h3> Your Sync Communications</h3>
            <p>Select an individual or group sync to begin collaborating.</p>
          </div>
        )}
      </div>
    </div>
  );
};
