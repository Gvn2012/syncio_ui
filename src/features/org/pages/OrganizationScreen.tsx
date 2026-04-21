import React from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Layers, 
  ArrowRight, 
  ExternalLink
} from 'lucide-react';
import { demoOrg } from '../data';
import './OrganizationScreen.css';

export const OrganizationScreen: React.FC = () => {
  const org = demoOrg;

  return (
    <div className="org-page">
      <header className="org-header-banner">
        <div className="org-brand">
          <img src={org.logoUrl} alt={org.name} className="org-logo-large" />
          <div className="org-title-info">
            <h1>{org.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="org-industry-tag">{org.industry}</span>
              <span style={{ color: 'var(--text-sidebar)', fontSize: '0.9rem' }}>
                <MapPin size={14} style={{ marginRight: '4px' }} />
                {org.city}, {org.country}
              </span>
            </div>
          </div>
        </div>
        
        <div className="org-stats-row">
          <div className="org-stat">
            <div className="label">Members</div>
            <div className="value">248</div>
          </div>
          <div className="org-stat">
            <div className="label">Departments</div>
            <div className="value">{org.departments.length}</div>
          </div>
          <div className="org-stat">
            <div className="label">Sync Capacity</div>
            <div className="value">94%</div>
          </div>
        </div>
      </header>

      <div className="org-grid">
        <main className="org-sections">
          <section className="profile-section-card">
            <h3 className="section-title">
              <Layers size={20} color="var(--primary)" />
              <span>Structural Departments</span>
            </h3>
            <div className="dept-grid">
              {org.departments.map((dept) => (
                <div key={dept.id} className="dept-card">
                  <div className="dept-header">
                    <h4>{dept.name}</h4>
                    <ArrowRight size={18} color="var(--primary)" />
                  </div>
                  <p className="dept-desc">{dept.description}</p>
                  <div className="dept-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} />
                      <span>{dept.name.includes('Creative') ? 42 : 106} Members</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section-card">
            <h3 className="section-title">
              <Building2 size={20} color="var(--primary)" />
              <span>Office Locations</span>
            </h3>
            <div className="info-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <MapPin size={18} className="info-icon" />
              <div className="info-label">
                <span className="value">SyncIO Global HQ</span>
                <span className="label">78 Innovation Way, London, UK EC2V 6DE</span>
              </div>
            </div>
          </section>
        </main>

        <aside className="org-sidebar">
          <section className="org-sidebar-card">
            <h3>Organization Quick Info</h3>
            <div className="info-row" style={{ border: 'none' }}>
              <Globe size={18} className="info-icon" />
              <div className="info-label">
                <span className="label">Corporate Website</span>
                <a href={org.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {org.website?.replace('https://', '')}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="info-row" style={{ border: 'none' }}>
              <Users size={18} className="info-icon" />
              <div className="info-label">
                <span className="label">Org Size</span>
                <span className="value">{org.organizationSize}</span>
              </div>
            </div>
          </section>

          <section className="org-sidebar-card" style={{ background: 'var(--bg-main)' }}>
            <h3>Administrative</h3>
            <button className="primary-btn compact" style={{ width: '100%', justifyContent: 'center', gap: '8px' }}>
              <Building2 size={18} />
              <span>Org Settings</span>
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
