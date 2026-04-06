import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { 
  UserPlus, 
  User, 
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Globe,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { authService } from '../api/auth.service';
import { showError } from '../../../store/slices/uiSlice';
import './Register.css';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState<'member' | 'admin' | 'standalone'>('member');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateBirth: ''
  });
  const [emailVerificationId, setEmailVerificationId] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password.length < 8) {
      dispatch(showError('Password must be at least 8 characters long.'));
      return;
    }

    setIsLoading(true);
    try {
      // Step 0: Check availability of email and username
      const availabilityResponse = await authService.checkAvailability(formData.email, formData.username);
      
      if (availabilityResponse.success) {
        const { isEmailAvailable, isUsernameAvailable } = availabilityResponse.data;
        
        if (!isEmailAvailable && !isUsernameAvailable) {
          dispatch(showError('Both email and username are already taken.'));
          return;
        }
        
        if (!isEmailAvailable) {
          dispatch(showError('This email is already registered.'));
          return;
        }
        
        if (!isUsernameAvailable) {
          dispatch(showError('This username is already taken.'));
          return;
        }
      } else {
        dispatch(showError(availabilityResponse.message || 'Failed to verify availability.'));
        return;
      }

      // Step 1: Request verification if availability check passed
      const response = await authService.requestEmailVerification(formData.email);
      
      if (response.success) {
        setEmailVerificationId(response.data.emailVerificationId);
        setResendTimer(response.data.resendAfterSeconds || 60);
        setStep(2);
      } else {
        dispatch(showError(response.message || 'Verification request failed.'));
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send verification code.';
      dispatch(showError(errorMsg));
    } finally {
      setIsLoading(false);
    }
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length === 6 && emailVerificationId) {
      setIsLoading(true);
      try {
        const response = await authService.verifyEmail(emailVerificationId, code);
        if (response.success) {
          // emailVerificationId remains the same as per backend requirement
          setStep(3);
        } else {
          dispatch(showError(response.message || 'Invalid verification code.'));
        }
      } catch (error: any) {
        console.error('OTP verification error:', error);
        const errorMsg = error.response?.data?.message || 'Verification failed.';
        dispatch(showError(errorMsg));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !emailVerificationId) return;

    setIsLoading(true);
    try {
      const response = await authService.resendEmailVerification(emailVerificationId);
      if (response.success) {
        setResendTimer(60); // Reset timer to 60s
        setOtp(['', '', '', '', '', '']); // Clear OTP inputs
        otpRefs.current[0]?.focus();
      } else {
        dispatch(showError(response.message || 'Failed to resend code.'));
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const errorMsg = error.response?.data?.message || 'Resend failed.';
      dispatch(showError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!emailVerificationId) return;

    setIsLoading(true);
    try {
      const registerPayload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        emailVerificationId: emailVerificationId,
        phoneNumber: formData.phoneNumber,
        dateBirth: formData.dateBirth
      };

      const response = await authService.register(registerPayload);
      if (response.success) {
        navigate('/login');
      } else {
        dispatch(showError(response.message || 'Registration failed.'));
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMsg = error.response?.data?.message || 'Registration failed.';
      dispatch(showError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  // Timer logic for resend cooldown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first OTP input on step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);


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
                    <div className="form-group">
                      <label>PHONE NUMBER</label>
                      <input 
                        name="phoneNumber"
                        type="tel" 
                        placeholder="E.g. +84901234567" 
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>DATE OF BIRTH</label>
                      <input 
                        name="dateBirth"
                        type="date" 
                        value={formData.dateBirth}
                        onChange={handleInputChange}
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

                  <button type="submit" className="register-btn" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} style={{ marginRight: '10px' }} />
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue to Verification
                        <ArrowRight size={20} style={{ marginLeft: '10px' }} />
                      </>
                    )}
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

                  <button type="submit" className="register-btn" disabled={otp.some(d => d === '') || isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} style={{ marginRight: '10px' }} />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Continue
                        <CheckCircle2 size={20} style={{ marginLeft: '10px' }} />
                      </>
                    )}
                  </button>

                  <div className="otp-options">
                    <button 
                      type="button" 
                      className="resend-btn" 
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || isLoading}
                    >
                      <RotateCcw size={16} />
                      {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
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

                <button onClick={handleComplete} className="register-btn finish" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} style={{ marginRight: '10px' }} />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <UserPlus size={20} style={{ marginLeft: '10px' }} />
                    </>
                  )}
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
