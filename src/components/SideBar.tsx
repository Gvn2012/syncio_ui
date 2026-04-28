import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  MessageSquare, 
  BarChart3, 
  Megaphone, 
  Plus, 
  HelpCircle, 
  Settings,
  RefreshCw,
  Building2,
  User,
  Users
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFriendRequestCount } from '../store/slices/notificationSlice';
import type { RootState, AppDispatch } from '../store';
import { fetchUserDetail } from '../store/slices/userSlice';
import { UserAvatar } from './UserAvatar';
import { selectTotalUnreadCount } from '../store/slices/messagingSlice';
import './SideBar.css';

const navItems = [
  { id: 'feed', label: 'Feed', icon: LayoutDashboard, path: '/' },
  { id: 'people', label: 'People', icon: Users, path: '/people' },
  { id: 'organizations', label: 'Organizations', icon: Building2, path: '/organizations' },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2, path: '/tasks' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages' },
  { id: 'polls', label: 'Polls', icon: BarChart3, path: '/polls' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/announcements' },
];

export const SideBar: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { friendRequestCount } = useSelector((state: RootState) => state.notification);
  const { id, userDetail } = useSelector((state: RootState) => state.user);
  const totalUnreadCount = useSelector(selectTotalUnreadCount);

  useEffect(() => {
    if (id && !userDetail) {
      dispatch(fetchUserDetail(id));
    }
  }, [id, userDetail, dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(fetchFriendRequestCount());
    }
  }, [id, location.pathname, dispatch]);

  const displayName = userDetail
    ? `${userDetail.userResponse.firstName} ${userDetail.userResponse.lastName}`
    : 'User';
  
  const jobTitle = userDetail?.employments?.[0]?.jobTitle || 'Member';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <RefreshCw size={24} color="#ffffff" />
          </div>
          <div className="logo-text">
            <h1>SYNCIO</h1>
            <p>CURATED WORKSPACE</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <Link 
                to={item.path} 
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={20} className="nav-icon" />
                <span>{item.label}</span>
                {item.id === 'people' && friendRequestCount > 0 && (
                  <span className="nav-badge">{friendRequestCount}</span>
                )}
                {item.id === 'messages' && totalUnreadCount > 0 && (
                  <span className="nav-badge">{totalUnreadCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {!['/'].includes(location.pathname) && (
        <div className="sidebar-action">
          <Link to="/create-post" className="create-sync-btn-link">
            <button className="create-sync-btn">
              <Plus size={18} />
              <span>Create Sync</span>
            </button>
          </Link>
        </div>
      )}


      <div className="sidebar-footer">
        <div className="user-profile-mini">
          <Link to="/profile" className="user-info-link">
            <UserAvatar className="user-avatar-small" size={32} />
            <div className="user-name-role">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{jobTitle}</span>
            </div>
          </Link>
        </div>
        
        <ul>
          <li>
            <Link to="/support" className="nav-item">
              <HelpCircle size={20} className="nav-icon" />
              <span>Support</span>
            </Link>
          </li>
          <li>
            <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              <User size={20} className="nav-icon" />
              <span>Profile</span>
            </Link>
          </li>
          <li>
            <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
              <Settings size={20} className="nav-icon" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};
