import React from 'react';
import { Layout } from '../../../components/Layout';
import { 
  Briefcase, 
  MapPin, 
  Globe, 
  Calendar, 
  Award, 
  Cpu, 
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { currentUser } from '../data';
import './ProfileScreen.css';

export const ProfileScreen: React.FC = () => {
  const user = currentUser;
  const profile = user.profile;

  return (
    <Layout>
      <div className="profile-page">
        <header className="profile-header-section">
          <img 
            src={profile?.avatarUrl} 
            alt={user.firstName} 
            className="profile-avatar-large" 
          />
          <div className="profile-info-main">
            <div className="profile-name-row">
              <div className="profile-name-container">
                <h1>{user.firstName} {user.lastName}</h1>
                <span className="profile-tagline">{user.employments[0]?.jobTitle}</span>
              </div>
              <div className="profile-quick-stats">
                <div className="quick-stat">
                  <span className="label">Syncs</span>
                  <span className="value">124</span>
                </div>
                <div className="quick-stat">
                  <span className="label">Focus Score</span>
                  <span className="value">98%</span>
                </div>
              </div>
            </div>
            
            <p className="profile-bio">
              {profile?.bio}
            </p>

            <div className="profile-quick-meta" style={{ display: 'flex', gap: '2rem' }}>
              {profile?.location && (
                <div className="info-row" style={{ padding: 0, border: 'none' }}>
                  <MapPin size={18} className="info-icon" />
                  <div className="info-label">
                    <span className="value">{profile.location}</span>
                  </div>
                </div>
              )}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="info-row" style={{ padding: 0, border: 'none', textDecoration: 'none' }}>
                  <Globe size={18} className="info-icon" />
                  <div className="info-label">
                    <span className="value" style={{ color: 'var(--primary)' }}>Portfolio Site</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </header>

        <div className="profile-content-grid">
          <main className="profile-main-column">
            <section className="profile-section-card">
              <h3 className="section-title">
                <Briefcase size={20} color="var(--primary)" />
                <span>Employment History</span>
              </h3>
              <div className="employment-timeline">
                {user.employments.map((emp) => (
                  <div key={emp.id} className="employment-item">
                    <div className="timeline-dot" />
                    <div className="employment-details">
                      <h4>{emp.jobTitle}</h4>
                      <span className="employment-org">{emp.organizationName} • {emp.departmentName}</span>
                      <div className="employment-meta">
                        <span>{emp.employmentType.replace('_', ' ')}</span>
                        <span>Joined {emp.hireDate}</span>
                        <span>{emp.workLocation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-section-card">
              <h3 className="section-title">
                <Cpu size={20} color="var(--primary)" />
                <span>Professional Core Skills</span>
              </h3>
              <div className="skills-list">
                {user.skills.map((skill) => (
                  <div key={skill.id} className="skill-tag">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-level">{skill.level}</span>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="profile-sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section className="profile-section-card">
              <h3 className="section-title">
                <TrendingUp size={20} color="var(--primary)" />
                <span>Profile Insights</span>
              </h3>
              <div className="info-row">
                <div className="info-label">
                  <span className="label">Completion Score</span>
                  <span className="value">{profile?.profileCompletedScore}%</span>
                </div>
                <div style={{ flex: 1, height: '6px', background: 'var(--bg-main)', borderRadius: '3px', marginLeft: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${profile?.profileCompletedScore}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>
              <div className="info-row">
                <Award size={18} className="info-icon" />
                <div className="info-label">
                  <span className="label">Verified Status</span>
                  <span className="value">Enterprise Certified</span>
                </div>
              </div>
            </section>

            <section className="profile-section-card">
              <h3 className="section-title">
                <Calendar size={20} color="var(--primary)" />
                <span>Quick Links</span>
              </h3>
              <button className="nav-item" style={{ width: '100%', justifyContent: 'space-between', padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span className="value">Download CV</span>
                <ChevronRight size={18} color="var(--text-sidebar)" />
              </button>
              <button className="nav-item" style={{ width: '100%', justifyContent: 'space-between', padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span className="value">Public Profile</span>
                <ChevronRight size={18} color="var(--text-sidebar)" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  );
};
