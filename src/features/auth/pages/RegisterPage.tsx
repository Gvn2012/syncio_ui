import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  User, 
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Globe,
  RotateCcw
} from 'lucide-react';
import './Register.css';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState<'member' | 'admin' | 'standalone'>('member');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.every(digit => digit !== '')) {
      setStep(3);
    }
  };

  const handleComplete = () => {
    // Navigate to login for now
    navigate('/login');
  };

  // Focus first OTP input on step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Page transition variants
  const variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }
    })
  };

  return (
    <div className="register-page">
      <motion.div 
        layout 
        className="register-container"
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Progress Bar */}
        <div className="registration-progress">
          <div 
            className={`progress-step ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
            data-tooltip="Personal & account information"
            data-tooltip-position="bottom"
          >
            <span className="step-num">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</span>
            <span className="step-label">Account Info</span>
          </div>
          <div className="progress-line"></div>
          <div 
            className={`progress-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
            data-tooltip="Email verification code"
            data-tooltip-position="bottom"
          >
            <span className="step-num">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</span>
            <span className="step-label">Verification</span>
          </div>
          <div className="progress-line"></div>
          <div 
            className={`progress-step ${step === 3 ? 'active' : ''}`}
            data-tooltip="Choose your enterprise role"
            data-tooltip-position="bottom"
          >
            <span className="step-num">3</span>
            <span className="step-label">Workspace Path</span>
          </div>
        </div>

        <div className="register-inner">
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="register-header">
                  <RefreshCw 
                    size={32} 
                    color="#2596be" 
                    data-tooltip="Syncing your digital ecosystem"
                    style={{ cursor: 'pointer' }}
                  />
                  <h1>Start Your Journey</h1>
                  <p>Join the ecosystem of digital curators and enterprise sync masters.</p>
                </div>

                <form className="register-form" onSubmit={handleStep1Submit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>FIRST NAME</label>
                      <input 
                        name="firstName"
                        type="text" 
                        placeholder="Enter first name" 
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>LAST NAME</label>
                      <input 
                        name="lastName"
                        type="text" 
                        placeholder="Enter last name" 
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>USERNAME</label>
                      <input 
                        name="username"
                        type="text" 
                        placeholder="Choose username" 
                        value={formData.username}
                        onChange={handleInputChange}
                        autoComplete="off"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>EMAIL ADDRESS</label>
                      <input 
                        name="email"
                        type="email" 
                        placeholder="Enter email address" 
                        value={formData.email}
                        onChange={handleInputChange}
                        autoComplete="off"
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>PASSWORD</label>
                    <input 
                      name="password"
                      type="password" 
                      placeholder="Create password" 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                    />
                    <p className="helper-text">Must be at least 8 characters with a symbol.</p>
                  </div>

                  <button type="submit" className="register-btn">
                    Continue to Verification
                    <ArrowRight size={20} style={{ marginLeft: '10px' }} />
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="otp-view"
              >
                <div className="selection-header">
                  <h2>Verify your email</h2>
                  <p>We've sent a 6-digit code to <strong>{formData.email}</strong>.</p>
                </div>

                <form className="otp-form" onSubmit={handleVerifyOtp}>
                  <div className="otp-container">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        className="otp-input"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        maxLength={1}
                        inputMode="numeric"
                        required
                      />
                    ))}
                  </div>

                  <button type="submit" className="register-btn" disabled={otp.some(d => d === '')}>
                    Verify & Continue
                    <CheckCircle2 size={20} style={{ marginLeft: '10px' }} />
                  </button>

                  <div className="otp-options">
                    <button type="button" className="resend-btn" onClick={() => setOtp(['', '', '', '', '', ''])}>
                      <RotateCcw size={16} />
                      Resend Code
                    </button>
                    <div className="otp-divider"></div>
                    <button type="button" className="back-btn" onClick={() => setStep(1)}>
                      Go back to account info
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="path-selector"
              >
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
                      <p>Create and manage organizations, permissions, and specialized sync protocols.</p>
                      <ul className="feat-list">
                        <li><CheckCircle2 size={14} /> Full Organization Access</li>
                        <li><CheckCircle2 size={14} /> Role Management</li>
                        <li><CheckCircle2 size={14} /> Global Analytics</li>
                      </ul>
                    </div>
                  </div>

                  <div 
                    className={`path-card ${registrationType === 'standalone' ? 'selected' : ''}`}
                    onClick={() => setRegistrationType('standalone')}
                  >
                    <div className="path-icon"><Globe size={32} /></div>
                    <div className="path-info">
                      <h3>Standalone Specialist</h3>
                      <p>Engage as an independent sync master without organizational overhead.</p>
                      <ul className="feat-list">
                        <li><CheckCircle2 size={14} /> Personal Digital Garden</li>
                        <li><CheckCircle2 size={14} /> Universal Feed Access</li>
                        <li><CheckCircle2 size={14} /> Direct Network Sync</li>
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
                
                <button onClick={() => setStep(2)} className="back-btn">
                  Go back to verification
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="register-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
};
