import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

interface UIState {
  theme: ThemeMode;
  language: 'en' | 'vi' | 'zh';
  isSidebarOpen: boolean;
  activeLightboxImage: string | null;
}

const initialState: UIState = {
  theme: 'light',
  language: 'en',
  isSidebarOpen: true,
  activeLightboxImage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'en' | 'vi' | 'zh'>) => {
      state.language = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setLightboxImage: (state, action: PayloadAction<string | null>) => {
      state.activeLightboxImage = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, setLanguage, toggleSidebar, setLightboxImage } = uiSlice.actions;
export default uiSlice.reducer;
