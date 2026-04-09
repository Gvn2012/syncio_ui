import { createSlice, type PayloadAction } from '@reduxjs/toolkit';


interface UserState {
  id: string | null;
  username: string | null;
  role: String[];
  token: string | null;
  isAuthenticated: boolean;
  orgId: string | null;
}

const initialState: UserState = {
  id: null,
  username: null,
  role: [],
  token: null,
  isAuthenticated: false,
  orgId: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; username: string; role: String[]; token: string; orgId: string }>) => {
      state.id = action.payload.id;
      state.username = action.payload.username;
      state.role = action.payload.role;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.orgId = action.payload.orgId;
    },
    logout: (state) => {
      state.id = null;
      state.username = null;
      state.role = [];
      state.token = null;
      state.isAuthenticated = false;
      state.orgId = null;
    },
    setRole: (state, action: PayloadAction<String[]>) => {
      state.role = action.payload;
    },
    setOrgId: (state, action: PayloadAction<string>) => {
      state.orgId = action.payload;
    }
  },
});

export const { setUser, logout, setRole } = userSlice.actions;
export default userSlice.reducer;
