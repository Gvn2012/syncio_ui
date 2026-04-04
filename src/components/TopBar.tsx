import React from 'react';
import { 
  Search, 
  Bell, 
  Mail, 
  Settings 
} from 'lucide-react';
import './TopBar.css';

export const TopBar: React.FC = () => {
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
        <button className="icon-btn">
          <Settings size={20} />
        </button>
        
        <div className="user-profile">
          <img 
            src="https://ui-avatars.com/api/?name=User&background=2596be&color=fff" 
            alt="User Profile" 
            className="avatar" 
          />
        </div>
      </div>
    </header>
  );
};
