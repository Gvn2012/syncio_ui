import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from '../../../components/Layout';
import { 
  Bell, 
  Lock, 
  Shield, 
  Eye, 
  Monitor, 
  Save, 
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';
import { setTheme, setLanguage, type ThemeMode } from '../../../store/slices/uiSlice';
import type { RootState } from '../../../store';
import './ProfileScreen.css'; 

export const AccountSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { theme, language } = useSelector((state: RootState) => state.ui);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = () => {
    setSaveStatus('Saving changes...');
    setTimeout(() => {
      setSaveStatus('Success! Settings updated.');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 800); // UI delay for "premium" feel
  };


  const handleThemeToggle = () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
  };

  const handleLanguageChange = (lang: 'en' | 'vi' | 'zh') => {
    dispatch(setLanguage(lang));
  };

  return (
    <Layout>
      <div className="profile-page">
        <header className="tasks-header" style={{ marginBottom: '2rem' }}>
          <div className="header-text">
            <h2>Account Settings</h2>
            <p>Manage your personal preferences and security configurations.</p>
          </div>
          <button className="primary-btn compact" onClick={handleSave} style={{ gap: '8px' }}>
            {saveStatus?.includes('Success') ? <CheckCircle2 size={18} /> : <Save size={18} />}
            <span>{saveStatus || 'Save Changes'}</span>
          </button>
        </header>

        <div className="profile-content-grid">
          <main className="profile-main-column">
            <section className="profile-section-card">
              <h3 className="section-title">
                <Monitor size={20} color="var(--primary)" />
                <span>Display & Interface</span>
              </h3>
              <div className="settings-list">
                <div className="info-row" onClick={handleThemeToggle} style={{ cursor: 'pointer' }}>
                  <div className="info-label">
                    <span className="value">Appearance</span>
                    <span className="label">Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <button className={`theme-toggle-pill ${theme}`}>
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    <span>{theme.toUpperCase()}</span>
                  </button>
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="value">Language & Format</span>
                    <span className="label">Interface language: {language.toUpperCase()}</span>
                  </div>
                  <select 
                    value={language} 
                    onChange={(e) => handleLanguageChange(e.target.value as any)}
                    className="settings-select"
                  >
                    <option value="en">English (US)</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="zh">中文 (简体)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="profile-section-card">
              <h3 className="section-title">
                <Bell size={20} color="var(--primary)" />
                <span>Notification Preferences</span>
              </h3>
              <div className="settings-list">
                <div className="info-row">
                  <div className="info-label">
                    <span className="value">Email Notifications</span>
                    <span className="label">Receive daily sync summaries and urgent tasks via email.</span>
                  </div>
                  <div className="status-dot active" />
                </div>
                <div className="info-row">
                  <div className="info-label">
                    <span className="value">Desktop Push Notifications</span>
                    <span className="label">Instant alerts for mentions and announcements.</span>
                  </div>
                  <div className="status-dot active" />
                </div>
              </div>
            </section>
          </main>

          <aside className="profile-sidebar-column">
            <section className="profile-section-card" style={{ border: '1px solid var(--primary-alpha-20)' }}>
              <h3 className="section-title">
                <Shield size={20} color="var(--primary)" />
                <span>Security Overview</span>
              </h3>
              <div className="info-row" style={{ border: 'none', padding: '0.75rem 0' }}>
                <Lock size={18} color="#22c55e" />
                <div className="info-label">
                  <span className="value">Multi-Factor Auth</span>
                  <span className="label">Enabled and Verified</span>
                </div>
              </div>
              <div className="info-row" style={{ border: 'none', padding: '0.75rem 0' }}>
                <Eye size={18} color="var(--primary)" />
                <div className="info-label">
                  <span className="value">Privacy Mode</span>
                  <span className="label">Curated Visibility</span>
                </div>
              </div>
              <button className="secondary-action-btn">
                View Security Audit Log
              </button>
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

