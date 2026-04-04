import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  LogIn, 
  User, 
  Building2, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { setUser, type UserRole } from '../../../store/slices/userSlice';
import { authService } from '../api/auth.service';
import './Login.css';

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'member' | 'standalone'>('member');
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
        organizationId: loginType === 'member' ? formData.organizationId : undefined
      });

      if (response.success && response.data) {
        const { userId, userRole, accessToken, username } = response.data as any; // Adjust if schema evolves
        dispatch(setUser({
          id: userId,
          username: username || formData.username,
          email: formData.username.includes('@') ? formData.username : '',
          role: userRole as UserRole,
          token: accessToken
        }));
        navigate('/');
      } else {
        setErrorMsg(response.message || 'Login failed. Please try again.');
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
        <div className="login-info-pane">
          <div className="brand-header">
            <RefreshCw size={32} color="#ffffff" />
            <span className="brand-name">SyncIO</span>
          </div>
          
          <div className="info-content">
            <h1>The Digital Curator</h1>
            <p>
              Experience a sophisticated, breathable canvas designed for high-end 
              editorial curation and seamless data synchronization.
            </p>
          </div>
          
          <div className="info-footer">
            <div className="user-avatars">
              <img src="https://ui-avatars.com/api/?name=A&background=random" alt="User" />
              <img src="https://ui-avatars.com/api/?name=B&background=random" alt="User" />
              <img src="https://ui-avatars.com/api/?name=C&background=random" alt="User" />
              <span className="user-count">+2,500 curators</span>
            </div>
            <p className="footer-text">Joined by over 2,500+ global curators today.</p>
          </div>
        </div>

        {/* Right Pane - Form */}
        <div className="login-form-pane">
          <header className="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to manage your digital ecosystem.</p>
          </header>

          <div className="login-type-selector">
            <button 
              className={`type-btn ${loginType === 'member' ? 'active' : ''}`}
              onClick={() => setLoginType('member')}
            >
              <div className="type-icon"><Building2 size={20} /></div>
              <div className="type-text">
                <span className="type-title">ORG MEMBER</span>
                <span className="type-desc">Access company workspace</span>
              </div>
            </button>
            <button 
              className={`type-btn ${loginType === 'standalone' ? 'active' : ''}`}
              onClick={() => setLoginType('standalone')}
            >
              <div className="type-icon"><User size={20} /></div>
              <div className="type-text">
                <span className="type-title">STANDALONE</span>
                <span className="type-desc">Personal curation account</span>
              </div>
            </button>
          </div>

          {errorMsg && (
            <div className="login-error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin}>
            {loginType === 'member' && (
              <div className="form-group">
                <label>ORGANIZATION ID</label>
                <div className="input-wrapper">
                  <input 
                    name="organizationId"
                    type="text" 
                    placeholder="SYNC-12345" 
                    value={formData.organizationId}
                    onChange={handleInputChange}
                    required={loginType === 'member'}
                  />
                  <Building2 size={18} className="input-icon" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>USERNAME OR EMAIL</label>
              <div className="input-wrapper">
                <input 
                  name="username"
                  type="text" 
                  placeholder="alex@digitalcurator.com" 
                  value={formData.username}
                  onChange={handleInputChange}
                  required 
                />
                <span className="input-icon">@</span>
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

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? 'Synchronizing...' : 'Sign In to Workspace'}
              {!isLoading && <LogIn size={20} style={{ marginLeft: '8px' }} />}
            </button>
          </form>

          <footer className="form-footer">
            <p>New to the curation workspace? <Link to="/register">Create an account</Link></p>
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
