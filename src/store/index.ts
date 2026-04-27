import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import preferencesReducer from './slices/preferencesSlice';
import notificationReducer from './slices/notificationSlice';
import messagingReducer from './slices/messagingSlice';

const messagingPersistConfig = {
  key: 'messaging',
  storage,
  blacklist: ['activeConversationId'],
};

const rootReducer = combineReducers({
  user: userReducer,
  ui: uiReducer,
  preferences: preferencesReducer,
  notification: notificationReducer,
  messaging: persistReducer(messagingPersistConfig, messagingReducer),
});

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['user', 'ui', 'preferences', 'notification'], // messaging is now handled separately
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
