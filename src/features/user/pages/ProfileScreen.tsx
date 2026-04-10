import React, { useEffect, useState } from 'react';
import { Layout } from '../../../components/Layout';
import { 

  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Cpu, 
  TrendingUp,
  Edit3,
  X,
  Check,
  Plus,
  Trash2,
  Home,
  Briefcase,
  AlertTriangle,
  User as UserIcon
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import { fetchUserDetail } from '../../../store/slices/userSlice';
import { UserAvatar } from '../../../components/UserAvatar';
import { FeedItem } from '../../feed/components/FeedItem';
import { demoFeedItems } from '../../feed/data';
import type { 
  UserAddressResponse, 
  UserSkillResponse 
} from '../types';
import './ProfileScreen.css';

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id, userDetail, userDetailLoading, userDetailError } = useSelector(
    (state: RootState) => state.user
  );

  // Local CRUD state
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');

  const [localAddresses, setLocalAddresses] = useState<UserAddressResponse[]>([]);

  const [localSkills, setLocalSkills] = useState<UserSkillResponse[]>([]);

  // New item forms
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newAddress, setNewAddress] = useState({ addressType: 'HOME', addressLine1: '', city: '', country: '', postalCode: '' });
  const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: 'BEGINNER', yearsOfExperience: 0 });

  useEffect(() => {
    if (id && !userDetail) {
      dispatch(fetchUserDetail(id));
    }
  }, [id, userDetail, dispatch]);

  useEffect(() => {
    if (userDetail) {
      setBioValue(userDetail.userProfileResponse?.bio || '');
      setLocalAddresses(userDetail.addresses || []);
      setLocalSkills(userDetail.skills || []);
    }
  }, [userDetail]);

  if (userDetailLoading) {
    return (
      <Layout>
        <div className="profile-page">
          <div className="profile-loading">
            <div className="loading-spinner" />
            <p>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (userDetailError || !userDetail) {
    return (
      <Layout>
        <div className="profile-page">
          <div className="profile-error">
            <AlertTriangle size={48} color="var(--error)" />
            <h3>Failed to load profile</h3>
            <p>{userDetailError || 'User data not available'}</p>
            <button className="retry-btn" onClick={() => id && dispatch(fetchUserDetail(id))}>
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const user = userDetail.userResponse;
  const profile = userDetail.userProfileResponse;
  const emails = userDetail.userEmailResponse;
  const phones = userDetail.userPhoneResponse;
  const primaryEmail = emails?.find(e => e.primary);
  const primaryPhone = phones?.find(p => p.primary);
  const primaryPicture = profile?.userProfilePictureResponseList?.find(p => p.primary);
  const avatarUrl = primaryPicture?.url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=2596be&color=fff&size=200`;

  const displayName = `${user.firstName} ${user.lastName}`;

  // Mock feed posts for this user
  const userFeedPosts = demoFeedItems.slice(0, 4).map(post => ({
    ...post,
    author: {
      id: user.id,
      name: displayName,
      avatar: avatarUrl,
      role: 'Member'
    },
    authorId: user.id,
  }));

  // CRUD handlers
  const handleSaveBio = () => {
    // TODO: Call API to update bio
    setEditingBio(false);
  };

  const handleDeleteAddress = (addrId: string) => {
    setLocalAddresses(prev => prev.filter(a => a.id !== addrId));
    // TODO: Call API to delete address
  };

  const handleAddAddress = () => {
    const newAddr: UserAddressResponse = {
      id: `temp-${Date.now()}`,
      ...newAddress,
      addressLine2: null,
      state: null,
      primary: false,
    };
    setLocalAddresses(prev => [...prev, newAddr]);
    setNewAddress({ addressType: 'HOME', addressLine1: '', city: '', country: '', postalCode: '' });
    setShowAddAddress(false);
    // TODO: Call API to create address
  };



  const handleDeleteSkill = (skillId: string) => {
    setLocalSkills(prev => prev.filter(s => s.id !== skillId));
    // TODO: Call API to delete skill
  };

  const handleAddSkill = () => {
    const newS: UserSkillResponse = {
      id: `temp-${Date.now()}`,
      skillDefinitionId: `temp-def-${Date.now()}`,
      ...newSkill,
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
    };
    setLocalSkills(prev => [...prev, newS]);
    setNewSkill({ skillName: '', proficiencyLevel: 'BEGINNER', yearsOfExperience: 0 });
    setShowAddSkill(false);
    // TODO: Call API to create skill
  };

  return (
    <Layout>
      <div className="profile-page">
        {/* Profile Header Banner */}
        <header className="profile-header-section">
          <div className="profile-header-gradient" />
          <div className="profile-header-content">
            <div className="profile-avatar-container">
              <UserAvatar className="profile-avatar-large" size={200} />
              <span className={`status-dot-large ${user.active ? 'online' : 'offline'}`} />
            </div>
            <div className="profile-info-main">
              <div className="profile-name-row">
                <div className="profile-name-container">
                  <h1>{displayName}</h1>
                  <span className="profile-username">@{user.username}</span>
                </div>
                <div className="profile-quick-stats">
                  <div className="quick-stat">
                    <span className="value">{localSkills.length}</span>
                    <span className="label">Skills</span>
                  </div>
                  <div className="quick-stat">
                    <span className="value">{userFeedPosts.length}</span>
                    <span className="label">Posts</span>
                  </div>
                  <div className="quick-stat">
                    <span className="value">{profile?.profileCompletedScore || 0}%</span>
                    <span className="label">Complete</span>
                  </div>
                </div>
              </div>

              {/* Bio - editable */}
              <div className="profile-bio-section">
                {editingBio ? (
                  <div className="inline-edit-form">
                    <textarea 
                      value={bioValue}
                      onChange={(e) => setBioValue(e.target.value)}
                      className="bio-textarea"
                      placeholder="Write something about yourself..."
                      rows={3}
                    />
                    <div className="inline-edit-actions">
                      <button className="save-btn" onClick={handleSaveBio}><Check size={14} /> Save</button>
                      <button className="cancel-btn" onClick={() => { setEditingBio(false); setBioValue(profile?.bio || ''); }}><X size={14} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="bio-display">
                    <p className="profile-bio">{bioValue || 'No bio yet. Click edit to add one.'}</p>
                    <button className="edit-inline-btn" onClick={() => setEditingBio(true)}><Edit3 size={14} /></button>
                  </div>
                )}
              </div>

              {/* Quick contact info */}
              <div className="profile-quick-meta">
                {primaryEmail && (
                  <div className="meta-chip">
                    <Mail size={14} />
                    <span>{primaryEmail.email}</span>
                  </div>
                )}
                {primaryPhone && (
                  <div className="meta-chip">
                    <Phone size={14} />
                    <span>{primaryPhone.phoneNumber}</span>
                  </div>
                )}
                {profile?.dateOfBirth && (
                  <div className="meta-chip">
                    <Calendar size={14} />
                    <span>{profile.dateOfBirth}</span>
                  </div>
                )}
                <div className="meta-chip">
                  <UserIcon size={14} />
                  <span>{user.gender}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Two-column layout: Sidebar + Feed */}
        <div className="profile-content-grid">
          {/* LEFT SIDEBAR - User details with CRUD */}
          <aside className="profile-sidebar-column">

            {/* Addresses */}
            <section className="profile-section-card">
              <div className="section-header-row">
                <h3 className="section-title">
                  <Home size={18} color="var(--primary)" />
                  <span>Addresses</span>
                </h3>
                <button className="add-item-btn" onClick={() => setShowAddAddress(!showAddAddress)}>
                  {showAddAddress ? <X size={16} /> : <Plus size={16} />}
                </button>
              </div>

              {showAddAddress && (
                <div className="add-form">
                  <select value={newAddress.addressType} onChange={e => setNewAddress(p => ({ ...p, addressType: e.target.value }))}>
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input placeholder="Address line 1" value={newAddress.addressLine1} onChange={e => setNewAddress(p => ({ ...p, addressLine1: e.target.value }))} />
                  <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} />
                  <input placeholder="Country" value={newAddress.country} onChange={e => setNewAddress(p => ({ ...p, country: e.target.value }))} />
                  <input placeholder="Postal code" value={newAddress.postalCode} onChange={e => setNewAddress(p => ({ ...p, postalCode: e.target.value }))} />
                  <button className="save-btn" onClick={handleAddAddress}><Check size={14} /> Add</button>
                </div>
              )}

              <div className="items-list">
                {localAddresses.map(addr => (
                  <div key={addr.id} className="detail-card">
                    <div className="detail-card-header">
                      <span className={`type-badge ${addr.addressType.toLowerCase()}`}>{addr.addressType}</span>
                      {addr.primary && <span className="primary-badge">Primary</span>}
                      <button className="delete-btn" onClick={() => handleDeleteAddress(addr.id)}><Trash2 size={14} /></button>
                    </div>
                    <p className="detail-text">{addr.addressLine1}</p>
                    <p className="detail-sub">{addr.city}, {addr.country} {addr.postalCode}</p>
                  </div>
                ))}
                {localAddresses.length === 0 && <p className="empty-text">No addresses added</p>}
              </div>
            </section>


            {/* Skills */}
            <section className="profile-section-card">
              <div className="section-header-row">
                <h3 className="section-title">
                  <Cpu size={18} color="var(--primary)" />
                  <span>Skills</span>
                </h3>
                <button className="add-item-btn" onClick={() => setShowAddSkill(!showAddSkill)}>
                  {showAddSkill ? <X size={16} /> : <Plus size={16} />}
                </button>
              </div>

              {showAddSkill && (
                <div className="add-form">
                  <input placeholder="Skill name" value={newSkill.skillName} onChange={e => setNewSkill(p => ({ ...p, skillName: e.target.value }))} />
                  <select value={newSkill.proficiencyLevel} onChange={e => setNewSkill(p => ({ ...p, proficiencyLevel: e.target.value }))}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                  <input type="number" placeholder="Years of experience" value={newSkill.yearsOfExperience} onChange={e => setNewSkill(p => ({ ...p, yearsOfExperience: parseInt(e.target.value) || 0 }))} />
                  <button className="save-btn" onClick={handleAddSkill}><Check size={14} /> Add</button>
                </div>
              )}

              <div className="skills-cloud">
                {localSkills.map(skill => (
                  <div key={skill.id} className="skill-tag">
                    <div className="skill-tag-content">
                      <span className="skill-name">{skill.skillName}</span>
                      <span className="skill-level">{skill.proficiencyLevel} • {skill.yearsOfExperience}y</span>
                    </div>
                    {skill.verified && <Award size={14} className="verified-icon" />}
                    <button className="delete-btn-sm" onClick={() => handleDeleteSkill(skill.id)}><X size={12} /></button>
                  </div>
                ))}
                {localSkills.length === 0 && <p className="empty-text">No skills added</p>}
              </div>
            </section>

            {/* Employments */}
            {userDetail.employments.length > 0 && (
              <section className="profile-section-card">
                <h3 className="section-title">
                  <Briefcase size={18} color="var(--primary)" />
                  <span>Employment</span>
                </h3>
                <div className="items-list">
                  {userDetail.employments.map(emp => (
                    <div key={emp.id} className="detail-card">
                      <h4 className="detail-title">{emp.jobTitle}</h4>
                      <p className="detail-sub">{emp.organizationName} • {emp.departmentName}</p>
                      <div className="employment-meta-row">
                        <span className="type-badge">{emp.employmentType.replace('_', ' ')}</span>
                        <span className="detail-sub">Since {emp.hireDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Profile Completion */}
            <section className="profile-section-card">
              <h3 className="section-title">
                <TrendingUp size={18} color="var(--primary)" />
                <span>Profile Completion</span>
              </h3>
              <div className="completion-bar-container">
                <div className="completion-bar">
                  <div className="completion-fill" style={{ width: `${profile?.profileCompletedScore || 0}%` }} />
                </div>
                <span className="completion-text">{profile?.profileCompletedScore || 0}%</span>
              </div>
            </section>
          </aside>

          {/* MAIN CONTENT - User's Feed */}
          <main className="profile-main-column">
            <div className="profile-feed-header">
              <h2>My Syncs</h2>
              <span className="count-badge">{userFeedPosts.length} Syncs</span>
            </div>
            <div className="profile-feed-list">
              {userFeedPosts.map(post => (
                <FeedItem key={post.id} post={post} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};
