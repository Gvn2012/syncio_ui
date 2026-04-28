import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Check, CheckCheck, Loader, AlertTriangle, Trash, ArrowDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { ConversationType, MessageStatusType, MessageContentType } from '../types';
import type { MessageResponse } from '../types';
import { uploadService, isUrlExpired } from '../../../api/upload.service';
import { compressFileIfNeeded } from '../../../common/utils/fileCompression';
import { openLightbox, showError } from '../../../store/slices/uiSlice';
import { useMessaging } from '../hooks/useMessaging';
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
import { checkImageCache } from '../../../hooks/useCachedImage';
import './MessagesPage.css';

import { ChatItem } from '../components/ChatItem';
import { ChatHeader } from '../components/ChatHeader';
import { ConfirmModal } from '../components/ConfirmModal';
import { MessageGroup } from '../components/MessageGroup';
import { MessageInput } from '../components/MessageInput';
import { useWebRTC, CallState } from '../hooks/useWebRTC';
import { IncomingCallModal, ActiveCallBar } from '../components/CallComponents';

const formatTimestamp = (timestamp: string | undefined): Date => {
  if (!timestamp) return new Date();
  const hasTimezone = timestamp.endsWith('Z') || /\+\d{2}:?\d{2}$/.test(timestamp);
  const normalized = hasTimezone ? timestamp : `${timestamp}Z`;
  return new Date(normalized);
};

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const convid = searchParams.get('convid');
  
  const dispatch = useDispatch<AppDispatch>();
  const { sendMessage, markAsSeen, editMessage, deleteMessage, recallMessage, sendTyping, deleteConversation } = useMessaging();
  
  const { callState, callerInfo, duration, isMuted, localStream, remoteStream, initiateCall, answerCall, rejectCall, endCall, toggleMute } = useWebRTC();
  
  const { conversations, messagesByConversation, paginationByConversation, activeConversationId: storeActiveId, loading, onlineUsers, typingUsers, isConnected } = useSelector(
    (state: RootState) => state.messaging
  );
  const totalUnreadCount = useSelector(selectTotalUnreadCount);
  const currentUserId = useSelector((state: RootState) => state.user.id);

  const activeConversationId = storeActiveId || convid;

  interface UploadingItem {
    id: string;
    file: File;
    progress: number;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO';
    previewUrl: string;
  }
  const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
  const [stagedAudio, setStagedAudio] = useState<File | null>(null);

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
    icon: null
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const messages = useMemo(() => {
    if (!activeConversationId) return [];
    return messagesByConversation[activeConversationId] || [];
  }, [activeConversationId, messagesByConversation]);

  const editingMessage = useMemo(() => {
    if (!editingMessageId) return null;
    return messages.find(m => m.id === editingMessageId);
  }, [editingMessageId, messages]);

  const groupedMessages = useMemo(() => {
    interface MessageGroupItem {
      id: string;
      isMediaGroup: boolean;
      senderId: string;
      batchId?: string;
      messages: MessageResponse[];
      timestamp: string;
    }
    const result: MessageGroupItem[] = [];
    let currentGroup: MessageGroupItem | null = null;

    messages.forEach((msg) => {
      const isPendingMedia = msg.type === MessageContentType.IMAGE_PENDING || msg.type === MessageContentType.VIDEO_PENDING || msg.type === MessageContentType.AUDIO_PENDING;
      if (isPendingMedia && msg.senderId !== currentUserId) return;

      const isMedia = msg.type && msg.type !== MessageContentType.TEXT;
      if (isMedia) {
        const isSameBatch = msg.batchId && currentGroup && currentGroup.isMediaGroup && 
                            currentGroup.senderId === msg.senderId && currentGroup.batchId === msg.batchId;
        if (isSameBatch && currentGroup) {
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
          timestamp: msg.timestamp,
        };
        result.push(currentGroup);
      }
    });
    return result;
  }, [messages, currentUserId]);

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [fetchingUrls, setFetchingUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [pathPreviewMap, setPathPreviewMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!messages.length) return;

    const urlsToFetch = new Set<string>();
    messages.forEach(msg => {
      if (msg.mediaUrl && !msg.mediaUrl.startsWith('http')) urlsToFetch.add(msg.mediaUrl);
      msg.mediaItems?.forEach(item => {
        if (item.mediaType === 'VIDEO') return;

        const url = item.downloadUrl;
        if (url && !url.startsWith('http')) {
          urlsToFetch.add(url);
        }
      
        if ((!url || url.startsWith('http')) && item.conversationId && item.mediaType && item.id) {
          const gcsPath = `msg/${item.conversationId}/${item.mediaType}/${item.id}`;
          urlsToFetch.add(gcsPath);
        }
      });
    });

    const unfetchedUrls = Array.from(urlsToFetch).filter(url => 
      (!signedUrls[url] || isUrlExpired(signedUrls[url])) && !fetchingUrls.has(url) && !failedUrls.has(url)
    );
    
    if (unfetchedUrls.length === 0) return;

    const batchSize = 50;

    const fetchBatch = async (chunk: string[]) => {
      try {
        const res = await uploadService.requestDownloadUrls(chunk);
        if (res.data?.downloadUrls) {
          setSignedUrls(prev => ({ ...prev, ...res.data.downloadUrls }));
        }
        chunk.forEach(url => {
          if (!res.data?.downloadUrls || !res.data.downloadUrls[url]) {
            setFailedUrls(prev => new Set(prev).add(url));
          }
        });
      } catch (error) {
        console.error('Failed to pre-fetch signed URLs', error);
        chunk.forEach(url => setFailedUrls(prev => new Set(prev).add(url)));
      } finally {
        setFetchingUrls(prev => {
          const next = new Set(prev);
          chunk.forEach(u => next.delete(u));
          return next;
        });
      }
    };

    const processUrls = async () => {
      const cachedStatus = await Promise.all(unfetchedUrls.map(url => checkImageCache(url)));
      const filteredUnfetched = unfetchedUrls.filter((_, i) => !cachedStatus[i]);
      const cachedUrls = unfetchedUrls.filter((_, i) => cachedStatus[i]);

      if (cachedUrls.length > 0) {
        setSignedUrls(prev => {
          const next = { ...prev };
          cachedUrls.forEach(url => { next[url] = url; });
          return next;
        });
      }

      if (filteredUnfetched.length === 0) return;

      setFetchingUrls(prev => {
        const next = new Set(prev);
        filteredUnfetched.forEach(u => next.add(u));
        return next;
      });

      for (let i = 0; i < filteredUnfetched.length; i += batchSize) {
        fetchBatch(filteredUnfetched.slice(i, i + batchSize));
      }
    };

    processUrls();
  }, [messages, activeConversationId]); 

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowNewMessageIndicator(false);
    }
  }, []);

  const handleScroll = () => {
    if (messagesScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesScrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
      if (atBottom) setShowNewMessageIndicator(false);
    }
  };

  useEffect(() => {
    const isNewUpload = uploadingItems.length > prevUploadingCount.current;
    if (isAtBottom || isNewUpload) {
      scrollToBottom();
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUserId) setShowNewMessageIndicator(true);
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
      return { id: activeConversationId, type: ConversationType.DIRECT, participants: participantIds, name: '', unreadCount: 0, isEphemeral: true } as any;
    }
    return null;
  }, [activeConversationId, conversations]);

  const participantAvatars = useMemo(() => {
    const map: Record<string, string> = {};
    activeChat?.participantDetails?.forEach((p: any) => {
      if (p.avatar) map[p.id] = p.avatar;
    });
    return map;
  }, [activeChat]);

  useEffect(() => {
    if (activeConversationId && (!messagesByConversation[activeConversationId] || isConnected)) {
      dispatch(fetchMessages({ conversationId: activeConversationId }));
    }
  }, [activeConversationId, dispatch, isConnected]);

  useEffect(() => {
    const handleFocus = () => {
      if (activeConversationId) {
        dispatch(markConversationAsRead(activeConversationId));
        markAsSeen(activeConversationId);
      }
    };

    window.addEventListener('focus', handleFocus);
    handleFocus();

    return () => window.removeEventListener('focus', handleFocus);
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
    handleScroll();
  }, [activeConversationId, pagination.hasMore, pagination.loadingMore, dispatch]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversationId) return;
    // Clear typing indicator immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (activeChat && currentUserId) {
      const otherId = activeChat.participants.find((id: string) => id !== currentUserId);
      if (otherId) sendTyping(activeConversationId, otherId, false);
    }

    if (editingMessageId) {
      editMessage(editingMessageId, inputText);
      setEditingMessageId(null);
    } else {
      sendMessage(activeConversationId, inputText);
    }
    
    setInputText('');
    setTimeout(() => scrollToBottom('smooth'), 100);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !activeConversationId || !currentUserId) return;
    if (files.length > 25) { dispatch(showError('Maximum 25 items allowed per upload')); return; }

    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    const otherFiles = files.filter(f => !f.type.startsWith('audio/'));

    if (audioFiles.length > 0) {
      setStagedAudio(audioFiles[0]);
    }

    if (otherFiles.length === 0) return;

    const newUploadingItems: UploadingItem[] = otherFiles.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file, progress: 0, type: file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('audio/') ? 'AUDIO' : 'IMAGE', previewUrl: URL.createObjectURL(file)
    }));

    setUploadingItems(prev => [...prev, ...newUploadingItems]);

    try {
      const processedFiles = await Promise.all(files.map(file => file.type.startsWith('image/') ? compressFileIfNeeded(file) : file));
      const requests = processedFiles.map(file => ({
        fileName: file.name, fileContentType: file.type, size: file.size, conversationId: activeConversationId,
        mediaType: file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('audio/') ? 'AUDIO' : 'IMAGE' as any, senderId: currentUserId
      }));

      const res = await uploadService.requestMessageMediaBatchUploadUrl({ requests });
      if (res.data?.responses) {
        const newPathPreviews: Record<string, string> = {};
        res.data.responses.forEach((resp, i) => {
          try {
            const urlObj = new URL(resp.uploadUrl);
            const path = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
            
            const cleanPath = path.includes('/') ? path.split('/').slice(1).join('/') : path;
            newPathPreviews[cleanPath] = newUploadingItems[i].previewUrl;
          } catch (e) {
            console.error('Failed to parse upload URL', e);
          }
        });
        setPathPreviewMap(prev => ({ ...prev, ...newPathPreviews }));

        await Promise.all(res.data.responses.map((uploadInfo, i) => {
          const file = processedFiles[i];
          const uploadingItem = newUploadingItems[i];
          if (file.type.startsWith('video/')) {
            return uploadService.uploadVideoToGcsChunked(uploadInfo.uploadUrl, file, uploadInfo.headers['Content-Type'] || file.type, uploadInfo.headers, (progress) => {
              setUploadingItems(prev => prev.map(item => item.id === uploadingItem.id ? { ...item, progress } : item));
            });
          } else {
            return uploadService.uploadToGcs(uploadInfo.uploadUrl, file, uploadInfo.headers['Content-Type'] || file.type, uploadInfo.headers).then(() => {
              setUploadingItems(prev => prev.map(item => item.id === uploadingItem.id ? { ...item, progress: 1 } : item));
            });
          }
        }));
      }
    } catch (error) {
      console.error('Batch upload failed', error);
      dispatch(showError('Failed to upload some media items'));
    } finally {
      setTimeout(() => setUploadingItems([]), 2000);
    }
  };

  const handleSendAudio = async (blob: Blob) => {
    if (!activeConversationId || !currentUserId) return;
    const file = new File([blob], `voice_message_${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
    
    const newUploadingItem: UploadingItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      file, progress: 0, type: 'AUDIO', previewUrl: URL.createObjectURL(file)
    };

    setUploadingItems(prev => [...prev, newUploadingItem]);

    try {
      const requests = [{
        fileName: file.name, fileContentType: file.type, size: file.size, conversationId: activeConversationId,
        mediaType: 'AUDIO' as any, senderId: currentUserId
      }];

      const res = await uploadService.requestMessageMediaBatchUploadUrl({ requests });
      if (res.data?.responses && res.data.responses.length > 0) {
        const uploadInfo = res.data.responses[0];
        await uploadService.uploadToGcs(uploadInfo.uploadUrl, file, uploadInfo.headers['Content-Type'] || file.type, uploadInfo.headers).then(() => {
           setUploadingItems(prev => prev.map(item => item.id === newUploadingItem.id ? { ...item, progress: 1 } : item));
        });
      }
    } catch (error) {
      console.error('Audio upload failed', error);
      dispatch(showError('Failed to send voice message'));
    } finally {
      setTimeout(() => setUploadingItems(prev => prev.filter(item => item.id !== newUploadingItem.id)), 2000);
    }
  };

  const getStatusIcon = (msg: MessageResponse) => {
    if (!activeChat || !currentUserId) return null;
    const otherParticipantId = activeChat.participants.find((id: string) => id !== currentUserId);
    if (!otherParticipantId) return null;
    const status = msg.status?.[otherParticipantId]?.status;
    if (status === MessageStatusType.SEEN) return <CheckCheck size={14} className="text-primary" />;
    if (status === MessageStatusType.DELIVERED) return <CheckCheck size={14} />;
    return <Check size={14} />;
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

  const otherParticipantId = activeChat?.participants.find((id: string | null) => id !== currentUserId);
  const isOnline = otherParticipantId ? !!onlineUsers[otherParticipantId] : false;
  const isTyping = activeChat && otherParticipantId ? (typingUsers[activeChat.id] || []).includes(otherParticipantId) : false;

  useEffect(() => {
    messages.forEach(msg => {
      const isPendingMedia = msg.type === MessageContentType.IMAGE_PENDING || msg.type === MessageContentType.VIDEO_PENDING || msg.type === MessageContentType.AUDIO_PENDING;
      if (isPendingMedia && msg.senderId === currentUserId) {
        const msgTime = formatTimestamp(msg.timestamp).getTime();
        if (Date.now() - msgTime > 2 * 60 * 1000) {
          deleteMessage(msg.conversationId, msg.id);
        }
      }
    });
  }, [messages, currentUserId, deleteMessage]);

  return (
    <>
      {callState === CallState.INBOUND_RINGING && (
        <IncomingCallModal 
          callerInfo={callerInfo} 
          onAccept={answerCall} 
          onReject={rejectCall} 
        />
      )}
      {callState === CallState.CONNECTED && (
        <ActiveCallBar 
          duration={duration} 
          isMuted={isMuted} 
          onToggleMute={toggleMute} 
          onEndCall={endCall} 
          remoteStream={remoteStream}
          localStream={localStream}
        />
      )}
      <div className={`messages-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <div className="chat-list-panel">
        <div className="chat-list-header">
          <h2>Messages {totalUnreadCount > 0 && <span className="header-unread-badge">{totalUnreadCount}</span>}</h2>
          <div className="chat-actions">
            <button className="icon-btn"><Search size={20} /></button>
            <button className="icon-btn"><Plus size={20} /></button>
          </div>
        </div>
        <div className="chats-scroll">
          <div className="chat-section">
            <div className="chat-section-header">Direct Messages</div>
            {conversations.length === 0 && !loading && <div className="empty-chats">No conversations yet</div>}
            {conversations.map(conv => (
              <ChatItem 
                key={conv.id} 
                conv={conv} 
                isActive={activeConversationId === conv.id} 
                currentUserId={currentUserId}
                onClick={() => navigate(`/messages?convid=${conv.id}`)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {activeChat ? (
          <>
            <ChatHeader 
              activeChat={activeChat} 
              currentUserId={currentUserId} 
              isOnline={isOnline} 
              isTyping={isTyping} 
              onDeleteConversation={handleDeleteConversation} 
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onCallClick={() => {
                const otherId = activeChat.participants.find((id: string) => id !== currentUserId);
                if (otherId) initiateCall(otherId);
              }}
            />


            <div className="messages-scroll" ref={messagesScrollRef} onScroll={handleMessagesScroll}>
              {pagination.loadingMore && <div className="loading-more"><Loader size={20} className="animate-spin" /></div>}
              
              {isDirectChatId(activeChat.id) && messages.length === 0 && (
                <div className="external-disclaimer">
                   <AlertTriangle size={24} />
                   <div>
                     <strong>Direct Message</strong><br />
                     This is a private conversation. Your messages are encrypted.
                   </div>
                </div>
              )}

              {groupedMessages.map((group, groupIdx) => (
                <MessageGroup 
                  key={group.id} 
                  group={group} 
                  currentUserId={currentUserId}
                  signedUrls={{ ...signedUrls, ...pathPreviewMap }}
                  avatars={participantAvatars}
                  isConsecutiveGroup={groupIdx > 0 && groupedMessages[groupIdx-1].senderId === group.senderId}
                  isLastInConversation={groupIdx === groupedMessages.length - 1}
                  expandedMessageId={expandedMessageId}
                  setExpandedMessageId={setExpandedMessageId}
                  formatTimestamp={formatTimestamp}
                  getStatusIcon={getStatusIcon}
                  onEdit={(msg: MessageResponse) => { setEditingMessageId(msg.id); setInputText(msg.content); }}
                  onRecall={(msg: MessageResponse) => recallMessage(msg.id)}
                  onDelete={(msg: MessageResponse) => deleteMessage(msg.conversationId, msg.id)}
                  onOpenLightbox={(images: string[], index: number) => dispatch(openLightbox({ images, index }))}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {showNewMessageIndicator && (
              <button className="new-message-indicator" onClick={() => scrollToBottom()}>
                <ArrowDown size={14} /> New Message
              </button>
            )}

            <MessageInput 
              inputText={inputText}
              setInputText={setInputText}
              onSendMessage={handleSendMessage}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              textAreaRef={textAreaRef}
              isEditing={!!editingMessageId}
              editingContent={editingMessage?.content}
              onCancelEdit={() => { setEditingMessageId(null); setInputText(''); }}
              uploadingItems={uploadingItems}
              onSendAudio={handleSendAudio}
              stagedAudio={stagedAudio}
              onClearStagedAudio={() => setStagedAudio(null)}
            />
          </>
        ) : (
          <div className="no-chat-selected" />
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
        icon={confirmModal.icon}
      />
    </div>
    </>
  );
};
