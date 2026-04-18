import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, type RootState } from './store';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { FeedScreen } from './features/feed/pages/FeedScreen';
import { PollsPage } from './features/polls/pages/PollsPage';
import { TasksPage } from './features/tasks/pages/TasksPage';
import { AnnouncementsPage } from './features/announcements/pages/AnnouncementsPage';
import { ProfileScreen } from './features/user/pages/ProfileScreen';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { OrganizationScreen } from './features/org/pages/OrganizationScreen';
import { CreatePostScreen } from './features/feed/pages/CreatePostScreen';
import { MessagesPage } from './features/messages/pages/MessagesPage';
import { PeoplePage } from './features/user/pages/PeoplePage';
import { ImageLightbox } from './components/ImageLightbox';
import { GlobalTooltip } from './components/GlobalTooltip';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const location = useLocation();
  
  const isAuthRoute = (path: string) => path.startsWith('/login') || path === '/register';
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={isAuthRoute(location.pathname) ? "auth" : location.pathname}>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login/org" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <FeedScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:userId?" 
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizations" 
          element={
            <ProtectedRoute>
              <OrganizationScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/polls" 
          element={
            <ProtectedRoute>
              <PollsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-post" 
          element={
            <ProtectedRoute>
              <CreatePostScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/announcements" 
          element={
            <ProtectedRoute>
              <AnnouncementsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/people" 
          element={
            <ProtectedRoute>
              <PeoplePage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

import { GlobalError } from './components/GlobalError';

function AppContent() {
  const { theme } = useSelector((state: RootState) => state.ui);
  
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <AppRoutes />
      <GlobalError />
      <ImageLightbox />
      <GlobalTooltip />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;
