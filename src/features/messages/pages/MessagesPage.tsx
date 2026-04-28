import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Search, Plus, MoreVertical, Phone, Video, Paperclip, Check, CheckCheck, Menu, Eye, Clock, Trash, User, BellOff, Loader, Edit, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { ConversationType, MessageStatusType, MessageContentType } from '../types';
import type { Conversation, MessageResponse, MediaItem } from '../types';
import { uploadService } from '../../../api/upload.service';
import { compressFileIfNeeded } from '../../../common/utils/fileCompression';
import { openLightbox, showError } from '../../../store/slices/uiSlice';
import { useMessaging } from '../hooks/useMessaging';
import { useParticipant } from '../hooks/useParticipant';
import { 
  fetchConversations, 
  fetchMessages, 
  fetchOlderMessages,
  setActiveConversation,
  markConversationAsRead,
  selectTotalUnreadCount 
} from '../../../store/slices/messagingSlice';
import type { RootState, AppDispatch } from '../../../store';
import { isDirectChatId, getParticipantsFromDirectChatId } from '../utils/chatId';
import { UserAvatar } from '../../../components/UserAvatar';
import './MessagesPage.css';

const getMediaUrl = (path: string | undefined | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `/api/v1/upload/view?path=${encodeURIComponent(path)}`;
};

const MediaItemRenderer: React.FC<{ item: MediaItem; onClick: () => void; isPending?: boolean }> = ({ item, onClick, isPending }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = item.downloadUrl || item.uploadUrl;
    if (!url) return;
    
    if (url.startsWith('http')) {
      setSignedUrl(url);
      return;
    }
    
    let isMounted = true;
    uploadService.requestDownloadUrls([url]).then(res => {
      if (isMounted && res.data?.downloadUrls?.[url]) {
        setSignedUrl(res.data.downloadUrls[url]);
      }
    }).catch(err => {
      console.error('Failed to fetch signed URL', err);
      if (isMounted) setSignedUrl(getMediaUrl(url));
    });

    return () => { isMounted = false; };
  }, [item.downloadUrl, item.uploadUrl]);

  if (isPending || !signedUrl) {
    return (
      <div className="media-item-loading">
        <Loader size={20} className="animate-spin" />
        {isPending && <span>Uploading...</span>}
      </div>
    );
  }

  return (
    <div 
      className={`media-item ${item.mediaType === 'IMAGE' ? 'clickable' : ''}`}
      onClick={onClick}
    >
      {item.mediaType === 'IMAGE' ? (
        <img src={signedUrl} alt={item.fileName || 'media'} />
      ) : (
        <video src={signedUrl} controls />
      )}
    </div>
  );
};

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
            {conv.lastMessage ? formatTimestamp(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="chat-info-bottom">
          <div className="chat-last-msg">
            {conv.lastMessage?.isRecalled ? 'This message has been recalled' : conv.lastMessage?.content}
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
  isTyping: boolean;
  onToggleSidebar: () => void;
  onDeleteConversation: () => void;
}> = ({ activeChat, currentUserId, isOnline, isTyping, onToggleSidebar, onDeleteConversation }) => {
  const otherParticipantId = activeChat.participants.find(id => id !== currentUserId);
  const { participant } = useParticipant(otherParticipantId || null);
  const displayName = activeChat.name || participant?.name || (otherParticipantId ? `User ${otherParticipantId.substring(0, 8)}` : 'Sync User');

  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <button className="icon-btn sidebar-toggle" onClick={onToggleSidebar}><Menu size={20} /></button>
        <UserAvatar size={40} userId={otherParticipantId} src={participant?.avatar} showLink={true} />
        <div className="chat-header-content">
          <div className="chat-header-name">{displayName}</div>
          <div className={`chat-header-status ${isOnline ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            {isTyping ? <span className="typing-text">typing...</span> : (isOnline ? 'Online' : 'Offline')}
          </div>
        </div>
      </div>
      <div className="chat-header-actions">
        <button className="icon-btn"><Phone size={18} /></button>
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

const formatTimestamp = (timestamp: string | undefined): Date => {
  if (!timestamp) return new Date();
  
  const hasTimezone = timestamp.endsWith('Z') || /\+\d{2}:?\d{2}$/.test(timestamp);
  const normalized = hasTimezone ? timestamp : `${timestamp}Z`;
  return new Date(normalized);
};

export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const convid = searchParams.get('convid');
  
  const dispatch = useDispatch<AppDispatch>();
  const { sendMessage, markAsSeen, editMessage, deleteMessage, recallMessage, sendTyping, deleteConversation } = useMessaging();
  
  const { conversations, messagesByConversation, paginationByConversation, activeConversationId: storeActiveId, loading, onlineUsers, typingUsers, isConnected } = useSelector(
    (state: RootState) => state.messaging
  );
  const totalUnreadCount = useSelector(selectTotalUnreadCount);
  const currentUserId = useSelector((state: RootState) => state.user.id);

  const activeConversationId = storeActiveId || convid;
  const lastConversationId = useRef<string | null>(null);

  interface UploadingItem {
    id: string;
    file: File;
    progress: number;
    type: 'IMAGE' | 'VIDEO';
    previewUrl: string;
  }
  const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);

  useEffect(() => {
    if (uploadingItems.length === 0) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadingItems.length]);

  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const prevUploadingCount = useRef(0);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
    icon: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {},
    type: 'danger',
    icon: <Trash size={24} />
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const messages = useMemo(() => {
    if (!activeConversationId) return [];
    return messagesByConversation[activeConversationId] || [];
  }, [activeConversationId, messagesByConversation]);

  const groupedMessages = useMemo(() => {
    const result: any[] = [];
    let currentGroup: any = null;

    messages.forEach((msg) => {
      const isMedia = msg.type !== MessageContentType.TEXT;
      
      if (isMedia) {
        const isSameBatch = msg.batchId && currentGroup && currentGroup.isMediaGroup && 
                            currentGroup.senderId === msg.senderId && currentGroup.batchId === msg.batchId;
        
        if (isSameBatch) {
          currentGroup.messages.push(msg);
        } else {
          currentGroup = {
            id: `group-${msg.id}`,
            isMediaGroup: true,
            senderId: msg.senderId,
            batchId: msg.batchId,
            messages: [msg],
            timestamp: msg.timestamp,
          };
          result.push(currentGroup);
        }
      } else {
        currentGroup = {
          id: `group-${msg.id}`,
          isMediaGroup: false,
          senderId: msg.senderId,
          messages: [msg],
        };
        result.push(currentGroup);
      }
    });
    return result;
  }, [messages]);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);

  const handleScroll = () => {
    if (messagesScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesScrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
      if (atBottom) {
        setShowNewMessageIndicator(false);
      }
    }
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowNewMessageIndicator(false);
    }
  }, []);

  useEffect(() => {
    const isNewUpload = uploadingItems.length > prevUploadingCount.current;
    if (isAtBottom || isNewUpload) {
      scrollToBottom();
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUserId) {
        setShowNewMessageIndicator(true);
      }
    }
    prevUploadingCount.current = uploadingItems.length;
  }, [messages, isAtBottom, scrollToBottom, currentUserId, uploadingItems.length]);

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeConversationId, scrollToBottom]);

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

      return {
        id: activeConversationId,
        type: ConversationType.DIRECT,
        participants: participantIds,
        name: '',
        unreadCount: 0,
        isEphemeral: true
      } as Conversation & { isEphemeral: boolean };
    }
    return null;
  }, [activeConversationId, conversations, currentUserId]);

  const editingMessage = useMemo(() => {
    if (!editingMessageId || messages.length === 0) return null;
    return messages.find(m => m.id === editingMessageId);
  }, [editingMessageId, messages]);

  const isOtherParticipantOnline = useMemo(() => {
    if (!activeChat || !currentUserId) return false;
    const otherId = activeChat.participants.find(id => id !== currentUserId);
    return otherId ? !!onlineUsers[otherId] : false;
  }, [activeChat, currentUserId, onlineUsers]);

  const isOtherParticipantTyping = useMemo(() => {
    if (!activeChat || !currentUserId || !isOtherParticipantOnline) return false;
    const typingList = typingUsers[activeChat.id] || [];
    const otherId = activeChat.participants.find(id => id !== currentUserId);
    return otherId ? typingList.includes(otherId) : false;
  }, [activeChat, currentUserId, typingUsers, isOtherParticipantOnline]);

  const filteredUploadingItems = useMemo(() => {
    const messageMediaIds = new Set(messages.filter(m => m.mediaId).map(m => m.mediaId));
    return uploadingItems.filter(item => !messageMediaIds.has(item.id));
  }, [uploadingItems, messages]);

  useEffect(() => {
    if (activeConversationId && (!messagesByConversation[activeConversationId] || isConnected)) {
      dispatch(fetchMessages({ conversationId: activeConversationId }));
    }
  }, [activeConversationId, dispatch, isConnected]);

  useEffect(() => {
    if (activeConversationId) {
      dispatch(markConversationAsRead(activeConversationId));
      markAsSeen(activeConversationId);
      lastConversationId.current = activeConversationId;
    }
  }, [activeConversationId, messages.length, markAsSeen, dispatch]);

  const pagination = useMemo(() => {
    if (!activeConversationId) return { hasMore: false, loadingMore: false };
    return paginationByConversation[activeConversationId] || { hasMore: true, loadingMore: false };
  }, [activeConversationId, paginationByConversation]);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el || !activeConversationId) return;
    if (el.scrollTop < 80 && pagination.hasMore && !pagination.loadingMore) {
      const prevScrollHeight = el.scrollHeight;
      dispatch(fetchOlderMessages({ conversationId: activeConversationId })).then(() => {
        requestAnimationFrame(() => {
          if (messagesScrollRef.current) {
            messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight - prevScrollHeight;
          }
        });
      });
    }
  }, [activeConversationId, pagination.hasMore, pagination.loadingMore, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    if (activeConversationId) {
      const otherParticipantId = activeChat?.participants.find(id => id !== currentUserId);
      if (otherParticipantId) {
        sendTyping(activeConversationId, otherParticipantId, true);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(activeConversationId, otherParticipantId, false);
        }, 2000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversationId) return;

    if (editingMessageId) {
      editMessage(editingMessageId, inputText);
      setEditingMessageId(null);
    } else {
      sendMessage(activeConversationId, inputText);
    }
    
    setInputText('');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (activeChat && currentUserId) {
      const otherParticipantId = activeChat.participants.find(id => id !== currentUserId);
      if (otherParticipantId) {
        sendTyping(activeConversationId, otherParticipantId, false);
      }
    }
    
    // Always scroll to bottom when sending a message
    setTimeout(() => scrollToBottom('smooth'), 100);
  };

  const handleEditClick = (msg: MessageResponse) => {
    setEditingMessageId(msg.id);
    setInputText(msg.content);
    setExpandedMessageId(null);
  };

  const handleDeleteClick = (msg: MessageResponse) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message for yourself? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: () => {
        deleteMessage(msg.conversationId, msg.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      type: 'danger',
      icon: <Trash size={24} />
    });
    setExpandedMessageId(null);
  };

  const handleRecallClick = (msg: MessageResponse) => {
    setConfirmModal({
      isOpen: true,
      title: 'Recall Message',
      message: 'Are you sure you want to recall this message for everyone? A trace will be left in the conversation.',
      confirmText: 'Recall',
      onConfirm: () => {
        recallMessage(msg.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      type: 'warning',
      icon: <Clock size={24} />
    });
    setExpandedMessageId(null);
  };

  const handleDeleteConversation = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? All messages will be hidden for you.',
      confirmText: 'Delete',
      onConfirm: () => {
        if (activeConversationId) {
          deleteConversation(activeConversationId);
          navigate('/messages');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      type: 'danger',
      icon: <Trash size={24} />
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !activeConversationId || !currentUserId) return;
    
    if (files.length > 25) {
      dispatch(showError('Maximum 25 items allowed per upload'));
      return;
    }

    const newUploadingItems: UploadingItem[] = files.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      previewUrl: URL.createObjectURL(file)
    }));

    setUploadingItems(prev => [...prev, ...newUploadingItems]);

    try {
      const processedFiles = await Promise.all(files.map(async file => {
        if (file.type.startsWith('image/')) {
          return await compressFileIfNeeded(file);
        }
        return file;
      }));

      const requests = processedFiles.map(file => ({
        fileName: file.name,
        fileContentType: file.type,
        size: file.size,
        conversationId: activeConversationId,
        mediaType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' as 'IMAGE' | 'VIDEO',
        senderId: currentUserId
      }));

      const res = await uploadService.requestMessageMediaBatchUploadUrl({ requests });
      if (res.data?.responses) {
        const uploadPromises = res.data.responses.map((uploadInfo, i) => {
          const file = processedFiles[i];
          const uploadingItem = newUploadingItems[i];
          
          if (file.type.startsWith('video/')) {
            return uploadService.uploadVideoToGcsChunked(
              uploadInfo.uploadUrl,
              file,
              uploadInfo.headers['Content-Type'] || file.type,
              uploadInfo.headers,
              (progress) => {
                setUploadingItems(prev => prev.map(item => item.id === uploadingItem.id ? { ...item, progress } : item));
              }
            );
          } else {
            return uploadService.uploadToGcs(
              uploadInfo.uploadUrl,
              file,
              uploadInfo.headers['Content-Type'] || file.type,
              uploadInfo.headers
            ).then(() => {
              setUploadingItems(prev => prev.map(item => item.id === uploadingItem.id ? { ...item, progress: 1 } : item));
            });
          }
        });

        await Promise.all(uploadPromises);
        setTimeout(() => {
          setUploadingItems(prev => prev.filter(item => !newUploadingItems.find(n => n.id === item.id)));
          newUploadingItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
        }, 2000);
      }
    } catch (error: any) {
      console.error('Upload failed', error);
      dispatch(showError('Upload failed: ' + error.message));
      setUploadingItems(prev => prev.filter(item => !newUploadingItems.find(n => n.id === item.id)));
      newUploadingItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusIcon = (msg: MessageResponse) => {
    if (msg.isOptimistic) {
      return <Clock size={12} className="status-icon" />;
    }
    const statuses = Object.values(msg.status || {});
    if (statuses.some(s => s.status === MessageStatusType.SEEN)) {
      return <Eye size={14} className="status-icon read" />;
    }
    if (statuses.some(s => s.status === MessageStatusType.DELIVERED)) {
      return <CheckCheck size={14} className="status-icon" />;
    }
    return <Check size={14} className="status-icon" />;
  };

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = a.lastMessage ? formatTimestamp(a.lastMessage.timestamp).getTime() : formatTimestamp(a.createdAt).getTime();
      const timeB = b.lastMessage ? formatTimestamp(b.lastMessage.timestamp).getTime() : formatTimestamp(b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [conversations]);

  return (
    <>
      <div className={`messages-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}> 
      <div className="chat-list-panel">
        <div className="chat-list-header">
          <h2>Conversations {totalUnreadCount > 0 && <span className="header-unread-badge">{totalUnreadCount}</span>}</h2>
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
            <ChatHeader 
              activeChat={activeChat} 
              currentUserId={currentUserId} 
              isOnline={isOtherParticipantOnline} 
              isTyping={isOtherParticipantTyping} 
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
              onDeleteConversation={handleDeleteConversation} 
            />

            <div className="messages-scroll" ref={messagesScrollRef} onScroll={() => { handleScroll(); handleMessagesScroll(); }}>
              {pagination.loadingMore && (
                <div className="load-more-indicator">
                  <Loader size={16} className="animate-spin" />
                  <span>Loading older messages...</span>
                </div>
              )}
              <AnimatePresence>
                {showNewMessageIndicator && (
                  <motion.button 
                    className="new-message-indicator"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={() => scrollToBottom()}
                  >
                    <BellOff size={14} />
                    <span>New messages below</span>
                  </motion.button>
                )}
              </AnimatePresence>
              {!pagination.hasMore && messages.length > 0 && (
                <div className="no-more-messages">
                  Beginning of conversation
                </div>
              )}
              {groupedMessages.map((group, groupIdx) => {
                const isSent = group.senderId === currentUserId;
                const isLastInConversation = groupIdx === groupedMessages.length - 1;
                const prevGroup = groupedMessages[groupIdx - 1];
                const isConsecutiveGroup = prevGroup && prevGroup.senderId === group.senderId;

                if (group.isMediaGroup) {
                  return (
                    <div 
                      key={group.id} 
                      className={`message-group ${isSent ? 'sent' : 'received'} ${isConsecutiveGroup ? 'grouped' : 'first-in-group'}`}
                    >
                      <div className="message-bubble-wrapper media-wrapper">
                        <div className="media-grid" style={{ 
                          display: 'grid', 
                          gridTemplateColumns: `repeat(${Math.min(group.messages.reduce((acc: number, m: any) => acc + (m.mediaItems?.length || 1), 0), 3)}, 1fr)`,
                          gap: '4px',
                          maxWidth: '400px',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}>
                          {group.messages.map((msg: MessageResponse) => {
                            const isPending = msg.type === MessageContentType.IMAGE_PENDING || msg.type === MessageContentType.VIDEO_PENDING;
                            
                            
                            const allImageUrls = group.messages.flatMap((m: MessageResponse) => 
                              m.mediaItems?.filter(i => i.mediaType === 'IMAGE').map(i => getMediaUrl(i.downloadUrl || i.uploadUrl)) || 
                              (m.type === MessageContentType.IMAGE && m.mediaUrl ? [getMediaUrl(m.mediaUrl)] : [])
                            );

                            if (msg.mediaItems && msg.mediaItems.length > 0) {
                              return msg.mediaItems.map((item) => (
                                <MediaItemRenderer 
                                  key={item.id} 
                                  item={item}
                                  isPending={isPending}
                                  onClick={() => {
                                    if (item.mediaType === 'IMAGE') {
                                      const currentUrl = getMediaUrl(item.downloadUrl || item.uploadUrl);
                                      const index = allImageUrls.indexOf(currentUrl);
                                      dispatch(openLightbox({ images: allImageUrls, index: index >= 0 ? index : 0 }));
                                    }
                                  }}
                                />
                              ));
                            }
                            
                            return (
                              <MediaItemRenderer 
                                key={msg.id} 
                                item={{
                                  id: msg.mediaId || msg.id,
                                  batchId: msg.batchId || '',
                                  conversationId: msg.conversationId,
                                  fileName: 'media',
                                  contentType: msg.mediaContentType || '',
                                  mediaType: msg.type === MessageContentType.VIDEO ? 'VIDEO' : 'IMAGE',
                                  status: 'COMPLETED',
                                  downloadUrl: msg.mediaUrl
                                }}
                                isPending={isPending}
                                onClick={() => {
                                  if (msg.type === MessageContentType.IMAGE && msg.mediaUrl) {
                                    const currentUrl = getMediaUrl(msg.mediaUrl);
                                    const index = allImageUrls.indexOf(currentUrl);
                                    dispatch(openLightbox({ images: allImageUrls, index: index >= 0 ? index : 0 }));
                                  }
                                }}
                              />
                            );
                          })}
                        </div>
                        {group.messages.map((msg: MessageResponse) => msg.content && !msg.isRecalled && (
                          <div key={`caption-${msg.id}`} className="message-bubble media-caption">
                            <div className="text-content">{msg.content}</div>
                          </div>
                        ))}
                        <div className="message-meta-interactive">
                           <span className="time">
                              {formatTimestamp(group.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                           {isSent && getStatusIcon(group.messages[group.messages.length - 1])}
                        </div>
                      </div>
                    </div>
                  );
                }

                const msg = group.messages[0];
                const isExpanded = expandedMessageId === msg.id;

                return (
                  <div 
                    key={msg.id} 
                    className={`message-group ${isSent ? 'sent' : 'received'} ${isConsecutiveGroup ? 'grouped' : 'first-in-group'} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                  >
                    <div className="message-bubble-wrapper">
                      <div className={`message-bubble ${msg.isRecalled ? 'recalled' : ''}`}>
                        <div className="text-content">
                          {msg.isRecalled ? 'This message was recalled' : msg.content}
                        </div>
                      </div>
                      {(isLastInConversation || isExpanded || msg.isEdited) && (
                        <div className="message-meta-interactive">
                          <span className="time">
                             {formatTimestamp(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.isEdited && !msg.isRecalled && (
                            <span className="edited-indicator" title="Edited">
                              <Edit size={10} />
                            </span>
                          )}
                          {isSent && !msg.isRecalled && getStatusIcon(msg)}
                          {isExpanded && !msg.isRecalled && (
                            <div className="message-actions">
                              {isSent && (new Date().getTime() - formatTimestamp(msg.timestamp).getTime() < 6 * 60 * 60 * 1000) && (
                                <>
                                  <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); handleEditClick(msg); }} title="Edit message">
                                    <Edit size={14} /> <span>Edit</span>
                                  </button>
                                  <button className="action-btn recall" onClick={(e) => { e.stopPropagation(); handleRecallClick(msg); }} title="Recall for everyone">
                                    <Clock size={14} /> <span>Recall</span>
                                  </button>
                                </>
                              )}
                              <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDeleteClick(msg); }} title="Delete for me">
                                <Trash size={14} /> <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredUploadingItems.length > 0 && (
                <div className="message-group sent first-in-group">
                  <div className="message-bubble-wrapper media-wrapper">
                    <div className="media-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `repeat(${Math.min(filteredUploadingItems.length, 3)}, 1fr)`,
                      gap: '4px',
                      maxWidth: '400px',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      {filteredUploadingItems.map(item => (
                        <div key={item.id} className="media-item uploading-item">
                          {item.type === 'IMAGE' ? (
                            <img src={item.previewUrl} alt="uploading" />
                          ) : (
                            <video src={item.previewUrl} />
                          )}
                          <div className="upload-progress-overlay">
                            <div className="progress-circle">
                              <span className="progress-percentage">
                                {Math.round(item.progress * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <AnimatePresence>
                {editingMessage && (
                  <motion.div 
                    className="editing-banner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="editing-info">
                      <div className="editing-label">
                        <Edit size={12} />
                        <span>Editing Message</span>
                      </div>
                      <div className="editing-content">
                        {editingMessage.content}
                      </div>
                    </div>
                    <button className="cancel-edit-btn" onClick={() => { setEditingMessageId(null); setInputText(''); }}>
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="chat-input-container">
                <input type="file" multiple accept="image/*,video/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                <button className="icon-btn" onClick={() => fileInputRef.current?.click()}><Paperclip size={20} /></button>
                <input 
                  type="text"
                  ref={textAreaRef as any}
                  className="chat-input" 
                  placeholder={editingMessageId ? "Edit message..." : "Sync a message..."}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={handleSendMessage}><Send size={18} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-chat-state">
            <div className="empty-chat-header">
               <button className="icon-btn sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={24} /></button>
            </div>
            <div className="empty-chat-content">
              <Search size={48} />
              <h3> Your Sync Communications</h3>
              <p>Select an individual or group sync to begin collaborating.</p>
            </div>
          </div>
        )}
      </div>
      </div>
      {createPortal(
        <AnimatePresence>
          {confirmModal.isOpen && (
            <div className="delete-modal-overlay">
              <motion.div 
                className="delete-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              />
              <motion.div 
                className={`delete-confirm-modal modal-type-${confirmModal.type}`}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="delete-modal-header">
                  <div className={`delete-icon-wrapper icon-${confirmModal.type}`}>
                    {confirmModal.icon}
                  </div>
                  <h3>{confirmModal.title}</h3>
                </div>
                <p className="delete-modal-text">
                  {confirmModal.message}
                </p>
                <div className="delete-modal-actions">
                  <button className="delete-cancel-btn" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
                  <button className={`delete-confirm-btn btn-${confirmModal.type}`} onClick={confirmModal.onConfirm}>{confirmModal.confirmText}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
