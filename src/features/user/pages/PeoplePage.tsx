import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  Clock, 
  Check, 
  X, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Layout } from '../../../components/Layout';
import { RelationshipService } from '../api/relationship.service';
import type { 
  RelationshipUserSummaryResponse, 
  PendingFriendRequestResponse,
  PageResponse
} from '../api/types';
import type { RootState } from '../../../store';
import { UserAvatar } from '../../../components/UserAvatar';
import { showError, showSuccess } from '../../../store/slices/uiSlice';
import './PeoplePage.css';

type TabType = 'friends' | 'requests_received' | 'requests_sent' | 'following' | 'followers' | 'blocked';

export const PeoplePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: currentUserId } = useSelector((state: RootState) => state.user);
  
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  
  // Data states
  const [friendsData, setFriendsData] = useState<PageResponse<RelationshipUserSummaryResponse> | null>(null);
  const [followersData, setFollowersData] = useState<PageResponse<RelationshipUserSummaryResponse> | null>(null);
  const [pendingReceivedData, setPendingReceivedData] = useState<PageResponse<PendingFriendRequestResponse> | null>(null);
  const [pendingSentData, setPendingSentData] = useState<PageResponse<PendingFriendRequestResponse> | null>(null);
  
  // NOTE: Backend doesn't have paged following/blocked yet, so we'll store them as simple lists if needed
  // or just use the currentUserId to get counts if possible.
  
  const fetchData = useCallback(async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const res = await RelationshipService.getFriendsPage(currentUserId, page, pageSize);
        if (res.success) setFriendsData(res.data);
        console.log(res.data);
      } else if (activeTab === 'followers') {
        const res = await RelationshipService.getFollowersPage(currentUserId, page, pageSize);
        if (res.success) setFollowersData(res.data);
      } else if (activeTab === 'requests_received') {
        const res = await RelationshipService.getPendingRequests('RECEIVED', page, pageSize);
        if (res.success) setPendingReceivedData(res.data);
      } else if (activeTab === 'requests_sent') {
        const res = await RelationshipService.getPendingRequests('SENT', page, pageSize);
        if (res.success) setPendingSentData(res.data);
      }
      // 'following' and 'blocked' tabs would go here if endpoints were paged
    } catch (error: any) {
      dispatch(showError(error.message || 'Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUserId, page, pageSize, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    try {
      const res = await action();
      if (res.success) {
        dispatch(showSuccess(successMsg));
        fetchData();
      } else {
        dispatch(showError(res.message || 'Action failed'));
      }
    } catch (error: any) {
      dispatch(showError(error?.response?.data?.message || error.message || 'Action failed'));
    }
  };

  const renderPagination = (data: PageResponse<any> | null) => {
    if (!data || data.totalPages <= 1) return null;
    
    return (
      <div className="pagination-footer">
        <button 
          className="page-btn" 
          disabled={!data.hasPrevious || loading}
          onClick={() => setPage(prev => prev - 1)}
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>
        <span className="page-info">
          Page {data.page + 1} of {data.totalPages}
        </span>
        <button 
          className="page-btn" 
          disabled={!data.hasNext || loading}
          onClick={() => setPage(prev => prev + 1)}
        >
          <span>Next</span>
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="empty-state">
      <div className="empty-icon">
        <Users size={48} />
      </div>
      <h3>No people found</h3>
      <p>{message}</p>
    </div>
  );

  const renderFriendsTab = () => {
    if (loading && !friendsData) return <div className="loading-spinner-container"><div className="loading-spinner" /></div>;
    if (!friendsData || friendsData.content.length === 0) return renderEmptyState("You haven't added any friends yet. Start connecting!");
    
    return (
      <div className="people-content">
        {friendsData.content.map(friend => (
          <div key={friend.userId} className="person-card">
            <Link to={`/profile/${friend.userId}`} className="person-avatar-link">
              <UserAvatar size={64} userId={friend.userId} src={friend.profilePictureUrl || undefined} showLink={false} />
            </Link>
            <div className="person-info">
              <Link to={`/profile/${friend.userId}`} className="person-name">{friend.displayName}</Link>
              <span className="person-username">@{friend.username}</span>
              <div className="person-meta">
                <span className="rel-badge friend">Friend</span>
              </div>
            </div>
            <div className="person-actions">
              <button 
                className="action-btn-sm" 
                onClick={() => handleAction(() => RelationshipService.unfriend(friend.userId), "Friend removed")}
                title="Unfriend"
              >
                <UserMinus size={18} />
              </button>
              <button 
                className="action-btn-sm danger" 
                onClick={() => handleAction(() => RelationshipService.block(friend.userId), "User blocked")}
                title="Block"
              >
                <ShieldAlert size={18} />
              </button>
            </div>
          </div>
        ))}
        {renderPagination(friendsData)}
      </div>
    );
  };

  const renderFollowersTab = () => {
    if (loading && !followersData) return <div className="loading-spinner-container"><div className="loading-spinner" /></div>;
    if (!followersData || followersData.content.length === 0) return renderEmptyState("No one is following you yet. Share your profile to get followers!");
    
    return (
      <div className="people-content">
        {followersData.content.map(follower => (
          <div key={follower.userId} className="person-card">
            <Link to={`/profile/${follower.userId}`} className="person-avatar-link">
              <UserAvatar size={64} userId={follower.userId} src={follower.profilePictureUrl || undefined} showLink={false} />
            </Link>
            <div className="person-info">
              <Link to={`/profile/${follower.userId}`} className="person-name">{follower.displayName}</Link>
              <span className="person-username">@{follower.username}</span>
              <div className="person-meta">
                <span className="rel-badge following">Follower</span>
              </div>
            </div>
            <div className="person-actions">
              <button 
                className="action-btn-sm" 
                onClick={() => handleAction(() => RelationshipService.follow(follower.userId), "Following user")}
                title="Follow Back"
              >
                <UserPlus size={18} />
              </button>
            </div>
          </div>
        ))}
        {renderPagination(followersData)}
      </div>
    );
  };

  const renderRequestsReceivedTab = () => {
    if (loading && !pendingReceivedData) return <div className="loading-spinner-container"><div className="loading-spinner" /></div>;
    if (!pendingReceivedData || pendingReceivedData.content.length === 0) return renderEmptyState("No pending friend requests received.");
    
    return (
      <div className="people-content">
        {pendingReceivedData.content.map(req => (
          <div key={req.requestId} className="request-card">
            <div className="request-header">
              <UserAvatar size={48} userId={req.otherUserId} src={req.profilePictureUrl || undefined} />
              <div className="request-user-info">
                <Link to={`/profile/${req.otherUserId}`} className="person-name">{req.displayName}</Link>
                <span className="person-username">@{req.username} • {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {req.message && <div className="request-message">{req.message}</div>}
            <div className="request-actions">
              <button 
                className="req-btn accept" 
                onClick={() => handleAction(() => RelationshipService.acceptFriendRequest(req.requestId), "Friend request accepted")}
              >
                <Check size={18} />
                <span>Accept</span>
              </button>
              <button 
                className="req-btn decline" 
                onClick={() => handleAction(() => RelationshipService.declineFriendRequest(req.requestId), "Friend request declined")}
              >
                <X size={18} />
                <span>Decline</span>
              </button>
            </div>
          </div>
        ))}
        {renderPagination(pendingReceivedData)}
      </div>
    );
  };

  const renderRequestsSentTab = () => {
    if (loading && !pendingSentData) return <div className="loading-spinner-container"><div className="loading-spinner" /></div>;
    if (!pendingSentData || pendingSentData.content.length === 0) return renderEmptyState("No outgoing friend requests.");
    
    return (
      <div className="people-content">
        {pendingSentData.content.map(req => (
          <div key={req.requestId} className="request-card">
            <div className="request-header">
              <UserAvatar size={48} userId={req.otherUserId} src={req.profilePictureUrl || undefined} />
              <div className="request-user-info">
                <Link to={`/profile/${req.otherUserId}`} className="person-name">{req.displayName}</Link>
                <span className="person-username">@{req.username} • Sent on {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {req.message && <div className="request-message">{req.message}</div>}
            <div className="request-actions">
              <button 
                className="req-btn cancel" 
                onClick={() => handleAction(() => RelationshipService.declineFriendRequest(req.requestId), "Friend request cancelled")}
              >
                <X size={18} />
                <span>Cancel Request</span>
              </button>
            </div>
          </div>
        ))}
        {renderPagination(pendingSentData)}
      </div>
    );
  };

  // Mock for Tabs not fully supported by paged backend yet
  const renderSimpleTab = (title: string, message: string) => (
    <div className="people-content">
      <div className="empty-state">
        <div className="empty-icon">
          <Users size={48} />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="people-page">
        <header className="people-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1>People</h1>
          <p>Manage your connections, followers, and requests.</p>
        </header>

        <nav className="people-tabs">
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => handleTabChange('friends')}
          >
            <UserCheck size={18} />
            <span>Friends</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests_received' ? 'active' : ''}`}
            onClick={() => handleTabChange('requests_received')}
          >
            <Clock size={18} />
            <span>Requests Received</span>
            {(pendingReceivedData?.totalElements || 0) > 0 && (
              <span className="tab-badge received">{pendingReceivedData?.totalElements}</span>
            )}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests_sent' ? 'active' : ''}`}
            onClick={() => handleTabChange('requests_sent')}
          >
            <UserPlus size={18} />
            <span>Requests Sent</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => handleTabChange('following')}
          >
            <Users size={18} />
            <span>Following</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => handleTabChange('followers')}
          >
            <Users size={18} />
            <span>Followers</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
            onClick={() => handleTabChange('blocked')}
          >
            <ShieldOff size={18} />
            <span>Blocked</span>
          </button>
        </nav>

        <section className="people-main">
          {activeTab === 'friends' && renderFriendsTab()}
          {activeTab === 'followers' && renderFollowersTab()}
          {activeTab === 'requests_received' && renderRequestsReceivedTab()}
          {activeTab === 'requests_sent' && renderRequestsSentTab()}
          {activeTab === 'following' && renderSimpleTab("Following", "List of users you follow will appear here. Paged support coming soon.")}
          {activeTab === 'blocked' && renderSimpleTab("Blocked", "List of blocked users will appear here. Paged support coming soon.")}
        </section>
      </div>
    </Layout>
  );
};
