import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Mail, 
  Settings,
  UserRound,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { logout, fetchUserDetail } from '../store/slices/userSlice';
import { UserAvatar } from './UserAvatar';
import { useDebounce } from '../hooks/useDebounce';
import { SearchService } from '../features/search/api/search.service';
import type { UniversalSearchResponse } from '../features/search/api/types';
import { 
  Users, 
  FileText, 
  Loader2, 
  XCircle,
  Clock
} from 'lucide-react';
import './TopBar.css';
import { CachedImage } from './common/CachedImage';

export const TopBar: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id, userDetail } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (id && !userDetail) {
      dispatch(fetchUserDetail(id));
    }
  }, [id, userDetail, dispatch]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UniversalSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults(null);
        setIsResultsOpen(false);
        return;
      }

      setIsSearching(true);
      setIsResultsOpen(true);
      try {
        const response = await SearchService.universalSearch({ 
          q: debouncedSearchQuery,
          page: 0,
          size: 5
        });
        setSearchResults(response);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsResultsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const displayName = userDetail
    ? `${userDetail.userResponse.firstName} ${userDetail.userResponse.lastName}`
    : 'User';

  const userRole = userDetail?.employments?.[0]?.jobTitle || 'Member';

  return (
    <header className="topbar">
      <div className="topbar-search">
        <div className="search-container" ref={searchContainerRef}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search people or posts (@ for username)..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setIsResultsOpen(true);
            }}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setIsResultsOpen(false);
              }}
            >
              <XCircle size={16} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {isResultsOpen && searchQuery.trim() && (
            <div className="search-results-dropdown">
              {isSearching ? (
                <div className="search-status">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="search-results-scrollable">
                  {!searchResults || (searchResults.people.length === 0 && searchResults.posts.length === 0) ? (
                    <div className="search-status">
                      <span>No results found for "{searchQuery}"</span>
                    </div>
                  ) : (
                    <div className="search-results-content">
                      {/* People Section */}
                      {searchResults.people.length > 0 && (
                        <div className="results-section">
                          <div className="section-header">
                            <Users size={14} />
                            <span>People</span>
                          </div>
                          {searchResults.people.map(person => (
                            <div 
                              key={person.id} 
                              className="result-item person" 
                              onClick={() => {
                                setIsResultsOpen(false);
                                navigate(`/profile/${person.id}`);
                              }}
                            >
                              <CachedImage 
                                src={person.avatarUrl || undefined} 
                                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName)}&background=random`}
                                alt={person.fullName} 
                                className="result-avatar"
                              />
                              <div className="result-info">
                                <span className="result-title">{person.fullName}</span>
                                <span className="result-subtitle">@{person.username}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Posts Section */}
                      {searchResults.posts.length > 0 && (
                        <div className="results-section">
                          <div className="section-header">
                            <FileText size={14} />
                            <span>Posts</span>
                          </div>
                          {searchResults.posts.map(post => (
                            <div key={post.id} className="result-item post">
                              <div className="result-info">
                                <p className="result-text">{post.content}</p>
                                <div className="result-meta">
                                  <Clock size={12} />
                                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="results-footer">
                        <span>
                          Found {searchResults.totalPeople} people and {searchResults.totalPosts} posts 
                          ({searchResults.processingTimeMs}ms)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-actions">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge"></span>
        </button>
        <button className="icon-btn">
          <Mail size={20} />
        </button>
        <Link to="/settings" className="icon-btn desktop-only">
          <Settings size={20} />
        </Link>
        
        <div className="user-profile-orchestrator" ref={dropdownRef}>
          <div 
            className={`profile-trigger ${isProfileOpen ? 'active' : ''}`}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="avatar-wrapper">
              <UserAvatar className="avatar" size={40} />
            </div>
            <div className="profile-info desktop-only">
              <span className="username">{displayName}</span>
              <span className="user-role">{userRole}</span>
            </div>
            <ChevronDown size={14} className={`chevron-icon ${isProfileOpen ? 'rotate' : ''}`} />
          </div>

          {isProfileOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header mobile-only">
                <span className="header-username">{displayName}</span>
                <span className="header-role">{userRole}</span>
              </div>
              <div className="dropdown-divider mobile-only"></div>
              
              <button 
                className="dropdown-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/profile');
                }}
              >
                <UserRound size={18} />
                <span>View Profile</span>
              </button>
              
              <Link 
                to="/settings" 
                className="dropdown-item mobile-only"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
