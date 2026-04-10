import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../../../store';
import { Layout } from '../../../components/Layout';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  setDateFormat, 
  setDateSeparator, 
  type DateFormat, 
  type DateSeparator 
} from '../../../store/slices/preferencesSlice';
import { 
  setTheme, 
  setLanguage 
} from '../../../store/slices/uiSlice';
import { 
  Globe, 
  Moon, 
  Sun, 
  Calendar, 
  Check,
  Bell,
  Shield,
  Lock,
  Eye,
  Mail,
  Monitor,
  Save,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { dateFormat, dateSeparator } = useSelector((state: RootState) => state.preferences);
  const { theme, language } = useSelector((state: RootState) => state.ui);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [emailNotif, setEmailNotif] = useState(true);
  const [desktopNotif, setDesktopNotif] = useState(true);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 1200);
  };

  const dateFormats: { label: string; value: DateFormat }[] = [
    { label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
    { label: 'MM-DD-YYYY', value: 'MM-DD-YYYY' },
  ];

  const dateSeparators: { label: string; value: DateSeparator }[] = [
    { label: 'Dash (-)', value: '-' },
    { label: 'Slash (/)', value: '/' },
  ];

  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Tiếng Việt', value: 'vi' },
    { label: 'Mandarin Chinese', value: 'zh' },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <Layout>
      <div className="settings-view">
        <header className="page-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account preferences and synchronized workspace settings.</p>
          </div>
          <button 
            className="primary-btn compact" 
            onClick={handleSave} 
            disabled={saveStatus !== 'idle'}
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              minWidth: '150px', 
              display: 'flex', 
              justifyContent: 'center',
              backgroundColor: saveStatus === 'saved' ? 'var(--success, #10b981)' : '',
              borderColor: saveStatus === 'saved' ? 'var(--success, #10b981)' : '',
              transition: 'background-color 0.3s, border-color 0.3s'
            }}
          >
            <AnimatePresence mode="wait">
              {saveStatus === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={18} />
                  <span>Save Changes</span>
                </motion.div>
              )}
              {saveStatus === 'saving' && (
                <motion.div
                  key="saving"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Loader2 size={18} className="spin-icon" />
                  <span>Saving...</span>
                </motion.div>
              )}
              {saveStatus === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={18} />
                  <span>Saved!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </header>

        <motion.div 
          className="settings-container"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Appearance Section */}
          <motion.section className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <div className="section-icon"><Monitor size={20} /></div>
              <div className="section-title">
                <h3>Appearance & Display</h3>
                <p>Customize the look and feel of your interface.</p>
              </div>
            </div>
            <div className="segmented-control-animated" style={{ marginTop: '16px' }}>
              {['light', 'dark'].map((t) => (
                <button 
                  key={t}
                  className={`segment-btn-animated ${theme === t ? 'active' : ''}`}
                  onClick={() => dispatch(setTheme(t as 'light' | 'dark'))}
                >
                  {theme === t && (
                    <motion.div 
                      layoutId="theme-active-bg"
                      className="segment-active-bg"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="segment-content" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {t === 'light' ? <Sun size={16} /> : <Moon size={16} />} 
                    {t.charAt(0).toUpperCase() + t.slice(1)} Mode
                  </span>
                </button>
              ))}
            </div>
          </motion.section>

          {/* Date Formatting Section */}
          <motion.section className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <div className="section-icon"><Calendar size={20} /></div>
              <div className="section-title">
                <h3>Date Formatting</h3>
                <p>Choose how dates are displayed across the platform.</p>
              </div>
            </div>
            <div className="settings-group">
              <div className="setting-item">
                <label>Date Format</label>
                <div className="animated-options-grid">
                  {dateFormats.map((f) => (
                    <button 
                      key={f.value}
                      className={`animated-option-btn ${dateFormat === f.value ? 'active' : ''}`}
                      onClick={() => dispatch(setDateFormat(f.value))}
                    >
                      {dateFormat === f.value && (
                        <motion.div 
                          layoutId="date-format-active-border"
                          className="animated-option-border"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                      <span className="animated-option-text" style={{ position: 'relative', zIndex: 1 }}>{f.label}</span>
                      {dateFormat === f.value && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="animated-option-check"
                        >
                          <Check size={14} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-item">
                <label>Separator</label>
                <div className="animated-options-grid" style={{ flexDirection: 'row' }}>
                  {dateSeparators.map((s) => (
                    <button 
                      key={s.value}
                      className={`animated-option-btn separator-btn ${dateSeparator === s.value ? 'active' : ''}`}
                      onClick={() => dispatch(setDateSeparator(s.value))}
                      style={{ padding: '8px 24px' }}
                    >
                      {dateSeparator === s.value && (
                        <motion.div 
                          layoutId="date-separator-active-border"
                          className="animated-option-border"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                      <span className="animated-option-text" style={{ position: 'relative', zIndex: 1 }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Language Section */}
          <motion.section className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <div className="section-icon"><Globe size={20} /></div>
              <div className="section-title">
                <h3>Language</h3>
                <p>Set your preferred language for the application.</p>
              </div>
            </div>
            <div className="settings-group">
              <div className="setting-item">
                <div className="select-container">
                  <select 
                    value={language} 
                    onChange={(e) => dispatch(setLanguage(e.target.value as 'en' | 'vi' | 'zh'))}
                    className="settings-select"
                  >
                    {languages.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Notification Preferences */}
          <motion.section className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <div className="section-icon"><Bell size={20} /></div>
              <div className="section-title">
                <h3>Notification Preferences</h3>
                <p>Manage how and when you receive alerts.</p>
              </div>
            </div>
            <div className="settings-group">
              <div className="settings-row">
                <div className="settings-row-info">
                  <div className="settings-row-icon"><Mail size={18} /></div>
                  <div className="settings-row-text">
                    <h4>Email Notifications</h4>
                    <p>Receive daily sync summaries and urgent tasks via email.</p>
                  </div>
                </div>
                <div 
                  className={`premium-toggle ${emailNotif ? 'active' : ''}`}
                  onClick={() => setEmailNotif(!emailNotif)}
                >
                  <motion.div 
                    className="premium-toggle-bg"
                    initial={false}
                    animate={{ backgroundColor: emailNotif ? 'var(--primary)' : 'var(--border-color)' }}
                  />
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="premium-toggle-handle" 
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {emailNotif ? (
                        <motion.div key="on" initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                          <Check size={14} color="var(--primary)" />
                        </motion.div>
                      ) : (
                        <motion.div key="off" initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                          <X size={14} color="var(--text-muted)" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-info">
                  <div className="settings-row-icon"><Monitor size={18} /></div>
                  <div className="settings-row-text">
                    <h4>Desktop Push Notifications</h4>
                    <p>Instant alerts for mentions and announcements.</p>
                  </div>
                </div>
                <div 
                  className={`premium-toggle ${desktopNotif ? 'active' : ''}`}
                  onClick={() => setDesktopNotif(!desktopNotif)}
                >
                   <motion.div 
                    className="premium-toggle-bg"
                    initial={false}
                    animate={{ backgroundColor: desktopNotif ? 'var(--primary)' : 'var(--border-color)' }}
                  />
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="premium-toggle-handle" 
                  >
                     <AnimatePresence mode="wait" initial={false}>
                      {desktopNotif ? (
                        <motion.div key="on" initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                          <Check size={14} color="var(--primary)" />
                        </motion.div>
                      ) : (
                        <motion.div key="off" initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                          <X size={14} color="var(--text-muted)" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Security Overview */}
          <motion.section className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <div className="section-icon"><Shield size={20} /></div>
              <div className="section-title">
                <h3>Security Overview</h3>
                <p>Monitor your privacy mode and authentication settings.</p>
              </div>
            </div>
            <div className="settings-group">
              <div className="settings-row">
                <div className="settings-row-info">
                  <div className="settings-row-icon success"><Lock size={18} /></div>
                  <div className="settings-row-text">
                    <h4>Multi-Factor Auth</h4>
                    <p>Enabled and Verified</p>
                  </div>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-info">
                  <div className="settings-row-icon"><Eye size={18} /></div>
                  <div className="settings-row-text">
                    <h4>Privacy Mode</h4>
                    <p>Curated Visibility</p>
                  </div>
                </div>
              </div>
              <button className="secondary-action-btn" style={{ marginTop: '8px' }}>
                View Security Audit Log
              </button>
            </div>
          </motion.section>

        </motion.div>
      </div>
    </Layout>
  );
};
