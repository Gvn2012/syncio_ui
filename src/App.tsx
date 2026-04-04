import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, type RootState } from './store';
import { Layout } from './components/Layout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { OrgLoginPage } from './features/auth/pages/OrgLoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.user);
  
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.user);
  
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const Dashboard = () => {
  const { role } = useSelector((state: RootState) => state.user);
  
  return (
    <Layout>
      <div className="feed-view">
        <header className="page-header">
          <h2>{role === 'Admin' ? 'Admin Overview' : 'Sync Feed'}</h2>
          <p>Welcome back! Here's what's happening in your curated workspace.</p>
        </header>
        
        <div className="feed-grid">
          <div className="empty-state">
            <div className="empty-illustration"></div>
            <h3>Your feed is empty</h3>
            <p>Ready to sync? Create your first sync to start the conversation.</p>
            <button className="primary-btn">Create a Sync</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Routes>
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
                  <OrgLoginPage />
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
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;
