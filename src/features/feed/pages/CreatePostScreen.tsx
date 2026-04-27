import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Shield,
  Users,
  Calendar,
  Search,
  X,
  MapPin,
  Plus
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setLightboxImage, showError } from '../../../store/slices/uiSlice';
import { CategorySelector } from '../components/create/CategorySelector';
import { CategorySpecificForms } from '../components/create/CategorySpecificForms';
import { PostCategory } from '../types';
import { PostVisibility, type PostCreateRequest } from '../types/post-request.types';
import { FeedService } from '../api/feed.service';
import { currentUser } from '../../user/data';
import { compressFileIfNeeded } from '../../../common/utils/fileCompression';
import './CreatePostScreen.css';
import { CachedImage } from '../../../components/common/CachedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MAX_FILES, 
  MAX_SIZE_BYTES, 
  MAX_SIZE_MB, 
  MOCK_USERS,
  getDefaultCategoryData,
  CATEGORY_MAPPERS
} from '../constants/post-creation.constants';

export const CreatePostScreen: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<PostCategory>(PostCategory.NORMAL);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);


  const [categoryData, setCategoryData] = useState<any>(getDefaultCategoryData(PostCategory.NORMAL));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();

  const filteredUsers = MOCK_USERS.filter(u => 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.role.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !taggedUserIds.includes(u.id)
  );

  const handleToggleTag = (userId: string) => {
    setTaggedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const getTagLabels = () => {
    switch(category) {
      case PostCategory.TASK: 
        return { primary: 'Assignees', icon: Users };
      case PostCategory.EVENT: 
        return { primary: 'Participants', icon: Users };
      default: 
        return { primary: 'Collaborators', icon: Users };
    }
  };

  const tagLabels = getTagLabels();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incomingFiles = Array.from(e.target.files);
    

    const oversizedFiles = incomingFiles.filter(f => f.size > MAX_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      dispatch(showError({ 
        message: `Some files were skipped: Max size per file is ${MAX_SIZE_MB}MB.`,
        title: 'UPLOAD ERROR'
      }));
    }

    const validIncoming = incomingFiles.filter(f => f.size <= MAX_SIZE_BYTES);
    
    if (selectedFiles.length + validIncoming.length > MAX_FILES) {
      dispatch(showError({
        message: `You can only upload up to ${MAX_FILES} files in total.`,
        title: 'UPLOAD ERROR'
      }));
    }

    const nextFiles = [...selectedFiles, ...validIncoming].slice(0, MAX_FILES);
    setSelectedFiles(nextFiles);

    const newPreviews = validIncoming.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, MAX_FILES));
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

  useEffect(() => {
     
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleCategoryChange = (newCategory: PostCategory) => {
    setCategory(newCategory);
    setCategoryData(getDefaultCategoryData(newCategory));
  };


  const handleSubmit = async () => {

    if (category === PostCategory.NORMAL && !content && selectedFiles.length === 0) {
      dispatch(showError({
        message: 'Your post needs some content or an attachment.',
        title: 'VALIDATION ERROR'
      }));
      return;
    }
    if (category === PostCategory.ANNOUNCEMENT && !content) {
      dispatch(showError({
        message: 'Announcements require official content.',
        title: 'VALIDATION ERROR'
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata = JSON.stringify({ client: 'web', version: '1.0' });

      const request: PostCreateRequest = {
        language: 'en',
        visibility,
        postCategory: category,
        orgId: null,
        metadata,
        content: category === PostCategory.NORMAL ? content : undefined,
        contentHtml: category === PostCategory.NORMAL ? `<p>${content}</p>` : undefined,
        excerpt: category === PostCategory.NORMAL && content ? content.slice(0, 100) + (content.length > 100 ? '...' : '') : undefined,
        mentions: category === PostCategory.NORMAL ? taggedUserIds : undefined,
      };

      const extensions = CATEGORY_MAPPERS[category]?.(categoryData, taggedUserIds);
      if (extensions) {
          Object.assign(request, extensions);
      }

      let filesToUpload = selectedFiles;
      if (category === PostCategory.NORMAL && selectedFiles.length > 0) {
          filesToUpload = await Promise.all(selectedFiles.map(file => compressFileIfNeeded(file)));
      }

      if (category === PostCategory.NORMAL && filesToUpload.length > 0) {
          request.attachments = filesToUpload.map((file, i) => ({
              fileName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
              position: i + 1,
              type: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : 'FILE'
          }));
      }

      const response = await FeedService.createPost(request);
      const post = response.data;
      console.log(post);
      if (post.attachments && post.attachments.length > 0) {
          const uploadPromises = post.attachments.map(attachment => {
              if (attachment.uploadUrl) {
                  const file = attachment.position 
                    ? filesToUpload[attachment.position - 1]
                    : filesToUpload.find(f => attachment.fileName?.endsWith(f.name));
                  
                  console.log('Matching file for attachment:', attachment.fileName, file);
                  if (file) {
                      return FeedService.uploadFile(attachment.uploadUrl, file);
                  }
              }
              return Promise.resolve();
          });
          await Promise.all(uploadPromises);
      }

      setIsSubmitting(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to create post:', error);
      dispatch(showError({
        message: 'Failed to sync. Please try again.',
        title: 'SYNC ERROR'
      }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-page">
      <div className="create-header">
        <div className="header-left">
          <button className="cancel-pill-btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <h1>Create New Sync</h1>
        </div>
        <button 
          className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={((!content && category === PostCategory.NORMAL && selectedFiles.length === 0) || isSubmitting)}
        >
          {isSubmitting ? 'Syncing...' : 'Share Sync'}
        </button>
      </div>

      <div className="create-post-container">
        <div className="create-content-grid">
          <div className="main-form-surface">
            <CategorySelector selected={category} onSelect={handleCategoryChange} />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="category-specific-area"
              >
                {(category === PostCategory.NORMAL || category === PostCategory.ANNOUNCEMENT) && (
                  <div className="editor-container">
                    <textarea 
                      className="content-textarea"
                      placeholder="What do you think?"
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
              </motion.div>
            </AnimatePresence>

            {category === PostCategory.NORMAL && (
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
                      {previews.length < 10 && (
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
                      accept="image/*,video/*" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      onChange={handleFileSelect}
                    />
                    <button className="tool-btn" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon size={18} />
                    </button>
                    <button className="tool-btn"><LinkIcon size={18} /></button>
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
              </div>
            )}
          </div>

          <div className="create-sidebar">
            {category !== PostCategory.NORMAL && (
              <div className="sidebar-card-interactive">
                <h3><tagLabels.icon size={14} /> {tagLabels.primary}</h3>
                
                <div className="tagging-system">
                  <div className="multi-role-tags">
                    {taggedUserIds.length > 0 && (
                      <div className="tagged-pills-container">
                        {taggedUserIds.map(id => (
                          <button key={id} className="tagged-pill" onClick={() => handleToggleTag(id)}>
                            <span>{MOCK_USERS.find((u: any) => u.id === id)?.name}</span>
                            <X size={12} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="tag-search-box">
                    <div className="search-input-wrapper">
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder={`Find ${tagLabels.primary}...`} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                      />
                    </div>

                    {isDropdownOpen && (searchQuery || filteredUsers.length > 0) && (
                      <div className="user-dropdown-results">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                            <button 
                              key={user.id} 
                              className="dropdown-user-item"
                              onClick={() => {
                                handleToggleTag(user.id);
                                setSearchQuery('');
                                setIsDropdownOpen(false);
                              }}
                            >
                              <CachedImage src={user.avatar} alt={user.name} />
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
                {isDropdownOpen && (
                  <div className="dropdown-backdrop" onClick={() => setIsDropdownOpen(false)} />
                )}
              </div>
            )}

            <div className="preview-card-status">
              <h3>Post Preview</h3>
              <div className={`preview-placeholder preview-category-${category.toLowerCase()}`}>
                <div className="preview-header">
                  <CachedImage src={currentUser.profile?.avatarUrl} alt="You" className="p-avatar-img" />
                  <div className="p-info">
                    <div className="p-name">You</div>
                    <div className="p-meta">Sharing to Digital Curator</div>
                  </div>
                </div>

                <div className="p-body-full">
                  {(category === PostCategory.NORMAL || category === PostCategory.ANNOUNCEMENT) && (
                    <div className="p-content">{content || 'Your content will appear here...'}</div>
                  )}

                  {category === PostCategory.TASK && (
                    <div className="p-task-preview">
                      <div className="p-title">{categoryData.title || 'Untitled Task'}</div>
                      <div className="p-task-meta">
                        <span className={`p-priority p-priority-${categoryData.priority?.toLowerCase()}`}>
                          {categoryData.priority}
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
                          {categoryData.startTime ? new Date(categoryData.startTime).toLocaleString() : 'TBD'} 
                        </span>
                      </div>
                      {categoryData.location && (
                        <div className="p-location-badge">
                          <MapPin size={10} />
                          <span>{categoryData.location}</span>
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

                  {previews.length > 0 && category === PostCategory.NORMAL && (
                    <div className="p-media-grid-row" data-count={previews.length}>
                      <div className="p-media-item p-item-focal">
                        <img src={previews[0]} alt="Selection" />
                      </div>
                      {previews.length > 1 && (
                        <div className="p-media-item p-item-aux">
                          <img src={previews[1]} alt="Selection" />
                          {previews.length > 2 && (
                            <div className="p-media-overlay">
                              <span>+{previews.length - 1}</span>
                            </div>
                          )}
                        </div>
                      )}
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
