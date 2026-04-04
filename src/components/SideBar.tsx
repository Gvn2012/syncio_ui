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
  User
} from 'lucide-react';
import { currentUser } from '../features/user/data';
import './SideBar.css';

const navItems = [
  { id: 'feed', label: 'Feed', icon: LayoutDashboard, path: '/' },
  { id: 'organizations', label: 'Organizations', icon: Building2, path: '/organizations' },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2, path: '/tasks' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages' },
  { id: 'polls', label: 'Polls', icon: BarChart3, path: '/polls' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/announcements' },
];

export const SideBar: React.FC = () => {
  const location = useLocation();
  const user = currentUser;

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
            <img src={user.profile?.avatarUrl} alt={user.firstName} className="user-avatar-small" />
            <div className="user-name-role">
              <span className="user-name">{user.firstName} {user.lastName}</span>
              <span className="user-role">{user.employments[0]?.jobTitle}</span>
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

