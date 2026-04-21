import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Plus, MoreVertical, Phone, Video, Smile, Paperclip, Users, ShieldAlert, Check, CheckCheck, Pin, PinOff, EyeOff, BellOff, Mail, Trash2, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setLightboxImage } from '../../../store/slices/uiSlice';
import { mockConversations, mockMessages } from '../data';
import { ConversationType } from '../types';
import type { Conversation } from '../types';
import './MessagesPage.css';

const CURRENT_ORG_ID = '3e253011-8fc1-460d-83de-a9a3b689fd5b';

export const MessagesPage: React.FC = () => {
  const dispatch = useDispatch();
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeChat) {
      setMessages(mockMessages[activeChat.id as keyof typeof mockMessages] || []);
      setExpandedMessageId(null);
      // Simulate real-time loading
      setTimeout(scrollToBottom, 100);
    }
  }, [activeChat]);

  const handleSendMessage = () => {
    if (!inputText.trim() && selectedImages.length === 0 || !activeChat) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeChat.id,
      senderId: 'currentUser', // Mock current user
      text: inputText,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'sent' as const
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    setSelectedImages([]);
    setTimeout(scrollToBottom, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 25 - selectedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    const newPreviews = filesToProcess.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...newPreviews]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTogglePin = (convId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === convId ? { ...conv, isPinned: !conv.isPinned } : conv
    ));
    setActiveMenuId(null);
  };

  const handleToggleMenu = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === convId ? null : convId);
  };

  const pinnedConversations = conversations.filter(c => c.isPinned);
  const recentConversations = conversations.filter(c => !c.isPinned);

  const isExternal = activeChat?.participants.some(p => p.orgId !== CURRENT_ORG_ID);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <CheckCheck size={14} className="status-icon read" />;
      case 'delivered': return <CheckCheck size={14} className="status-icon" />;
      default: return <Check size={14} className="status-icon" />;
    }
  };

  const renderMessageImages = (images: string[]) => {
    if (!images || images.length === 0) return null;

    const count = images.length;
    let gridClass = 'image-grid-many';
    if (count === 1) gridClass = 'image-grid-1';
    else if (count === 2) gridClass = 'image-grid-2';
    else if (count === 3) gridClass = 'image-grid-3';
    else if (count === 4) gridClass = 'image-grid-4';

    return (
      <div className={`message-image-grid ${gridClass}`}>
        {images.map((url, i) => (
          <div key={i} className="image-grid-item" onClick={() => dispatch(setLightboxImage(url))}>
            <img src={url} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    );
  };

  const renderChatItem = (conv: Conversation) => {
    const hasExternal = conv.participants.some(p => p.orgId !== CURRENT_ORG_ID);
    const isMenuOpen = activeMenuId === conv.id;

    return (
      <div 
        key={conv.id} 
        className={`chat-item ${activeChat?.id === conv.id ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''}`}
        onClick={() => setActiveChat(conv)}
      >
        <div className="chat-avatar-wrapper">
          {conv.type === ConversationType.GROUP ? (
            <div className="group-avatar-stack">
              <img src={conv.participants[0].avatar} alt="" className="stack-item stack-1" />
              <img src={conv.participants[1].avatar} alt="" className="stack-item stack-2" />
            </div>
          ) : (
            <>
              <img src={conv.participants[0].avatar} alt="" className="chat-avatar" />
              {conv.participants[0].isOnline && <div className="status-indicator"></div>}
            </>
          )}
        </div>
        
        <div className="chat-info">
          <div className="chat-info-top">
            <span className="chat-name">
              {conv.type === ConversationType.GROUP && <Users size={14} className="type-icon" />}
              {hasExternal && <span className="external-badge">EXT</span>}
              {conv.name}
            </span>
            <div className="chat-meta-right">
              <span className="chat-time">{conv.lastMessage?.timestamp}</span>
            </div>
          </div>
          <div className="chat-info-bottom">
            <div className="chat-last-msg">
              {conv.type === ConversationType.GROUP && (
                <span className="sender">{conv.lastMessage?.senderName}: </span>
              )}
              {conv.lastMessage?.text}
            </div>
            {conv.unreadCount > 0 && (
              <span className="unread-badge">{conv.unreadCount}</span>
            )}
            <div className="options-container" ref={isMenuOpen ? menuRef : null}>
              <button 
                className={`options-btn ${isMenuOpen ? 'active' : ''}`}
                onClick={(e) => handleToggleMenu(e, conv.id)}
              >
                <MoreVertical size={14} />
              </button>
              {isMenuOpen && (
                <div className="chat-options-menu">
                  <button onClick={() => handleTogglePin(conv.id)}>
                    {conv.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                    {conv.isPinned ? 'Unpin' : 'Pin to top'}
                  </button>
                  <button onClick={() => setActiveMenuId(null)}>
                    <EyeOff size={14} />
                    Hide sync
                  </button>
                  <button onClick={() => setActiveMenuId(null)}>
                    <BellOff size={14} />
                    Mute
                  </button>
                  <button onClick={() => setActiveMenuId(null)}>
                    <Mail size={14} />
                    Mark as unread
                  </button>
                  <button className="delete" onClick={() => setActiveMenuId(null)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="messages-view-content"> 
      
      {/* Inbox Panel */}
      <div className="chat-list-panel">
        <div className="chat-list-header">
          <h2>Inbox</h2>
          <div className="chat-actions">
            <button className="icon-btn"><Plus size={20} /></button>
          </div>
        </div>
        
        <div className="chats-scroll">
          {pinnedConversations.length > 0 && (
            <div className="chat-section">
              <div className="chat-section-header">PINNED</div>
              {pinnedConversations.map(renderChatItem)}
            </div>
          )}
          
          <div className="chat-section">
            <div className="chat-section-header">{pinnedConversations.length > 0 ? 'RECENT' : 'ALL MESSAGES'}</div>
            {recentConversations.map(renderChatItem)}
          </div>
        </div>
      </div>

      {/* Main Chat Detail */}
      <div className="chat-window">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-name">
                  {isExternal && <span className="external-badge">EXT</span>}
                  {activeChat.name}
                </div>
                {activeChat.type === ConversationType.INDIVIDUAL && (
                  <div className="chat-header-status">
                    <span className="status-dot"></span>
                    Online
                  </div>
                )}
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn"><Phone size={18} /></button>
                <button className="icon-btn"><Video size={18} /></button>
                <button className="icon-btn"><MoreVertical size={18} /></button>
              </div>
            </div>

            <div className="messages-scroll">
              {isExternal && (
                <div className="external-disclaimer">
                  <ShieldAlert size={16} />
                  <span>This synchronization includes participants from outside your organization. Please ensure all shared content complies with organizational data policies.</span>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isSent = msg.senderId === 'currentUser';
                const prevMsg = messages[idx - 1];
                const isGrouped = prevMsg && prevMsg.senderId === msg.senderId;
                const senderParticipant = activeChat.participants.find(p => p.id === msg.senderId);
                const isLast = idx === messages.length - 1;
                const isExpanded = expandedMessageId === msg.id;

                return (
                  <div 
                    key={msg.id} 
                    className={`message-group ${isSent ? 'sent' : 'received'} ${isGrouped ? 'grouped' : 'first-in-group'} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                  >
                    {!isSent && activeChat.type === ConversationType.GROUP && !isGrouped && (
                      <img src={senderParticipant?.avatar} alt="" className="message-avatar" />
                    )}
                    <div className="message-bubble-wrapper">
                      {!isSent && !isGrouped && activeChat.type === ConversationType.GROUP && (
                        <div className="message-sender-name">{senderParticipant?.name}</div>
                      )}
                      <div className={`message-bubble ${msg.images?.length && !msg.text ? 'image-only' : ''}`}>
                        {renderMessageImages(msg.images)}
                        {msg.text && <div className="text-content">{msg.text}</div>}
                      </div>
                      {(isLast || isExpanded) && (
                        <div className="message-meta-interactive">
                          <span className="time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isSent && getStatusIcon(msg.status)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              {selectedImages.length > 0 && (
                <div className="selected-images-preview">
                  {selectedImages.map((url, i) => (
                    <div key={i} className="preview-item">
                      <img src={url} alt="" />
                      <button className="remove-preview" onClick={() => removeSelectedImage(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="chat-input-container">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  style={{ display: 'none' }} 
                />
                <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder={selectedImages.length > 0 ? "Add a message..." : "Sync a message..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="icon-btn"><Smile size={20} /></button>
                <button className="send-btn" onClick={handleSendMessage}>
                  <Send size={18} />
                </button>
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
