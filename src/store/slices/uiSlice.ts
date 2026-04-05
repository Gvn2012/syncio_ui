import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

interface UIState {
  theme: ThemeMode;
  language: 'en' | 'vi' | 'zh';
  isSidebarOpen: boolean;
  activeLightboxImage: string | null;
  globalError: {
    message: string | null;
    isVisible: boolean;
  };
}

const initialState: UIState = {
  theme: 'light',
  language: 'en',
  isSidebarOpen: true,
  activeLightboxImage: null,
  globalError: {
    message: null,
    isVisible: false,
  },
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
    showError: (state, action: PayloadAction<string>) => {
      state.globalError.message = action.payload;
      state.globalError.isVisible = true;
    },
    hideError: (state) => {
      state.globalError.isVisible = false;
    },
  },
});

export const { 
  toggleTheme, 
  setTheme, 
  setLanguage, 
  toggleSidebar, 
  setLightboxImage,
  showError,
  hideError
} = uiSlice.actions;
export default uiSlice.reducer;
