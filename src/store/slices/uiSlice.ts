import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';
export type AlertType = 'error' | 'success' | 'info' | 'warning';

interface UIState {
  theme: ThemeMode;
  language: 'en' | 'vi' | 'zh';
  isSidebarOpen: boolean;
  activeLightboxImage: string | null;
  lightboxImages: string[];
  activeLightboxIndex: number;
  alert: {
    message: string | null;
    type: AlertType;
    isVisible: boolean;
    title?: string;
  };
  modal: {
    isOpen: boolean;
    type: string | null;
    data: any | null;
  };
}

const initialState: UIState = {
  theme: 'light',
  language: 'en',
  isSidebarOpen: true,
  activeLightboxImage: null,
  lightboxImages: [],
  activeLightboxIndex: 0,
  alert: {
    message: null,
    type: 'error',
    isVisible: false,
  },
  modal: {
    isOpen: false,
    type: null,
    data: null,
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
      if (action.payload) {
        state.lightboxImages = [action.payload];
        state.activeLightboxIndex = 0;
      } else {
        state.lightboxImages = [];
        state.activeLightboxIndex = 0;
      }
    },
    openLightbox: (state, action: PayloadAction<{ images: string[]; index?: number }>) => {
      state.lightboxImages = action.payload.images;
      state.activeLightboxIndex = action.payload.index || 0;
      state.activeLightboxImage = action.payload.images[state.activeLightboxIndex];
    },
    closeLightbox: (state) => {
      state.activeLightboxImage = null;
      state.lightboxImages = [];
      state.activeLightboxIndex = 0;
    },
    nextLightboxImage: (state) => {
      if (state.lightboxImages && state.lightboxImages.length > 0) {
        state.activeLightboxIndex = (state.activeLightboxIndex + 1) % state.lightboxImages.length;
        state.activeLightboxImage = state.lightboxImages[state.activeLightboxIndex];
      }
    },
    prevLightboxImage: (state) => {
      if (state.lightboxImages && state.lightboxImages.length > 0) {
        state.activeLightboxIndex = (state.activeLightboxIndex - 1 + state.lightboxImages.length) % state.lightboxImages.length;
        state.activeLightboxImage = state.lightboxImages[state.activeLightboxIndex];
      }
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
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      if (!state.modal) {
        state.modal = { isOpen: false, type: null, data: null };
      }
      state.modal.isOpen = true;
      state.modal.type = action.payload.type;
      state.modal.data = action.payload.data;
    },
    closeModal: (state) => {
      if (!state.modal) {
        state.modal = { isOpen: false, type: null, data: null };
      }
      state.modal.isOpen = false;
      state.modal.type = null;
      state.modal.data = null;
    },
  },
});

export const { 
  toggleTheme, 
  setTheme, 
  setLanguage, 
  toggleSidebar, 
  setLightboxImage,
  openLightbox,
  closeLightbox,
  nextLightboxImage,
  prevLightboxImage,
  showError,
  showSuccess,
  showAlert,
  hideAlert,
  openModal,
  closeModal
} = uiSlice.actions;


export const hideError = hideAlert;
export default uiSlice.reducer;
