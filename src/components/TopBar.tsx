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
import './TopBar.css';

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

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
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search curated syncs..." 
            className="search-input"
          />
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
