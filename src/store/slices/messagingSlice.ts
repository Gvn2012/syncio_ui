import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Conversation, MessageResponse } from '../../features/messages/types';
import { MessagesService } from '../../features/messages/api/messages.service';

interface MessagingState {
  conversations: Conversation[];
  messagesByConversation: Record<string, MessageResponse[]>;
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: MessagingState = {
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  loading: false,
  error: null,
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

export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async ({ conversationId, page, size }: { conversationId: string; page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await MessagesService.getMessages({ conversationId, page, size });
      if (response.success) {
        return { conversationId, messages: response.data };
      }
      return rejectWithValue(response.message || 'Failed to fetch messages');
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
      const { conversationId } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      const exists = state.messagesByConversation[conversationId].some(m => m.id === action.payload.id);
      if (!exists) {
        state.messagesByConversation[conversationId].push(action.payload);
      }
            const conv = state.conversations.find(c => c.id === conversationId);
      if (conv) {
        conv.lastMessage = action.payload;
        // Move to top of list
        state.conversations = [conv, ...state.conversations.filter(c => c.id !== conversationId)];
      }
    },
    updateMessageStatus: (state, action: PayloadAction<{ messageId: string; conversationId: string; userId: string; status: any }>) => {
      const { messageId, conversationId, userId, status } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        const msg = messages.find(m => m.id === messageId);
        if (msg) {
          if (!msg.status) msg.status = {};
          msg.status[userId] = status;
        }
      }
    },
    updateMessageContent: (state, action: PayloadAction<MessageResponse>) => {
      const { id, conversationId, content, isEdited, isDeleted } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        const msg = messages.find(m => m.id === id);
        if (msg) {
          msg.content = content;
          msg.isEdited = isEdited;
          msg.isDeleted = isDeleted;
        }
      }
    },
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      if (!state.conversations.find(c => c.id === action.payload.id)) {
        state.conversations.unshift(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        state.messagesByConversation[conversationId] = messages.reverse(); // Backend usually returns newest first, we want oldest first for chat flow
      });
  },
});

export const { 
  setActiveConversation, 
  addMessage, 
  updateMessageStatus, 
  updateMessageContent, 
  setConversations,
  addConversation
} = messagingSlice.actions;

export default messagingSlice.reducer;
