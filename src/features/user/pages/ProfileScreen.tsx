import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  User as UserIcon,
  Camera,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import { fetchUserDetail } from '../../../store/slices/userSlice';
import { setActiveConversation } from '../../../store/slices/messagingSlice';
import { generateDirectChatId } from '../../messages/utils/chatId';
import { UserAvatar } from '../../../components/UserAvatar';
import { FeedItem } from '../../feed/components/FeedItem';
import { demoFeedItems } from '../../feed/data';
import { uploadService } from '../../../api/upload.service';
import { UserService } from '../api/user.service';
import { RelationshipActions } from '../components/RelationshipActions';
import { RelationshipService } from '../api/relationship.service';
import { showSuccess, showError } from '../../../store/slices/uiSlice';
import { compressFileIfNeeded } from '../../../common/utils/fileCompression';
import type { 
  UserAddressResponse, 
  UserSkillResponse,
  UserDetailResponse
} from '../types';
import './ProfileScreen.css';
import { useFormatDate } from '../../../common/hooks/useFormatDate';

export const ProfileScreen: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { format } = useFormatDate();
  const { id: currentUserId, userDetail: currentUserDetail, userDetailLoading: currentUserLoading } = useSelector(
    (state: RootState) => state.user
  );

  const [externalUserDetail, setExternalUserDetail] = useState<UserDetailResponse | null>(null);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const isOwnProfile = !userId || userId === currentUserId;
  const effectiveUserId = isOwnProfile ? currentUserId : userId;
  const userDetail = isOwnProfile ? currentUserDetail : externalUserDetail;
  const isLoading = isOwnProfile ? currentUserLoading : externalLoading;
  const hasError = isOwnProfile ? false : !!externalError;

  const [isUploading, setIsUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [localAddresses, setLocalAddresses] = useState<UserAddressResponse[]>([]);
  const [localSkills, setLocalSkills] = useState<UserSkillResponse[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newAddress, setNewAddress] = useState({ addressType: 'HOME', addressLine1: '', city: '', country: '', postalCode: '' });
  const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: 'BEGINNER', yearsOfExperience: 0 });

  useEffect(() => {
    if (isOwnProfile) {
      if (currentUserId && !currentUserDetail) {
        dispatch(fetchUserDetail(currentUserId));
      }
    } else if (userId) {
      fetchExternalUser(userId);
      checkBlockStatus(userId);
    }
  }, [userId, isOwnProfile, currentUserId, currentUserDetail, dispatch]);

  const fetchExternalUser = async (uid: string) => {
    try {
      setExternalLoading(true);
      setExternalError(null);
      const res = await UserService.getUserDetail(uid);
      if (res.success) {
        setExternalUserDetail(res.data);
      } else {
        setExternalError(res.message || 'Failed to fetch user profile');
      }
    } catch (err: any) {
      setExternalError(err.message || 'Error occurred');
    } finally {
      setExternalLoading(false);
    }
  };

  const handleStatusChange = (status: any) => {
    if (status.isBlocking || status.isBlockedBy) {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
    }
  };

  const handleMessageClick = () => {
    if (!userId || !currentUserId) return;
    const chatId = generateDirectChatId(currentUserId, userId);
    dispatch(setActiveConversation(chatId));
    navigate('/messages');
  };

  const checkBlockStatus = async (uid: string) => {
    try {
      const status = await RelationshipService.getStatus(uid);
      handleStatusChange(status);
    } catch (e) {
      console.error('Failed to check block status', e);
    }
  };

  useEffect(() => {
    if (userDetail) {
      setBioValue(userDetail.userProfileResponse?.bio || '');
      setLocalAddresses(userDetail.addresses || []);
      setLocalSkills(userDetail.skills || []);
    }
  }, [userDetail]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setIsUploading(true);
    try {
      const fileToUpload = await compressFileIfNeeded(file);

      const uploadParams = await uploadService.requestUploadUrl({
        fileName: fileToUpload.name,
        fileContentType: fileToUpload.type,
        size: fileToUpload.size
      });

      if (uploadParams.success) {
        const { imageId, uploadUrl, headers } = uploadParams.data;

        await UserService.updateProfilePicture(currentUserId, imageId);

        await uploadService.uploadToGcs(
          uploadUrl,
          fileToUpload,
          headers['Content-Type'] || fileToUpload.type,
          headers
        );

        dispatch(showSuccess('Profile picture updated successfully. Finalizing metadata...'));

        setTimeout(() => {
          dispatch(fetchUserDetail(currentUserId));
          setIsUploading(false);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      dispatch(showError(error.message || 'Failed to update profile picture'));
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loading-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <AlertTriangle size={48} color="var(--error)" />
          <h3>Profile Restricted</h3>
          <p>You cannot view this profile because one of you has blocked the other.</p>
          <RelationshipActions targetId={userId!} onStatusChange={handleStatusChange} />
        </div>
      </div>
    );
  }

  if (hasError || !userDetail) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <AlertTriangle size={48} color="var(--error)" />
          <h3>Failed to load profile</h3>
          <p>{externalError || 'User data not available'}</p>
          <button className="retry-btn" onClick={() => userId && fetchExternalUser(userId)}>
            Retry
          </button>
        </div>
      </div>
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

  const handleSaveBio = () => {
    setEditingBio(false);
  };

  const handleDeleteAddress = (addrId: string) => {
    setLocalAddresses(prev => prev.filter(a => a.id !== addrId));
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
  };

  const handleDeleteSkill = (skillId: string) => {
    setLocalSkills(prev => prev.filter(s => s.id !== skillId));
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
  };

  return (
    <div className="profile-page">
      <header className="profile-header-section">
          <div className="profile-header-gradient" />
          <div className="profile-header-content">
            <div className="profile-avatar-container">
              <div 
                className={`profile-avatar-wrapper ${isUploading ? 'uploading' : ''} ${!isOwnProfile ? 'readonly' : ''}`}
                onClick={isOwnProfile ? handleAvatarClick : undefined}
                data-tooltip={isOwnProfile ? "Click to change profile picture" : ""}
              >
                <UserAvatar className="profile-avatar-large" size={200} userId={effectiveUserId || undefined} showLink={false} />
                {isOwnProfile && (
                  <div className="avatar-overlay">
                    {isUploading ? (
                      <Loader2 className="animate-spin" size={32} color="#fff" />
                    ) : (
                      <Camera size={32} color="#fff" />
                    )}
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <span className={`status-dot-large ${user.active ? 'online' : 'offline'}`} />
            </div>
            <div className="profile-info-main">
              <div className="profile-name-row">
                <div className="profile-name-container">
                  <h1>{displayName}</h1>
                  <span className="profile-username">@{user.username}</span>
                </div>
                {!isOwnProfile && userId && (
                  <div className="profile-actions-area">
                    <button className="message-btn" onClick={handleMessageClick}>
                      <MessageSquare size={18} />
                      <span>Message</span>
                    </button>
                    <RelationshipActions targetId={userId} onStatusChange={handleStatusChange} />
                  </div>
                )}
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
                    <p className="profile-bio">{bioValue || (isOwnProfile ? 'No bio yet. Click edit to add one.' : 'No bio available.')}</p>
                    {isOwnProfile && (
                      <button className="edit-inline-btn" onClick={() => setEditingBio(true)}><Edit3 size={14} /></button>
                    )}
                  </div>
                )}
              </div>

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
                    <span>{format(profile.dateOfBirth) || ''}</span>
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

        <div className="profile-content-grid">
          <aside className="profile-sidebar-column">
            <section className="profile-section-card">
              <div className="section-header-row">
                <h3 className="section-title">
                  <Home size={18} color="var(--primary)" />
                  <span>Addresses</span>
                </h3>
                {isOwnProfile && (
                  <button className="add-item-btn" onClick={() => setShowAddAddress(!showAddAddress)}>
                    {showAddAddress ? <X size={16} /> : <Plus size={16} />}
                  </button>
                )}
              </div>

              {showAddAddress && (
                <div className="add-form">
              <select value={newAddress.addressType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewAddress(p => ({ ...p, addressType: e.target.value }))}>
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
              <input placeholder="Address line 1" value={newAddress.addressLine1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAddress(p => ({ ...p, addressLine1: e.target.value }))} />
              <input placeholder="City" value={newAddress.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAddress(p => ({ ...p, city: e.target.value }))} />
              <input placeholder="Country" value={newAddress.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAddress(p => ({ ...p, country: e.target.value }))} />
              <input placeholder="Postal code" value={newAddress.postalCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAddress(p => ({ ...p, postalCode: e.target.value }))} />
                  <button className="save-btn" onClick={handleAddAddress}><Check size={14} /> Add</button>
                </div>
              )}

              <div className="items-list">
                {localAddresses.map(addr => (
                  <div key={addr.id} className="detail-card">
                    <div className="detail-card-header">
                      <span className={`type-badge ${addr.addressType.toLowerCase()}`}>{addr.addressType}</span>
                      {addr.primary && <span className="primary-badge">Primary</span>}
                      {isOwnProfile && <button className="delete-btn" onClick={() => handleDeleteAddress(addr.id)}><Trash2 size={14} /></button>}
                    </div>
                    <p className="detail-text">{addr.addressLine1}</p>
                    <p className="detail-sub">{addr.city}, {addr.country} {addr.postalCode}</p>
                  </div>
                ))}
                {localAddresses.length === 0 && <p className="empty-text">No addresses added</p>}
              </div>
            </section>

            <section className="profile-section-card">
              <div className="section-header-row">
                <h3 className="section-title">
                  <Cpu size={18} color="var(--primary)" />
                  <span>Skills</span>
                </h3>
                {isOwnProfile && (
                  <button className="add-item-btn" onClick={() => setShowAddSkill(!showAddSkill)}>
                    {showAddSkill ? <X size={16} /> : <Plus size={16} />}
                  </button>
                )}
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

            {userDetail.employments.length > 0 && (
              <section className="profile-section-card">
                <h3 className="section-title">
                  <Briefcase size={18} color="var(--primary)" />
                  <span>Employment</span>
                </h3>
                <div className="items-list">
                  {userDetail.employments.map((emp: any) => (
                    <div key={emp.id} className="detail-card">
                      <h4 className="detail-title">{emp.jobTitle}</h4>
                      <p className="detail-sub">{emp.organizationName} • {emp.departmentName}</p>
                      <div className="employment-meta-row">
                        <span className="type-badge">{emp.employmentType.replace('_', ' ')}</span>
                        <span className="detail-sub">Since {format(emp.hireDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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

          <main className="profile-main-column">
            <div className="profile-feed-header">
              <h2>{isOwnProfile ? 'My Syncs' : `${user.firstName}'s Syncs`}</h2>
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
  );
};
