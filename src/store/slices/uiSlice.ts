import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';
export type AlertType = 'error' | 'success' | 'info' | 'warning';

interface UIState {
  theme: ThemeMode;
  language: 'en' | 'vi' | 'zh';
  isSidebarOpen: boolean;
  activeLightboxImage: string | null;
  alert: {
    message: string | null;
    type: AlertType;
    isVisible: boolean;
    title?: string;
  };
}

const initialState: UIState = {
  theme: 'light',
  language: 'en',
  isSidebarOpen: true,
  activeLightboxImage: null,
  alert: {
    message: null,
    type: 'error',
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
    showError: (state, action: PayloadAction<string | { message: string; title?: string }>) => {
      if (!state.alert) state.alert = { ...initialState.alert };
      const payload = typeof action.payload === 'string' 
        ? { message: action.payload, title: 'SYSTEM ERROR' } 
        : { message: action.payload.message, title: action.payload.title || 'SYSTEM ERROR' };
      
      state.alert.message = payload.message;
      state.alert.title = payload.title;
      state.alert.type = 'error';
      state.alert.isVisible = true;
    },
    showSuccess: (state, action: PayloadAction<string>) => {
      if (!state.alert) state.alert = { ...initialState.alert };
      state.alert.message = action.payload;
      state.alert.type = 'success';
      state.alert.title = 'SUCCESS';
      state.alert.isVisible = true;
    },
    showAlert: (state, action: PayloadAction<{ message: string; type: AlertType; title?: string }>) => {
      if (!state.alert) state.alert = { ...initialState.alert };
      state.alert.message = action.payload.message;
      state.alert.type = action.payload.type;
      state.alert.title = action.payload.title || action.payload.type.toUpperCase();
      state.alert.isVisible = true;
    },
    hideAlert: (state) => {
      if (state.alert) {
        state.alert.isVisible = false;
      }
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
  showSuccess,
  showAlert,
  hideAlert
} = uiSlice.actions;


export const hideError = hideAlert;
export default uiSlice.reducer;
