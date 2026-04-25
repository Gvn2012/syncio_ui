import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, type RootState } from './store';
import { Layout } from './components/Layout';
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
import { SyncDetailScreen } from './features/feed/pages/SyncDetailScreen';
import { ImageLightbox } from './components/ImageLightbox';
import { GlobalTooltip } from './components/GlobalTooltip';
import { useLocation, useSearchParams } from 'react-router-dom';
import { GlobalError } from './components/GlobalError';
import { DetailedReactionsModal } from './features/feed/components/sub/DetailedReactionsModal';
import { closeModal, openModal } from './store/slices/uiSlice';
import { useDispatch } from 'react-redux';
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
  
  return (
    <Routes location={location}>
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
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<FeedScreen />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile/:userId?" element={<ProfileScreen />} />
        <Route path="/organizations" element={<OrganizationScreen />} />
        <Route path="/polls" element={<PollsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/create-post" element={<CreatePostScreen />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/sync/:postId" element={<SyncDetailScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const dispatch = useDispatch();
  const ui = useSelector((state: RootState) => state.ui);
  const theme = ui?.theme || 'light';
  const modal = ui?.modal || { isOpen: false, type: null, data: null };
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const reactionsPostId = searchParams.get('reactions');
    if (reactionsPostId && !modal.isOpen) {
      dispatch(openModal({ type: 'REACTIONS', data: { postId: reactionsPostId } }));
    }
  }, [searchParams, modal.isOpen, dispatch]);

  const handleCloseReactions = () => {
    dispatch(closeModal());
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('reactions');
      newParams.delete('type');
      return newParams;
    }, { replace: true });
  };

 
  React.useEffect(() => {
    if (modal.isOpen) {
      dispatch(closeModal());
    }
  }, [pathname, dispatch]);

  return (
    <>
      <AppRoutes />
      <GlobalError />
      <ImageLightbox />
      <GlobalTooltip />
      <DetailedReactionsModal 
        isOpen={modal.isOpen && modal.type === 'REACTIONS'}
        postId={modal.data?.postId}
        onClose={handleCloseReactions}
      />
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
