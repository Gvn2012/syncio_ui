import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { 
  UserPlus, 
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Globe,
  RotateCcw,
  Loader2,
  Plus,
  Trash2,
  Star,
  Home,
  Briefcase,
  Camera,
  Upload
} from 'lucide-react';
import { authService } from '../api/auth.service';
import { OrgService } from '../../org/api/org.service';
import { uploadService } from '../../../api/upload.service';
import { showError } from '../../../store/slices/uiSlice';
import { type RegisterRequest as RegisterData } from '../api/types';
import { type AddressData, type EmergencyContactData } from '../../../api/types/common-types';
import './Register.css';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState<'admin' | 'standalone'>('standalone');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneCode: '+84',
    phoneNumber: '',
    dateBirth: '',
    gender: 'Other',
    emergencyContacts: [] as EmergencyContactData[],
    addresses: [] as AddressData[],
    organization: {
      name: '',
      legalName: '',
      description: '',
      industry: '',
      website: '',
      logoUrl: '',
      foundedDate: '',
      registrationNumber: '',
      taxId: '',
      organizationSize: 'MICRO' as any,
      parentOrganizationId: ''
    }
  });

  const [currentContact, setCurrentContact] = useState<EmergencyContactData>({
    contactName: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    isPrimary: false
  });

  const [currentAddress, setCurrentAddress] = useState<AddressData>({
    addressType: 'HOME',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isPrimary: false
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [emailVerificationId, setEmailVerificationId] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'currentContact') {
        setCurrentContact(prev => ({ ...prev, [child]: value }));
      } else if (parent === 'currentAddress') {
        setCurrentAddress(prev => ({ ...prev, [child]: value }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addEmergencyContact = () => {
    if (!currentContact.contactName || !currentContact.phoneNumber) {
      dispatch(showError('Please provide name and phone for the emergency contact.'));
      return;
    }

    setFormData(prev => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts, 
        { ...currentContact, isPrimary: prev.emergencyContacts.length === 0 }
      ]
    }));

    setCurrentContact({
      contactName: '',
      relationship: '',
      phoneNumber: '',
      email: '',
      isPrimary: false
    });
  };

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => {
      const newList = prev.emergencyContacts.filter((_, i) => i !== index);
      // If we removed the primary, assign a new one if list not empty
      if (prev.emergencyContacts[index].isPrimary && newList.length > 0) {
        newList[0].isPrimary = true;
      }
      return { ...prev, emergencyContacts: newList };
    });
  };

  const togglePrimaryContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((c, i) => ({
        ...c,
        isPrimary: i === index
      }))
    }));
  };

  const addAddress = () => {
    if (!currentAddress.addressLine1 || !currentAddress.city || !currentAddress.country) {
      dispatch(showError('Please provide street address, city, and country.'));
      return;
    }

    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses, 
        { ...currentAddress, isPrimary: prev.addresses.length === 0 }
      ]
    }));

    setCurrentAddress({
      addressType: registrationType === 'admin' ? 'WORK' : 'HOME',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isPrimary: false
    });
  };

  const removeAddress = (index: number) => {
    setFormData(prev => {
      const newList = prev.addresses.filter((_, i) => i !== index);
      if (prev.addresses[index].isPrimary && newList.length > 0) {
        newList[0].isPrimary = true;
      }
      return { ...prev, addresses: newList };
    });
  };

  const togglePrimaryAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((a, i) => ({
        ...a,
        isPrimary: i === index
      }))
    }));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      dispatch(showError('Password must be at least 8 characters long.'));
      return;
    }

    setIsLoading(true);
    try {
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

  const generateAvatarFile = (fName: string, lName: string): Promise<File> => {
    return new Promise((resolve) => {
      const size = 500;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw background
        const bgColor = getLetterAvatarColor(fName, lName);
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw letter
        const initial = fName ? fName.charAt(0).toUpperCase() : 'U';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.floor(size * 0.45)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initial, size / 2, size / 2);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'default-avatar.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png');
    });
  };

  const handleComplete = async () => {
    if (!emailVerificationId) return;

    setIsLoading(true);
    try {
      let imageIdToSubmit: string | undefined = undefined;
      let gcsParams: any = null;
      let fileToUpload: File | null = profileImage;

      // 1. If no image selected, generate a default one
      if (!fileToUpload) {
        fileToUpload = await generateAvatarFile(formData.firstName, formData.lastName);
      }

      // 2. Get upload URL for the chosen image (either uploaded or generated)
      try {
        const uploadResponse = await uploadService.requestUploadUrl({
          fileName: fileToUpload.name,
          fileContentType: fileToUpload.type,
          size: fileToUpload.size
        });

        console.log(fileToUpload.size)

        if (uploadResponse.success) {
          imageIdToSubmit = uploadResponse.data.imageId;
          gcsParams = uploadResponse.data;
        }
      } catch (uploadErr) {
        console.error('Failed to get upload URL:', uploadErr);
        // We'll continue without image if absolutely necessary, but we tried
      }

      // 3. Perform registration with imageId
      const registerPayload: RegisterData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        emailVerificationId: emailVerificationId,
        phoneCode: formData.phoneCode,
        phoneNumber: formData.phoneNumber,
        dateBirth: formData.dateBirth,
        gender: formData.gender,
        profileImageId: imageIdToSubmit,
        addresses: formData.addresses,
        emergencyContacts: formData.emergencyContacts
      };

      console.log(gcsParams)

      if (registrationType === 'admin') {
        registerPayload.organization = formData.organization;
      }

      console.log( gcsParams.headers['Content-Type'])
      console.log(fileToUpload)

      // const response = await authService.register(registerPayload);
      if (true) {
        if (gcsParams && fileToUpload) {
          uploadService.uploadToGcs(
            gcsParams.uploadUrl,
            fileToUpload,
            gcsParams.headers['Content-Type'] || fileToUpload.type,
            gcsParams.headers
          ).catch((err: any) => console.error('Background GCS upload failed:', err));
        }
        
        // navigate('/login');
      } else {
        dispatch(showError('Registration failed.'));
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMsg = error.response?.data?.message || 'Registration failed.';
      dispatch(showError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgStepSubmit = async () => {
    if (!formData.organization.name) {
      dispatch(showError('Organization name is required.'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await OrgService.checkAvailability({ name: formData.organization.name });
      if (response.success) {
        if (response.data.isNameAvailable) {
          nextStep();
        } else {
          const suggestions = (response.data.recommendedNames && response.data.recommendedNames.length > 0)
            ? ` Suggested: ${response.data.recommendedNames.slice(0, 3).join(', ')}` 
            : '';
          dispatch(showError(`Organization name "${formData.organization.name}" is already taken.${suggestions}`));
        }
      } else {
        dispatch(showError(response.message || 'Failed to check organization availability.'));
      }
    } catch (error: any) {
      console.error('Org availability error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to verify organization name.';
      dispatch(showError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };
    
  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

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
            data-tooltip="Account info"
          >
            <span className="step-num">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</span>
            <span className="step-label">Account</span>
          </div>
          <div className="progress-line"></div>
          <div 
            className={`progress-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
            data-tooltip="Verification"
          >
            <span className="step-num">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</span>
            <span className="step-label">Verify</span>
          </div>
          <div className="progress-line"></div>
          <div 
            className={`progress-step ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}
            data-tooltip="Choose path"
          >
            <span className="step-num">{step > 3 ? <CheckCircle2 size={16} /> : '3'}</span>
            <span className="step-label">Path</span>
          </div>
          <div className="progress-line"></div>
          
          {/* Branching Steps */}
          {registrationType === 'admin' ? (
            <>
              <div 
                className={`progress-step ${step === 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}
                data-tooltip="Organization"
              >
                <span className="step-num">{step > 4 ? <CheckCircle2 size={16} /> : '4'}</span>
                <span className="step-label">Org</span>
              </div>
              <div className="progress-line"></div>
              <div 
                className={`progress-step ${step === 5 ? 'active' : ''} ${step > 5 ? 'completed' : ''}`}
                data-tooltip="Emergency"
              >
                <span className="step-num">{step > 5 ? <CheckCircle2 size={16} /> : '5'}</span>
                <span className="step-label">Help</span>
              </div>
              <div className="progress-line"></div>
              <div 
                className={`progress-step ${step === 6 ? 'active' : ''} ${step > 6 ? 'completed' : ''}`}
                data-tooltip="Address"
              >
                <span className="step-num">{step > 6 ? <CheckCircle2 size={16} /> : '6'}</span>
                <span className="step-label">Home</span>
              </div>
              <div className="progress-line"></div>
              <div 
                className={`progress-step ${step === 7 ? 'active' : ''}`}
                data-tooltip="Photo"
              >
                <span className="step-num">7</span>
                <span className="step-label">Photo</span>
              </div>
            </>
          ) : (
            <>
              <div 
                className={`progress-step ${step === 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}
                data-tooltip="Emergency"
              >
                <span className="step-num">{step > 4 ? <CheckCircle2 size={16} /> : '4'}</span>
                <span className="step-label">Help</span>
              </div>
              <div className="progress-line"></div>
              <div 
                className={`progress-step ${step === 5 ? 'active' : ''} ${step > 5 ? 'completed' : ''}`}
                data-tooltip="Address"
              >
                <span className="step-num">{step > 5 ? <CheckCircle2 size={16} /> : '5'}</span>
                <span className="step-label">Home</span>
              </div>
              <div className="progress-line"></div>
              <div 
                className={`progress-step ${step === 6 ? 'active' : ''}`}
                data-tooltip="Photo"
              >
                <span className="step-num">6</span>
                <span className="step-label">Photo</span>
              </div>
            </>
          )}
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
                      <div className="phone-input-group">
                        <select 
                          name="phoneCode" 
                          value={formData.phoneCode} 
                          onChange={handleInputChange}
                          className="phone-code-select"
                        >
                          <option value="+84">🇻🇳 +84 (VN)</option>
                          <option value="+1">🇺🇸 +1 (US)</option>
                          <option value="+44">🇬🇧 +44 (UK)</option>
                          <option value="+65">🇸🇬 +65 (SG)</option>
                          <option value="+81">🇯🇵 +81 (JP)</option>
                          <option value="+82">🇰🇷 +82 (KR)</option>
                          <option value="+61">🇦🇺 +61 (AU)</option>
                          <option value="+86">🇨🇳 +86 (CN)</option>
                          <option value="+66">🇹🇭 +66 (TH)</option>
                          <option value="+60">🇲🇾 +60 (MY)</option>
                          <option value="+62">🇮🇩 +62 (ID)</option>
                          <option value="+63">🇵🇭 +63 (PH)</option>
                          <option value="+91">🇮🇳 +91 (IN)</option>
                          <option value="+33">🇫🇷 +33 (FR)</option>
                          <option value="+49">🇩🇪 +49 (DE)</option>
                          <option value="+7">🇷🇺 +7 (RU)</option>
                        </select>
                        <input 
                          name="phoneNumber"
                          type="tel" 
                          placeholder="901 234 567" 
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
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
                    <div className="form-group">
                      <label>GENDER</label>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
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
                </div>

                <button onClick={nextStep} className="register-btn">
                  Continue to Details
                  <ArrowRight size={20} style={{ marginLeft: '10px' }} />
                </button>
                
                <button onClick={() => setStep(2)} className="back-btn">
                  Go back to verification
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="details-view"
              >
                {registrationType === 'admin' ? (
                  <>
                    <div className="selection-header">
                      <h2>Organization Details</h2>
                      <p>Set up your professional workspace information.</p>
                    </div>
                    <div className="form-grid">
                      <div className="form-group span-2">
                        <label>ORGANIZATION NAME</label>
                        <input name="organization.name" type="text" placeholder="Enter legal or trade name" value={formData.organization.name} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>INDUSTRY</label>
                        <input name="organization.industry" type="text" placeholder="e.g. Tech, Medical" value={formData.organization.industry} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>WEBSITE</label>
                        <input name="organization.website" type="url" placeholder="https://..." value={formData.organization.website} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>ORG SIZE</label>
                        <select name="organization.organizationSize" value={formData.organization.organizationSize} onChange={handleInputChange}>
                          <option value="MICRO">Micro (1-9)</option>
                          <option value="SMALL">Small (10-49)</option>
                          <option value="MEDIUM">Medium (50-249)</option>
                          <option value="LARGE">Large (250-999)</option>
                          <option value="ENTERPRISE">Enterprise (1000+)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>TAX ID / REG NUMBER</label>
                        <input name="organization.taxId" type="text" placeholder="Tax ID" value={formData.organization.taxId} onChange={handleInputChange} />
                      </div>
                    </div>
                    <button onClick={handleOrgStepSubmit} className="register-btn" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} style={{ marginRight: '10px' }} />
                          Synthesizing...
                        </>
                      ) : (
                        <>
                          Continue to Emergency
                          <ArrowRight size={20} style={{ marginLeft: '10px' }} />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <EmergencyContactList 
                    contacts={formData.emergencyContacts}
                    current={currentContact}
                    onInputChange={handleInputChange}
                    onAdd={addEmergencyContact}
                    onRemove={removeEmergencyContact}
                    onTogglePrimary={togglePrimaryContact}
                    onNext={nextStep}
                  />
                )}
                <button onClick={prevStep} className="back-btn">Go back to path selection</button>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="details-view"
              >
                {registrationType === 'admin' ? (
                  <EmergencyContactList 
                    contacts={formData.emergencyContacts}
                    current={currentContact}
                    onInputChange={handleInputChange}
                    onAdd={addEmergencyContact}
                    onRemove={removeEmergencyContact}
                    onTogglePrimary={togglePrimaryContact}
                    onNext={nextStep}
                  />
                ) : (
                  <AddressList 
                    addresses={formData.addresses}
                    current={currentAddress}
                    onInputChange={handleInputChange}
                    onAdd={addAddress}
                    onRemove={removeAddress}
                    onTogglePrimary={togglePrimaryAddress}
                    onComplete={nextStep}
                    isLoading={isLoading}
                  />
                )}
                <button onClick={prevStep} className="back-btn">
                  {registrationType === 'admin' ? 'Go back to org details' : 'Go back to emergency info'}
                </button>
              </motion.div>
            )}

            {step === 6 && registrationType === 'admin' && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="details-view"
              >
                <AddressList 
                  addresses={formData.addresses}
                  current={currentAddress}
                  onInputChange={handleInputChange}
                  onAdd={addAddress}
                  onRemove={removeAddress}
                  onTogglePrimary={togglePrimaryAddress}
                  onComplete={nextStep}
                  isLoading={isLoading}
                />
                <button onClick={prevStep} className="back-btn">Go back to emergency info</button>
              </motion.div>
            )}

            {((step === 6 && registrationType === 'standalone') || (step === 7 && registrationType === 'admin')) && (
              <motion.div
                key="step-photo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="details-view"
              >
                <ProfilePictureStep 
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  selectedFile={profileImage}
                  previewUrl={profileImagePreview}
                  onFileSelect={(file) => {
                    if (file && file.size > 10 * 1024 * 1024) {
                      dispatch(showError('Image size must be less than 10MB.'));
                      return;
                    }
                    setProfileImage(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setProfileImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setProfileImagePreview(null);
                    }
                  }}
                  onComplete={handleComplete}
                  isLoading={isLoading}
                />
                <button onClick={prevStep} className="back-btn">Go back to address info</button>
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

// --- Sub-components for Dynamic Lists ---

// --- Helper Components & Utilities ---

const getLetterAvatarColor = (firstName: string, lastName: string) => {
  const combined = (firstName + lastName).toLowerCase();
  const colors = [
    '#0d9488', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', 
    '#9333ea', '#c026d3', '#db2777', '#e11d48', '#ea580c'
  ];
  let sum = 0;
  for (let i = 0; i < combined.length; i++) {
    sum += combined.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

interface EmergencyContactListProps {
  contacts: EmergencyContactData[];
  current: EmergencyContactData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onTogglePrimary: (index: number) => void;
  onNext: () => void;
}

const EmergencyContactList: React.FC<EmergencyContactListProps> = ({
  contacts, current, onInputChange, onAdd, onRemove, onTogglePrimary, onNext
}) => (
  <div className="list-step-container">
    <div className="selection-header">
      <h2>Emergency Contacts</h2>
      <p>Add one or more contacts for critical safety syncs. (Optional)</p>
    </div>

    <div className="added-items-list">
      {contacts.map((contact, index) => (
        <div key={index} className={`item-card ${contact.isPrimary ? 'primary' : ''}`}>
          <div className="item-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="item-info">
            <span className="item-name">{contact.contactName}</span>
            <span className="item-sub">{contact.relationship} • {contact.phoneNumber}</span>
          </div>
          <div className="item-actions">
            <button 
              className={`action-btn primary-toggle ${contact.isPrimary ? 'active' : ''}`}
              onClick={() => onTogglePrimary(index)}
              title={contact.isPrimary ? "Primary Contact" : "Set as Primary"}
            >
              <Star size={16} fill={contact.isPrimary ? "currentColor" : "none"} />
            </button>
            <button className="action-btn remove" onClick={() => onRemove(index)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      {contacts.length === 0 && (
        <div className="empty-list-state">
          No contacts added yet.
        </div>
      )}
    </div>

    <div className="add-item-form">
      <h3>Add New Contact</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>CONTACT NAME</label>
          <input name="currentContact.contactName" type="text" placeholder="Full name" value={current.contactName} onChange={onInputChange} />
        </div>
        <div className="form-group">
          <label>RELATIONSHIP</label>
          <input name="currentContact.relationship" type="text" placeholder="e.g. Spouse" value={current.relationship} onChange={onInputChange} />
        </div>
        <div className="form-group">
          <label>PHONE NUMBER</label>
          <input name="currentContact.phoneNumber" type="tel" placeholder="Phone number" value={current.phoneNumber} onChange={onInputChange} />
        </div>
        <div className="form-group">
          <label>EMAIL</label>
          <input name="currentContact.email" type="email" placeholder="Email (Optional)" value={current.email} onChange={onInputChange} />
        </div>
      </div>
      <button className="add-another-btn" onClick={onAdd}>
        <Plus size={18} /> Add Contact
      </button>
    </div>

    <button onClick={onNext} className="register-btn">
      {contacts.length === 0 ? 'Skip this step' : 'Continue to Address'}
      <ArrowRight size={20} style={{ marginLeft: '10px' }} />
    </button>
  </div>
);

interface AddressListProps {
  addresses: AddressData[];
  current: AddressData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onTogglePrimary: (index: number) => void;
  onComplete: () => void;
  isLoading: boolean;
}

const AddressList: React.FC<AddressListProps> = ({
  addresses, current, onInputChange, onAdd, onRemove, onTogglePrimary, onComplete, isLoading
}) => (
  <div className="list-step-container">
    <div className="selection-header">
      <h2>Address Information</h2>
      <p>Provide your home or work addresses. (Optional)</p>
    </div>

    <div className="added-items-list">
      {addresses.map((addr, index) => (
        <div key={index} className={`item-card ${addr.isPrimary ? 'primary' : ''}`}>
          <div className="item-icon">
            {addr.addressType === 'WORK' ? <Briefcase size={18} /> : <Home size={18} />}
          </div>
          <div className="item-info">
            <span className="item-name">{addr.addressLine1}</span>
            <span className="item-sub">{addr.city}, {addr.country} ({addr.addressType})</span>
          </div>
          <div className="item-actions">
            <button 
              className={`action-btn primary-toggle ${addr.isPrimary ? 'active' : ''}`}
              onClick={() => onTogglePrimary(index)}
              title={addr.isPrimary ? "Primary Address" : "Set as Primary"}
            >
              <Star size={16} fill={addr.isPrimary ? "currentColor" : "none"} />
            </button>
            <button className="action-btn remove" onClick={() => onRemove(index)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      {addresses.length === 0 && (
        <div className="empty-list-state">
          No addresses added yet.
        </div>
      )}
    </div>

    <div className="add-item-form">
      <h3>Add New Address</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Type</label>
          <select name="currentAddress.addressType" value={current.addressType} onChange={onInputChange}>
            <option value="HOME">Home</option>
            <option value="WORK">Work</option>
            <option value="MAILING">Mailing</option>
            <option value="PERMANENT">Permanent</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="form-group span-2">
          <label>STREET ADDRESS</label>
          <input name="currentAddress.addressLine1" type="text" placeholder="Line 1" value={current.addressLine1} onChange={onInputChange} />
        </div>
        <div className="form-group">
          <label>CITY</label>
          <input name="currentAddress.city" type="text" placeholder="City" value={current.city} onChange={onInputChange} />
        </div>
        <div className="form-group">
          <label>COUNTRY</label>
          <input name="currentAddress.country" type="text" placeholder="Country" value={current.country} onChange={onInputChange} />
        </div>
      </div>
      <button className="add-another-btn" onClick={onAdd}>
        <Plus size={18} /> Add Address
      </button>
    </div>

    <button onClick={onComplete} className="register-btn finish" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" size={20} style={{ marginRight: '10px' }} />
          Finalizing...
        </>
      ) : (
        <>
          {addresses.length === 0 ? 'Skip & Continue' : 'Continue to Photo'}
          <ArrowRight size={20} style={{ marginLeft: '10px' }} />
        </>
      )}
    </button>
  </div>
);

// --- Profile Picture Step Component ---

interface ProfilePictureStepProps {
  firstName: string;
  lastName: string;
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  onComplete: () => void;
  isLoading: boolean;
}

const ProfilePictureStep: React.FC<ProfilePictureStepProps> = ({
  firstName, lastName, selectedFile, previewUrl, onFileSelect, onComplete, isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initial = firstName ? firstName.charAt(0).toUpperCase() : 'U';
  const bgColor = getLetterAvatarColor(firstName, lastName);

  return (
    <div className="profile-upload-container">
      <div className="selection-header">
        <h2>Profile Identity</h2>
        <p>Set a visual identifier for your global sync profile. (Optional)</p>
      </div>

      <div className="photo-preview-area">
        {previewUrl ? (
          <div className="avatar-preview-circle">
            <img src={previewUrl} alt="Preview" />
            <button className="remove-photo-btn" onClick={() => onFileSelect(null)} title="Remove photo">
              <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        ) : (
          <div 
            className="avatar-placeholder-circle" 
            style={{ backgroundColor: bgColor }}
          >
            <span className="avatar-letter">{initial}</span>
            <div className="camera-overlay">
              <Camera size={24} />
            </div>
          </div>
        )}
      </div>

      <div className="upload-controls">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
        <button 
          className="select-photo-btn" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload size={18} />
          {selectedFile ? 'Change Photo' : 'Upload Photo'}
        </button>
        {selectedFile && (
          <button 
            className="remove-link-btn" 
            onClick={() => onFileSelect(null)}
            disabled={isLoading}
          >
            Remove and use default
          </button>
        )}
        <p className="upload-tip">Supports JPG, PNG or WebP. Max 10MB.</p>
      </div>

      <button onClick={onComplete} className="register-btn finish" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} style={{ marginRight: '10px' }} />
            Finalizing...
          </>
        ) : (
          <>
            {!selectedFile ? 'Skip & Finish Registration' : 'Complete Registration'}
            <UserPlus size={20} style={{ marginLeft: '10px' }} />
          </>
        )}
      </button>
    </div>
  );
};
