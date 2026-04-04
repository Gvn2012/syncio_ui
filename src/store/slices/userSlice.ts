import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'User' | 'Admin' | null;

interface UserState {
  id: string | null;
  username: string | null;
  email: string | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: null,
  username: null,
  email: null,
  role: null,
  token: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; username: string; email: string; role: UserRole; token: string }>) => {
      state.id = action.payload.id;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.id = null;
      state.username = null;
      state.email = null;
      state.role = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload;
    },
  },
});

export const { setUser, logout, setRole } = userSlice.actions;
export default userSlice.reducer;
