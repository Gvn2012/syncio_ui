import { Layout } from '../../../components/Layout';
import { FeedItem } from '../components/FeedItem';
import { demoFeedItems } from '../data';
import { Plus, Filter, ArrowUpDown, Search } from 'lucide-react';
import './FeedScreen.css';
import { Link } from 'react-router-dom';

export const FeedScreen: React.FC = () => {

 
  return (
    <Layout>
      <div className="feed-view">
        <header className="feed-header-bar">
          <div className="header-title">
            <h2>Sync Feed</h2>
            <span className="count-badge">{demoFeedItems.length} Syncs</span>
          </div>
          
          <div className="header-actions">
            <div className="search-pill">
              <Search size={16} />
              <input type="text" placeholder="Filter syncs..." />
            </div>
            <button className="action-btn">
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="action-btn">
              <ArrowUpDown size={18} />
              <span>Sort</span>
            </button>
            <Link to="/create-post" className="create-sync-btn-link">
              <button className="create-sync-btn">
                <Plus size={18} />
                <span>Create Sync</span>
              </button>
            </Link>
          </div>
        </header>
        
        <div className="feed-container">
          <div className="feed-main">
            {demoFeedItems.map((post) => (
              <FeedItem key={post.id} post={post} />
            ))}
          </div>
          
          <aside className="feed-sidebar">
            <div className="sidebar-card status-sync-card">
              <h3>Sync Status</h3>
              <p>Everything is up to date in your curated workspace. Your focal synchronization is at 100% architectural parity.</p>
            </div>
            
            <div className="sidebar-card">
              <h3>Active Collaborators</h3>
              <div className="collaborators-list">
                <div className="collaborator">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" alt="Elena" />
                  <span>Elena Vance</span>
                </div>
                <div className="collaborator">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" alt="Marcus" />
                  <span>Marcus Chen</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};
