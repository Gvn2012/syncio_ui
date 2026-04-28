import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Conversation, MessageResponse } from '../../features/messages/types';
import { MessagesService } from '../../features/messages/api/messages.service';
import type { RootState } from '../index';

interface PaginationState {
  hasMore: boolean;
  loadingMore: boolean;
}

interface MessagingState {
  conversations: Conversation[];
  messagesByConversation: Record<string, MessageResponse[]>;
  paginationByConversation: Record<string, PaginationState>;
  activeConversationId: string | null;
  onlineUsers: Record<string, boolean>;
  typingUsers: Record<string, string[]>;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  totalUnreadCount: number;
  userId: string | null;
}

const initialState: MessagingState = {
  conversations: [],
  messagesByConversation: {},
  paginationByConversation: {},
  activeConversationId: null,
  onlineUsers: {},
  typingUsers: {},
  loading: false,
  error: null,
  isConnected: false,
  totalUnreadCount: 0,
  userId: null,
};

export const fetchConversations = createAsyncThunk(
  'messaging/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await MessagesService.getConversations();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Failed to fetch conversations');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTotalUnreadCount = createAsyncThunk(
  'messaging/fetchTotalUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await MessagesService.getTotalUnreadCount();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Failed to fetch unread count');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async ({ conversationId, size }: { conversationId: string; size?: number }, { rejectWithValue }) => {
    try {
      const response = await MessagesService.getMessages({ conversationId, size: size ?? 30 });
      if (response.success) {
        return { conversationId, messages: response.data, size: size ?? 30 };
      }
      return rejectWithValue(response.message || 'Failed to fetch messages');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOlderMessages = createAsyncThunk(
  'messaging/fetchOlderMessages',
  async ({ conversationId, size }: { conversationId: string; size?: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { messaging: MessagingState };
      const messages = state.messaging.messagesByConversation[conversationId] || [];
      // The first message in our state is the oldest (since we prepend)
      const oldestMessage = messages[0];
      const before = oldestMessage ? oldestMessage.timestamp : undefined;
      const pageSize = size ?? 30;

      const response = await MessagesService.getMessages({ conversationId, before, size: pageSize });
      if (response.success) {
        return { conversationId, messages: response.data, size: pageSize };
      }
      return rejectWithValue(response.message || 'Failed to fetch older messages');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const recallMessage = createAsyncThunk(
  'messaging/recallMessage',
  async (messageId: string, { rejectWithValue }) => {
    try {
      const response = await MessagesService.recallMessage(messageId);
      if (response.success) return messageId;
      return rejectWithValue(response.message);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messaging/deleteMessage',
  async ({ conversationId, messageId }: { conversationId: string, messageId: string }, { rejectWithValue }) => {
    try {
      const response = await MessagesService.deleteMessage(messageId);
      if (response.success) return { conversationId, messageId };
      return rejectWithValue(response.message);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<MessageResponse>) => {
      const { conversationId, senderId } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      const index = state.messagesByConversation[conversationId].findIndex(m => m.id === action.payload.id);
      
      const conv = state.conversations.find(c => c.id === conversationId);
      
      if (index === -1) {
        state.messagesByConversation[conversationId].push(action.payload);
        if (conv) {
          conv.lastMessage = action.payload;
          // Don't increment unread count if conversation is active OR message is from current user
          if (state.activeConversationId !== conversationId && senderId !== state.userId) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
            state.totalUnreadCount++;
          }
        }
      } else {
        state.messagesByConversation[conversationId][index] = action.payload;
        if (conv) {
          conv.lastMessage = action.payload;
        }
      }
    },
    updateMessageStatus: (state, action: PayloadAction<{ messageIds?: string[], messageId?: string; conversationId: string; userId: string; status: any }>) => {
      const { messageIds, messageId, conversationId, userId, status } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        const idsToUpdate = messageIds || (messageId ? [messageId] : []);
        idsToUpdate.forEach(id => {
          const msg = messages.find(m => m.id === id);
          if (msg) {
            if (!msg.status) msg.status = {};
            msg.status[userId] = { status, updateTime: new Date().toISOString() } as any;
          }
        });
      }
    },
    updateMessageContent: (state, action: PayloadAction<MessageResponse>) => {
      const { id, conversationId, content, isEdited, isRecalled } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        const msg = messages.find(m => m.id === id);
        if (msg) {
          msg.content = content;
          msg.isEdited = isEdited;
          msg.isRecalled = isRecalled;
        }
      }
      
      const conv = state.conversations.find(c => c.id === conversationId);
      if (conv && conv.lastMessage && conv.lastMessage.id === id) {
        conv.lastMessage.content = content;
        conv.lastMessage.isEdited = isEdited;
        conv.lastMessage.isRecalled = isRecalled;
      }
    },
    removeMessage: (state, action: PayloadAction<{ conversationId: string, messageId: string }>) => {
      const { conversationId, messageId } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        state.messagesByConversation[conversationId] = messages.filter(m => m.id !== messageId);
      }
    },
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      if (!state.conversations.find(c => c.id === action.payload.id)) {
        state.conversations.unshift(action.payload);
      }
    },
    setUserPresence: (state, action: PayloadAction<{ userId: string, status: 'ONLINE' | 'OFFLINE' }>) => {
      state.onlineUsers[action.payload.userId] = action.payload.status === 'ONLINE';
    },
    setTyping: (state, action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId);
      }
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      delete state.messagesByConversation[action.payload];
      delete state.paginationByConversation[action.payload];
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = null;
      }
    },
    markConversationAsRead: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find(c => c.id === action.payload);
      if (conv) {
        state.totalUnreadCount = Math.max(0, state.totalUnreadCount - (conv.unreadCount || 0));
        conv.unreadCount = 0;
      }
    },
    setUserId: (state, action: PayloadAction<string | null>) => {
      state.userId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTotalUnreadCount.fulfilled, (state, action) => {
        state.totalUnreadCount = action.payload;
      })
      .addCase(fetchConversations.pending, (state) => {
        if (state.conversations.length === 0) {
          state.loading = true;
        }
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        const updatedConversations = action.payload;
        
        const existingMap = new Map(state.conversations.map(c => [c.id, c]));
        
        state.conversations = updatedConversations.map(newConv => {
          const existing = existingMap.get(newConv.id);
          if (existing) {
            
            return { ...existing, ...newConv };
          }
          return newConv;
        });
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages, size } = action.payload;
        state.messagesByConversation[conversationId] = [...messages].reverse(); 
        state.paginationByConversation[conversationId] = {
          hasMore: messages.length >= size,
          loadingMore: false,
        };
      })
      .addCase(fetchOlderMessages.pending, (state, action) => {
        const conversationId = action.meta.arg.conversationId;
        if (state.paginationByConversation[conversationId]) {
          state.paginationByConversation[conversationId].loadingMore = true;
        }
      })
      .addCase(fetchOlderMessages.fulfilled, (state, action) => {
        const { conversationId, messages, size } = action.payload;
        const existing = state.messagesByConversation[conversationId] || [];
        const reversed = [...messages].reverse();
        const existingIds = new Set(existing.map(m => m.id));
        const newMessages = reversed.filter(m => !existingIds.has(m.id));
        state.messagesByConversation[conversationId] = [...newMessages, ...existing];
        state.paginationByConversation[conversationId] = {
          hasMore: messages.length >= size,
          loadingMore: false,
        };
      })
      .addCase(fetchOlderMessages.rejected, (state, action) => {
        const conversationId = action.meta.arg.conversationId;
        if (state.paginationByConversation[conversationId]) {
          state.paginationByConversation[conversationId].loadingMore = false;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { conversationId, messageId } = action.payload;
        if (state.messagesByConversation[conversationId]) {
          state.messagesByConversation[conversationId] = state.messagesByConversation[conversationId]
            .filter(m => m.id !== messageId);
        }
      });
  },
});

export const { 
  setTyping, 
  setUserPresence, 
  setConnectionStatus, 
  addMessage, 
  updateMessageStatus, 
  updateMessageContent,
  removeMessage,
  setConversations, 
  addConversation, 
  removeConversation,
  setActiveConversation,
  markConversationAsRead,
  setUserId
} = messagingSlice.actions;

export const selectTotalUnreadCount = (state: RootState) => state.messaging.totalUnreadCount;

export default messagingSlice.reducer;
