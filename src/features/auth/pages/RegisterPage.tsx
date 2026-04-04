import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserPlus, 
  User, 
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import './Register.css';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState<'member' | 'admin'>('member');
  const navigate = useNavigate();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleComplete = () => {
    // Navigate to login for now
    navigate('/login');
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Progress Bar */}
        <div className="registration-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">Account Info</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">Workspace Path</span>
          </div>
        </div>

        <div className="register-inner">
          <div className="register-header">
            <RefreshCw size={40} color="#2596be" />
            <h1>Start Your Journey</h1>
            <p>Join the ecosystem of digital curators and enterprise sync masters.</p>
          </div>

          {step === 1 ? (
            <form className="register-form" onSubmit={handleNext}>
              <div className="form-grid">
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input type="text" placeholder="Alex Rivera" required />
                </div>
                <div className="form-group">
                  <label>USERNAME</label>
                  <input type="text" placeholder="alex_rivera" required />
                </div>
              </div>

              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input type="email" placeholder="alex@digitalcurator.com" required />
              </div>

              <div className="form-group">
                <label>PASSWORD</label>
                <input type="password" placeholder="••••••••" required />
                <p className="helper-text">Must be at least 8 characters with a symbol.</p>
              </div>

              <button type="submit" className="register-btn">
                Continue to Workspace Setup
                <ArrowRight size={20} style={{ marginLeft: '10px' }} />
              </button>
            </form>
          ) : (
            <div className="path-selector">
              <div className="selection-header">
                <h2>Choose your path</h2>
                <p>Select the role that fits your needs within the SyncIO ecosystem.</p>
              </div>

              <div className="paths-grid">
                <div 
                  className={`path-card ${registrationType === 'admin' ? 'selected' : ''}`}
                  onClick={() => setRegistrationType('admin')}
                >
                  <div className="path-icon"><ShieldCheck size={32} /></div>
                  <div className="path-info">
                    <h3>Workspace Admin</h3>
                    <p>Create and manage organizations, permissions, and high-level sync protocols.</p>
                    <ul className="feat-list">
                      <li><CheckCircle2 size={14} /> Full Organization Access</li>
                      <li><CheckCircle2 size={14} /> Role Management</li>
                      <li><CheckCircle2 size={14} /> Global Analytics</li>
                    </ul>
                  </div>
                </div>

                <div 
                  className={`path-card ${registrationType === 'member' ? 'selected' : ''}`}
                  onClick={() => setRegistrationType('member')}
                >
                  <div className="path-icon"><User size={32} /></div>
                  <div className="path-info">
                    <h3>Enterprise Member</h3>
                    <p>Join an existing organization to collaborate on syncs, tasks, and communications.</p>
                    <ul className="feat-list">
                      <li><CheckCircle2 size={14} /> Team Collaboration</li>
                      <li><CheckCircle2 size={14} /> Personal Dashboard</li>
                      <li><CheckCircle2 size={14} /> Organization Syncs</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button onClick={handleComplete} className="register-btn finish">
                Complete Registration
                <UserPlus size={20} style={{ marginLeft: '10px' }} />
              </button>
              
              <button onClick={() => setStep(1)} className="back-btn">
                Go back to details
              </button>
            </div>
          )}

          <footer className="register-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </footer>
        </div>
      </div>
    </div>
  );
};
