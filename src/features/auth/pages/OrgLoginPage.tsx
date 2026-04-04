import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  LogIn, 
  Building2, 
  User,
  Eye, 
  EyeOff, 
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { setUser, type UserRole } from '../../../store/slices/userSlice';
import { authService } from '../api/auth.service';
import './Login.css';

export const OrgLoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    organizationId: '',
    username: '',
    password: ''
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

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
        organizationId: formData.organizationId
      });

      if (response.success && response.data) {
        const { userId, userRole, accessToken, username } = response.data as any;
        dispatch(setUser({
          id: userId,
          username: username || formData.username,
          email: formData.username.includes('@') ? formData.username : '',
          role: userRole as UserRole,
          token: accessToken
        }));
        navigate('/');
      } else {
        setErrorMsg(response.message || 'Access denied. Please verify your workspace and credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Unauthorized access. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Pane - Info */}
        <div className="login-info-pane workspace">
          <div className="brand-header">
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
        </div>

        {/* Right Pane - Form */}
        <div className="login-form-pane">
          <header className="form-header">
            <h2>Enter Workspace</h2>
            <p>Sign in to your organization to manage shared curated flows.</p>
          </header>

          <div className="login-type-link">
            <Link to="/login" className="switch-to-personal">
              <User size={16} />
              <span>Personal curator? Return to Standalone Login</span>
            </Link>
          </div>

          {errorMsg && (
            <div className="login-error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>ORGANIZATION ID</label>
              <div className="input-wrapper has-icon">
                <input 
                  name="organizationId"
                  type="text" 
                  placeholder="ORG-NAME-123" 
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  required 
                />
                <Building2 size={18} className="input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>USERNAME OR EMAIL</label>
              <div className="input-wrapper has-icon">
                <input 
                  name="username"
                  type="text" 
                  placeholder="alex@org.example" 
                  value={formData.username}
                  onChange={handleInputChange}
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
                  placeholder="••••••••" 
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

            <button type="submit" className="login-submit-btn workspace-btn" disabled={isLoading}>
              {isLoading ? 'Accessing Workspace...' : 'Sign In to Workspace'}
              {!isLoading && <LogIn size={20} style={{ marginLeft: '8px' }} />}
            </button>
          </form>

          <footer className="form-footer">
            <p>Don't have a workspace? <Link to="/contact">Contact Administration</Link></p>
          </footer>
          
          <div className="security-badge">
            <ShieldCheck size={16} color="#059669" />
            <span>SECURED BY SYNCIO ENCRYPTION</span>
          </div>
        </div>
      </div>
    </div>
  );
};
