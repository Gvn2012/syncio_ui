import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { UserDetailResponse } from '../../features/user/types';
import { UserService } from '../../features/user/api/user.service';


interface UserState {
  id: string | null;
  username: string | null;
  role: String[];
  isAuthenticated: boolean;
  orgId: string | null;
  userDetail: UserDetailResponse | null;
  userDetailLoading: boolean;
  userDetailError: string | null;
}

const initialState: UserState = {
  id: null,
  username: null,
  role: [],
  isAuthenticated: false,
  orgId: null,
  userDetail: null,
  userDetailLoading: false,
  userDetailError: null,
};


export const fetchUserDetail = createAsyncThunk(
  'user/fetchUserDetail',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await UserService.getUserDetail(userId);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Failed to fetch user detail');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Network error';
      return rejectWithValue(message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; username: string; role: String[]; orgId: string }>) => {
      state.id = action.payload.id;
      state.username = action.payload.username;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.orgId = action.payload.orgId;
    },
    logout: (state) => {
      state.id = null;
      state.username = null;
      state.role = [];
      state.isAuthenticated = false;
      state.orgId = null;
      state.userDetail = null;
      state.userDetailLoading = false;
      state.userDetailError = null;
    
    },
    setRole: (state, action: PayloadAction<String[]>) => {
      state.role = action.payload;
    },
    setOrgId: (state, action: PayloadAction<string>) => {
      state.orgId = action.payload;
    },
    clearUserDetail: (state) => {
      state.userDetail = null;
      state.userDetailLoading = false;
      state.userDetailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDetail.pending, (state) => {
        state.userDetailLoading = true;
        state.userDetailError = null;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.userDetailLoading = false;
        state.userDetail = action.payload;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.userDetailLoading = false;
        state.userDetailError = action.payload as string;
      });
  },
});

export const { setUser, logout, setRole, setOrgId, clearUserDetail } = userSlice.actions;
export default userSlice.reducer;
