import React from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  MessageSquare, 
  BarChart3, 
  Megaphone, 
  Plus, 
  HelpCircle, 
  UserCircle,
  RefreshCw
} from 'lucide-react';
import './SideBar.css';

const navItems = [
  { id: 'feed', label: 'Feed', icon: LayoutDashboard, active: true },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'polls', label: 'Polls', icon: BarChart3 },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

export const SideBar: React.FC = () => {
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
              <a 
                href={`#${item.id}`} 
                className={`nav-item ${item.active ? 'active' : ''}`}
              >
                <item.icon size={20} className="nav-icon" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-action">
        <button className="create-post-btn">
          <Plus size={20} />
          <span>Create Post</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <ul>
          <li>
            <a href="#support" className="nav-item">
              <HelpCircle size={20} className="nav-icon" />
              <span>Support</span>
            </a>
          </li>
          <li>
            <a href="#account" className="nav-item">
              <UserCircle size={20} className="nav-icon" />
              <span>Account</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};
