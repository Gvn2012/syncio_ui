import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { NotificationService } from '../../features/notification/api/notification.service';
import type { GetUserNotificationResponse } from '../../features/notification/api/types';

interface NotificationState {
  unreadCount: number;
  notifications: GetUserNotificationResponse[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  page: number;
  hasNextPage: boolean;
}

const initialState: NotificationState = {
  unreadCount: 0,
  notifications: [],
  loading: false,
  loadingMore: false,
  error: null,
  page: 0,
  hasNextPage: false,
};

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await NotificationService.getUnreadNotifications({ page: 0, size: 1 });
      return response.data.totalElements;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread count');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params: { page: number; size: number }, { rejectWithValue }) => {
    try {
      const response = await NotificationService.getNotifications(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchNotifications.pending, (state, action) => {
        const isInitialPage = action.meta.arg.page === 0;
        if (isInitialPage) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { content, page, hasNext } = action.payload;
        
        if (page === 0) {
          state.notifications = content;
        } else {
          state.notifications = [...state.notifications, ...content];
        }
        
        state.page = page;
        state.hasNextPage = hasNext;
        state.loading = false;
        state.loadingMore = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUnreadCount, decrementUnreadCount, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
