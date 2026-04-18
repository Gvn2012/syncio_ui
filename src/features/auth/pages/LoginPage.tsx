import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  LogIn, 
  User, 
  Building2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { setUser} from '../../../store/slices/userSlice';
import { authService } from '../api/auth.service';
import './Login.css';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isWorkspace = location.pathname === '/login/org';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    organizationId: '',
    username: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await authService.login({
        username: formData.username,
        password: formData.password,
        organizationId: isWorkspace ? formData.organizationId : undefined
      });

      if (response.success && response.data) {
        const { userId, userRole, username, orgId } = response.data as any;
        dispatch(setUser({
          id: userId,
          username: username || formData.username,
          role: userRole as String[],
          orgId
        }));
        navigate('/');
      } else {
        setErrorMsg(
          'Verification failed. Please check your credentials.'
        );
      }
    } catch (err: any) {
      setErrorMsg(
        'Unauthorized access. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div 
        layout
        className={`login-container ${isWorkspace ? 'reversed' : ''}`}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        {/* Info Pane - Animated Switch */}
        <motion.div 
          layout
          className={`login-info-pane ${isWorkspace ? 'workspace' : 'personal'}`}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <AnimatePresence mode="wait">
            {!isWorkspace ? (
              <motion.div 
                key="personal-info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="info-inner"
              >
                <div 
                  className="brand-header"
                  data-tooltip="Personal Editorial Curation Hub"
                  data-tooltip-position="bottom"
                  style={{ cursor: 'pointer' }}
                >
                  <RefreshCw size={32} color="#ffffff" />
                  <span className="brand-name">SyncIO</span>
                </div>
                
                <div className="info-content">
                  <h1>Personal Curation</h1>
                  <p>
                    Your standalone hub for high-end editorial curation. 
                    Log in to your private workspace and sync your digital ecosystem.
                  </p>
                </div>
                
                <div className="info-footer">
                  <div className="user-avatars">
                    <img src="https://ui-avatars.com/api/?name=P&background=0ea5e9&color=fff" alt="User" />
                    <img src="https://ui-avatars.com/api/?name=S&background=0f172a&color=fff" alt="User" />
                    <img src="https://ui-avatars.com/api/?name=X&background=64748b&color=fff" alt="User" />
                    <span className="user-count">+2k personal curators</span>
                  </div>
                  <p className="footer-text">The premium private space for data curators.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="workspace-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="info-inner"
              >
                <div 
                  className="brand-header"
                  data-tooltip="Enterprise Workspace & Team Sync"
                  data-tooltip-position="bottom"
                  style={{ cursor: 'pointer' }}
                >
                  <RefreshCw size={32} color="#ffffff" />
                  <span className="brand-name">SyncIO</span>
                </div>
                
                <div className="info-content">
                  <h1>Workspace Access</h1>
                  <p>
                    Collaborative editorial curation for enterprises and organizations.
                    Enter your workspace ID to sync with your team's ecosystem.
                  </p>
                </div>
                
                <div className="info-footer">
                  <div className="user-avatars">
                    <img src="https://ui-avatars.com/api/?name=ORG&background=d97706&color=fff" alt="User" />
                    <img src="https://ui-avatars.com/api/?name=TEAM&background=0284c7&color=fff" alt="User" />
                    <img src="https://ui-avatars.com/api/?name=HQ&background=7c3aed&color=fff" alt="User" />
                    <span className="user-count">+500 enterprise workspaces</span>
                  </div>
                  <p className="footer-text">The professional standard for large-scale data synchronization.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Form Pane */}
        <motion.div layout className="login-form-pane">
          <header className="form-header">
            <h2>{isWorkspace ? 'Enter Workspace' : 'Sign In'}</h2>
            <p>
              {isWorkspace 
                ? 'Sign in to your organization to manage shared curated flows.' 
                : 'Enter your credentials to access your personal hub.'}
            </p>
          </header>

          <div className="login-type-link">
            {isWorkspace ? (
              <Link to="/login" className="switch-to-org">
                <ArrowLeft size={16} />
                <span>Personal curator? Go to Standalone Login</span>
              </Link>
            ) : (
              <Link to="/login/org" className="switch-to-org">
                <Building2 size={16} />
                <span>Logging into a workspace? Go to Org Login</span>
              </Link>
            )}
          </div>

          {errorMsg && (
            <div className="login-error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin}>
            {isWorkspace && (
              <div className="form-group">
                <label>ORGANIZATION ID</label>
                <div className="input-wrapper has-icon">
                  <input 
                    name="organizationId"
                    type="text" 
                    placeholder="Enter Workspace ID" 
                    value={formData.organizationId}
                    onChange={handleInputChange}
                    required 
                  />
                  <Building2 size={18} className="input-icon" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>USERNAME OR EMAIL</label>
              <div className="input-wrapper has-icon">
                <input 
                  name="username"
                  type="text" 
                  placeholder={isWorkspace ? "name@company.com" : "Enter username or email"} 
                  value={formData.username}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required 
                />
                <User size={18} className="input-icon" />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>PASSWORD</label>
                <button type="button" className="forgot-password-btn">Forgot Password?</button>
              </div>
              <div className="input-wrapper">
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter Password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required 
                />
                <button 
                  type="button" 
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Keep me synced for 30 days</span>
              </label>
            </div>

            <button type="submit" className={`login-submit-btn ${isWorkspace ? 'workspace-btn' : ''}`} disabled={isLoading}>
              {isLoading 
                ? (isWorkspace ? 'Accessing Workspace...' : 'Accessing Hub...') 
                : (isWorkspace ? 'Sign In to Workspace' : 'Sign In to Hub')
              }
              {!isLoading && <LogIn size={20} style={{ marginLeft: '8px' }} />}
            </button>
          </form>

          <footer className="form-footer">
            <p>New to SyncIO? <Link to="/register">Create an account</Link></p>
          </footer>
          
          <div className="security-badge">
            <ShieldCheck size={16} color="#059669" />
            <span>SECURED BY SYNCIO ENCRYPTION</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
