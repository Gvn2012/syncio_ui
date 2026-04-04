import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Shield,
  Users,
  Clock,
  Calendar,
  Search,
  X,
  MapPin,
  FileText,
  CheckSquare,
  BarChart3,
  Megaphone,
  Plus
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setLightboxImage } from '../../../store/slices/uiSlice';
import { CategorySelector } from '../components/create/CategorySelector';
import { CategorySpecificForms } from '../components/create/CategorySpecificForms';
import { PostCategory } from '../types';
import { PostVisibility, PostPriority } from '../types/post-request.types';
import { currentUser } from '../../user/data';
import './CreatePostScreen.css';

export const CreatePostScreen: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<PostCategory>(PostCategory.NORMAL);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);
  const [categoryData, setCategoryData] = useState<any>({
    priority: PostPriority.MEDIUM,
    options: ['', ''],
    dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]); // Primary roles: Assignees, Participants, or generic Tags
  const [secondaryUserIds, setSecondaryUserIds] = useState<string[]>([]); // Secondary roles: Watchers or Co-Organizers
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16)); // +1 hour
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<'primary' | 'secondary'>('primary');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Media State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();

  const mockUsers = [
    { id: 'u2', name: 'Marcus Chen', role: 'Product Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
    { id: 'u3', name: 'Elena Vance', role: 'Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
    { id: 'u4', name: 'Sarah Jenkins', role: 'Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'u5', name: 'David Smith', role: 'DevOps', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 'u6', name: 'Lisa Ray', role: 'Marketing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    { id: 'u7', name: 'Tom Hardy', role: 'Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
  ];

  const filteredUsers = mockUsers.filter(u => 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.role.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !taggedUserIds.includes(u.id) &&
    !secondaryUserIds.includes(u.id)
  );

  const handleToggleTag = (userId: string, role: 'primary' | 'secondary' = 'primary') => {
    if (role === 'primary') {
      setTaggedUserIds(prev => 
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    } else {
      setSecondaryUserIds(prev => 
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    }
  };

  const categories = [
    { id: PostCategory.NORMAL, label: 'Feed Post', icon: FileText, color: '#2596be' },
    { id: PostCategory.TASK, label: 'Task Sync', icon: CheckSquare, color: '#f59e0b' },
    { id: PostCategory.EVENT, label: 'Event Sync', icon: Calendar, color: '#8b5cf6' },
    { id: PostCategory.POLL, label: 'Interactive Poll', icon: BarChart3, color: '#10b981' },
    { id: PostCategory.ANNOUNCEMENT, label: 'Announcement', icon: Megaphone, color: '#ef4444' },
  ];

  const getTagLabels = () => {
    switch(category) {
      case PostCategory.TASK: 
        return { primary: 'Assignees', secondary: 'Watchers', icon: Users };
      case PostCategory.EVENT: 
        return { primary: 'Participants', secondary: 'Co-Organizers', icon: Users };
      default: 
        return { primary: 'Collaborators', secondary: '', icon: Users };
    }
  };

  const tagLabels = getTagLabels();
  const hasLocationFeature = category !== PostCategory.TASK;
  const isLocationRequired = category === PostCategory.EVENT;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        alert("Unable to retrieve your location");
      }
    );
  };

  // Media Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Limit to 10 images
    const newFiles = [...selectedFiles, ...files].slice(0, 10);
    setSelectedFiles(newFiles);

    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 10));
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviews([]);
  };

  // Cleanup effect for Blob URLs
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const isSchedulingEligible = category === PostCategory.NORMAL || category === PostCategory.ANNOUNCEMENT;

  const handleCategoryChange = (newCategory: PostCategory) => {
    setCategory(newCategory);
    // Reset scheduling if no longer eligible
    if (newCategory === PostCategory.TASK || newCategory === PostCategory.EVENT || newCategory === PostCategory.POLL) {
      setIsScheduled(false);
    }
  };

  const handleSubmit = async () => {
    // Validation for Events
    if (category === PostCategory.EVENT && !location) {
      alert('Location mapping is mandatory for Sync Events to ensure venue clarity.');
      return;
    }

    setIsSubmitting(true);
    
    // Step 1: Base Post Creation
    console.log('Step 1: POST /api/v1/posts', {
      content,
      postCategory: category,
      visibility,
      orgId: 'mock-org-uuid',
      latitude: location?.lat,
      longitude: location?.lng,
      taggedUserIds,
      media: selectedFiles,
      watchers: secondaryUserIds, // Map secondary role to watchers for tasks
      coOrganizers: secondaryUserIds // Map secondary role to co-organizers for events
    });

    // Step 2: Category Extension (Simulated)
    setTimeout(() => {
      if (category !== PostCategory.NORMAL) {
        console.log(`Step 2: POST /api/v1/posts/${category.toLowerCase()}s/ID`, categoryData);
      }
      
      setIsSubmitting(false);
      navigate('/');
    }, 1200);
  };

  return (
    <div className="create-post-page">
      {/* Header (Full Width) */}
      <div className="create-header">
        <div className="header-left">
          <button className="cancel-pill-btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <h1>Create New Sync</h1>
        </div>
        <button 
          className={`submit-btn ${isSubmitting ? 'loading' : ''} ${isScheduled ? 'scheduled' : ''}`}
          onClick={handleSubmit}
          disabled={(!content && category === PostCategory.NORMAL && selectedFiles.length === 0) || isSubmitting}
        >
          {isSubmitting ? 'Syncing...' : (
            <>{isScheduled ? <Clock size={16} /> : <Send size={16} />} {isScheduled ? 'Schedule Sync' : 'Share Sync'}</>
          )}
        </button>
      </div>

      <div className="create-post-container">
        <div className="create-content-grid">
          {/* Main Form Area */}
          <div className="main-form-surface">
            <CategorySelector selected={category} onSelect={handleCategoryChange} />
            
            {category === PostCategory.NORMAL && (
              <div className="editor-container">
                <textarea 
                  className="content-textarea"
                  placeholder="What's happening in your organization?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            )}

            <CategorySpecificForms 
              category={category}
              data={categoryData}
              onChange={setCategoryData}
            />

            {/* Universal Media & Location Toolbar (Always Visible) */}
            <div className="universal-form-footer">
              {previews.length > 0 && (
                <>
                  <div className="tray-header">
                    <div className="tray-info">
                      Attached Media ({previews.length})
                    </div>
                    <button className="clear-all-btn" onClick={clearAllFiles} title="Purge all attachments">
                      <Plus size={14} style={{ transform: 'rotate(45deg)' }} /> Clear All
                    </button>
                  </div>
                  <div className="media-preview-tray">
                    {previews.map((url, i) => (
                      <div 
                        key={url} 
                        className="preview-thumb"
                        style={{ animationDelay: `${i * 0.05}s` }}
                        onClick={() => dispatch(setLightboxImage(url))}
                      >
                        <img src={url} alt="Selection" />
                        <button className="remove-thumb" onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {previews.length > 0 && previews.length < 10 && (
                      <button className="add-more-thumb" onClick={() => fileInputRef.current?.click()}>
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                </>
              )}

              <div className="form-action-bar">
                <div className="toolbar">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileSelect}
                  />
                  <button className="tool-btn" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon size={18} />
                  </button>
                  <button className="tool-btn"><LinkIcon size={18} /></button>
                  {hasLocationFeature && (
                    <button 
                      className={`tool-btn ${location ? 'active' : ''} ${isLocating ? 'locating' : ''} ${isLocationRequired && !location ? 'required-blink' : ''}`}
                      onClick={handleGetLocation}
                      title={isLocationRequired ? "Location Required" : "Add Location"}
                    >
                      <MapPin size={18} />
                    </button>
                  )}
                </div>

                <div className="visibility-picker">
                  <select 
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                  >
                    <option value={PostVisibility.PUBLIC}>Public Feed</option>
                    <option value={PostVisibility.ORGANIZATION}>Organization Only</option>
                    <option value={PostVisibility.PRIVATE}>Private (Draft)</option>
                  </select>
                </div>
              </div>

              {location && (
                <div className="location-ribbon">
                  <div className="loc-info">
                    <MapPin size={12} />
                    <span>Sync Site: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                  </div>
                  <button className="remove-loc" onClick={() => setLocation(null)}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info / Preview */}
          <div className="create-sidebar">
            {/* Tagging Section - Hidden for Announcements (Team Updates) */}
            {category !== PostCategory.ANNOUNCEMENT && (
              <div className="sidebar-card-interactive">
                <h3><tagLabels.icon size={14} /> {tagLabels.primary} {tagLabels.secondary && `& ${tagLabels.secondary}`}</h3>
                
                <div className="tagging-system">
                  {/* Role Selector for Task/Event */}
                  {tagLabels.secondary && (
                    <div className="role-switcher">
                      <button 
                        className={`role-btn ${activeRole === 'primary' ? 'active' : ''}`}
                        onClick={() => setActiveRole('primary')}
                      >
                        {tagLabels.primary}
                      </button>
                      <button 
                        className={`role-btn ${activeRole === 'secondary' ? 'active' : ''}`}
                        onClick={() => setActiveRole('secondary')}
                      >
                        {tagLabels.secondary}
                      </button>
                    </div>
                  )}

                  {/* Selected Tags Display */}
                  <div className="multi-role-tags">
                    {/* Primary Pills */}
                    {taggedUserIds.length > 0 && (
                      <div className="tagged-pills-container">
                        <span className="role-sublabel">{tagLabels.primary}:</span>
                        {taggedUserIds.map(id => (
                          <button key={id} className="tagged-pill" onClick={() => handleToggleTag(id, 'primary')}>
                            <span>{mockUsers.find(u => u.id === id)?.name}</span>
                            <X size={12} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Secondary Pills */}
                    {secondaryUserIds.length > 0 && (
                      <div className="tagged-pills-container secondary">
                        <span className="role-sublabel">{tagLabels.secondary}:</span>
                        {secondaryUserIds.map(id => (
                          <button key={id} className="tagged-pill alt" onClick={() => handleToggleTag(id, 'secondary')}>
                            <span>{mockUsers.find(u => u.id === id)?.name}</span>
                            <X size={12} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="tag-search-box">
                    <div className="search-input-wrapper">
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder={`Pick ${activeRole === 'primary' ? tagLabels.primary : tagLabels.secondary}...`} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                      />
                    </div>

                    {/* Dropdown Results */}
                    {isDropdownOpen && (searchQuery || filteredUsers.length > 0) && (
                      <div className="user-dropdown-results">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                            <button 
                              key={user.id} 
                              className="dropdown-user-item"
                              onClick={() => {
                                handleToggleTag(user.id, activeRole);
                                setSearchQuery('');
                                setIsDropdownOpen(false);
                              }}
                            >
                              <img src={user.avatar} alt={user.name} />
                              <div className="u-info">
                                <span className="u-name">{user.name}</span>
                                <span className="u-role">{user.role}</span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="no-results">No colleagues found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Backdrop to close dropdown */}
                {isDropdownOpen && (
                  <div className="dropdown-backdrop" onClick={() => setIsDropdownOpen(false)} />
                )}
              </div>
            )}

            {/* Scheduling Section */}
            {isSchedulingEligible && (
              <div className="sidebar-card-interactive">
                <div className="card-header-toggle">
                  <h3><Clock size={14} /> Schedule Sync</h3>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                {isScheduled && (
                  <div className="schedule-picker-input">
                    <Calendar size={14} />
                    <input 
                      type="datetime-local" 
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="preview-card-status">
              <h3>Post Preview</h3>
              <div className={`preview-placeholder preview-category-${category.toLowerCase()}`}>
                <div className="preview-header">
                  <img src={currentUser.profile?.avatarUrl} alt="You" className="p-avatar-img" />
                  <div className="p-info">
                    <div className="p-name">You</div>
                    <div className="p-meta">
                      {isScheduled ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : 'Sharing to Digital Curator'}
                    </div>
                  </div>
                  {category !== PostCategory.NORMAL && (
                    <div className="p-category-badge" style={{ backgroundColor: categories.find(l => l.id === category)?.color }}>
                      {category === PostCategory.ANNOUNCEMENT ? (categoryData.scope || 'ORGANIZATION') : category}
                    </div>
                  )}
                </div>

                <div className="p-body-full">
                  {/* Category-Specific Preview Display */}
                  {category === PostCategory.NORMAL && (
                    <div className="p-content">{content || (previews.length > 0 ? '' : 'Your content will appear here...')}</div>
                  )}

                  {category === PostCategory.TASK && (
                    <div className="p-task-preview">
                      <div className="p-title">{categoryData.title || 'Untitled Task'}</div>
                      <div className="p-task-meta">
                        <span className={`p-priority p-priority-${categoryData.priority?.toLowerCase()}`}>
                          {categoryData.priority || 'MEDIUM'}
                        </span>
                        {categoryData.dueAt && (
                          <span className="p-due">Due: {new Date(categoryData.dueAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {category === PostCategory.EVENT && (
                    <div className="p-event-preview">
                      <div className="p-title">{categoryData.title || 'Untitled Event'}</div>
                      <div className="p-event-times">
                        <Calendar size={12} />
                        <span>
                          {categoryData.startAt ? new Date(categoryData.startAt).toLocaleString() : 'TBD'} 
                          {categoryData.endAt ? ` - ${new Date(categoryData.endAt).toLocaleString()}` : ''}
                        </span>
                      </div>
                      {location && (
                        <div className="p-location-badge">
                          <MapPin size={10} />
                          <span>Sync Site: {location.lat.toFixed(2)}, {location.lng.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {category === PostCategory.POLL && (
                    <div className="p-poll-preview">
                      <div className="p-question">{categoryData.question || 'Poll Question?'}</div>
                      <div className="p-poll-options">
                        {(categoryData.options || ['', '']).map((opt: string, i: number) => (
                          <div key={i} className="p-poll-opt">
                            <div className="p-radio"></div>
                            <span>{opt || `Option ${i + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {category === PostCategory.ANNOUNCEMENT && (
                    <div className="p-announcement-preview">
                      <div className="p-announcement-header">OFFICIAL STATEMENT</div>
                      <div className="p-title">{categoryData.title || 'Drafting Official Title...'}</div>
                      <div className="p-content">{categoryData.content || 'Official Statement Pending...'}</div>
                    </div>
                  )}

                  {/* Media Preview Grid - Now anchored below content */}
                  {previews.length > 0 && (
                    <div className="p-media-grid-row" data-count={previews.length}>
                      {/* Image 0: Always focal and clear */}
                      <div className="p-media-item p-item-focal" onClick={() => dispatch(setLightboxImage(previews[0]))}>
                        <img src={previews[0]} alt="Selection" />
                      </div>

                      {/* Image 2+ Slot: Counter and auxiliary preview */}
                      {previews.length > 1 && (
                        <div className="p-media-item p-item-aux" onClick={() => dispatch(setLightboxImage(previews[1]))}>
                          <img src={previews[1]} alt="Selection" />
                          {previews.length > 2 && (
                            <div className="p-media-overlay">
                              <span>+{previews.length - 1}</span>
                              <div className="p-media-overlay-label">Others</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="preview-footer-metadata">
                  {taggedUserIds.length > 0 && (
                    <div className="p-tags">
                      {tagLabels.primary}: {taggedUserIds.map(id => mockUsers.find(u => u.id === id)?.name).join(', ')}
                    </div>
                  )}
                  {secondaryUserIds.length > 0 && (
                    <div className="p-tags secondary">
                       {tagLabels.secondary}: {secondaryUserIds.map(id => mockUsers.find(u => u.id === id)?.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="guidelines-card">
              <h3><Shield size={14} /> Organization Rules</h3>
              <ul>
                <li>Keep Syncs professional and concise.</li>
                <li>Tag appropriate departments for Tasks.</li>
                <li>Announcements require admin verification.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
