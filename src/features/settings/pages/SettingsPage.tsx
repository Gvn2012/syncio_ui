import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../../../store';
import { Layout } from '../../../components/Layout';
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
  Check
} from 'lucide-react';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { dateFormat, dateSeparator } = useSelector((state: RootState) => state.preferences);
  const { theme, language } = useSelector((state: RootState) => state.ui);

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

  return (
    <Layout>
      <div className="settings-view">
        <header className="page-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and synchronized workspace settings.</p>
        </header>

        <div className="settings-container">
          {/* Appearance Section */}
          <section className="settings-section">
            <div className="section-header">
              <div className="section-icon"><Sun size={20} /></div>
              <div className="section-title">
                <h3>Appearance</h3>
                <p>Customize the look and feel of your interface.</p>
              </div>
            </div>
            <div className="settings-grid">
              <div 
                className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                onClick={() => dispatch(setTheme('light'))}
              >
                <div className="theme-preview light"></div>
                <div className="theme-info">
                  <Sun size={16} />
                  <span>Light Mode</span>
                  {theme === 'light' && <Check size={16} className="check-icon" />}
                </div>
              </div>
              <div 
                className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => dispatch(setTheme('dark'))}
              >
                <div className="theme-preview dark"></div>
                <div className="theme-info">
                  <Moon size={16} />
                  <span>Dark Mode</span>
                  {theme === 'dark' && <Check size={16} className="check-icon" />}
                </div>
              </div>
            </div>
          </section>

          {/* Date Formatting Section */}
          <section className="settings-section">
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
                <div className="options-grid">
                  {dateFormats.map((f) => (
                    <button 
                      key={f.value}
                      className={`option-btn ${dateFormat === f.value ? 'active' : ''}`}
                      onClick={() => dispatch(setDateFormat(f.value))}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-item">
                <label>Separator</label>
                <div className="options-grid">
                  {dateSeparators.map((s) => (
                    <button 
                      key={s.value}
                      className={`option-btn ${dateSeparator === s.value ? 'active' : ''}`}
                      onClick={() => dispatch(setDateSeparator(s.value))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Language Section */}
          <section className="settings-section">
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
          </section>
        </div>
      </div>
    </Layout>
  );
};
