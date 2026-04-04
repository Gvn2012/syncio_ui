import { Layout } from './components/Layout'
import './App.css'

function App() {
  return (
    <Layout>
      <div className="feed-view">
        <header className="page-header">
          <h2>Feed</h2>
          <p>Welcome back! Here's what's happening in your curated workspace.</p>
        </header>
        
        <div className="feed-grid">
          {/* Post Content Placeholder */}
          <div className="empty-state">
            <div className="empty-illustration"></div>
            <h3>Your feed is empty</h3>
            <p>Ready to sync? Create your first post to start the conversation.</p>
            <button className="primary-btn">Create a Post</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default App
