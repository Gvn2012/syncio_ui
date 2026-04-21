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
  ShieldOff,
  UserCircle
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RelationshipService } from '../api/relationship.service';
import type { 
  RelationshipUserSummaryResponse, 
  PendingFriendRequestResponse,
} from '../api/types';

import type { PageResponse } from '../../../api/types/common-types';
import type { RootState } from '../../../store';
import { UserAvatar } from '../../../components/UserAvatar';
import { showError, showSuccess } from '../../../store/slices/uiSlice';
import './PeoplePage.css';

type TabType = 'friends' | 'requests_received' | 'requests_sent' | 'following' | 'followers' | 'blocked';

export const PeoplePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: currentUserId } = useSelector((state: RootState) => state.user);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('v') as TabType) || 'friends';

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  
  // Data states
  const [friendsData, setFriendsData] = useState<PageResponse<RelationshipUserSummaryResponse> | null>(null);
  const [followersData, setFollowersData] = useState<PageResponse<RelationshipUserSummaryResponse> | null>(null);
  const [followingData, setFollowingData] = useState<PageResponse<RelationshipUserSummaryResponse> | null>(null);
  const [blockedData, setBlockedData] = useState<PageResponse<RelationshipUserSummaryResponse> | null>(null);
  const [pendingReceivedData, setPendingReceivedData] = useState<PageResponse<PendingFriendRequestResponse> | null>(null);
  const [pendingSentData, setPendingSentData] = useState<PageResponse<PendingFriendRequestResponse> | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  
  
  const fetchData = useCallback(async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      let res;
      switch (activeTab) {
        case 'friends':
          res = await RelationshipService.getFriendsPage(currentUserId, page, pageSize);
          if (res.success) setFriendsData(res.data);
          break;
        case 'followers':
          res = await RelationshipService.getFollowersPage(currentUserId, page, pageSize);
          if (res.success) setFollowersData(res.data);
          break;
        case 'following':
          res = await RelationshipService.getFollowingPage(currentUserId, page, pageSize);
          if (res.success) setFollowingData(res.data);
          break;
        case 'blocked':
          res = await RelationshipService.getBlockedPage(page, pageSize);
          if (res.success) setBlockedData(res.data);
          break;
        case 'requests_received':
          res = await RelationshipService.getPendingRequests('RECEIVED', page, pageSize);
          if (res.success) setPendingReceivedData(res.data);
          break;
        case 'requests_sent':
          res = await RelationshipService.getPendingRequests('SENT', page, pageSize);
          if (res.success) setPendingSentData(res.data);
          break;
      }
    } catch (error: any) {
      dispatch(showError(error.message || 'Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUserId, page, pageSize, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
 
  // Initial fetch for badge counts and following IDs
  useEffect(() => {
    if (currentUserId) {
      if (activeTab !== 'requests_received') {
        RelationshipService.getPendingRequests('RECEIVED', 0, 1)
          .then(res => {
            if (res.success) setPendingReceivedData(res.data);
          });
      }
      
      RelationshipService.getFollowingIds(currentUserId)
        .then(res => {
          if (res.success) setFollowingIds(res.data);
        });
    }
  }, [currentUserId]);
 
  const handleTabChange = (tab: TabType) => {
    setSearchParams({ v: tab });
    setPage(0);
  };

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    try {
      const res = await action();
      if (res.success) {
        dispatch(showSuccess(successMsg));
        fetchData();
        // Refresh following IDs if we followed/unfollowed
        if (currentUserId) {
          RelationshipService.getFollowingIds(currentUserId).then(r => {
            if (r.success) setFollowingIds(r.data);
          });
        }
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

  const renderEmptyState = (icon: React.ReactNode, title: string, message: string) => (
    <div className="empty-state">
      <div className="empty-icon-wrapper">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
 
  const PersonSkeleton = () => (
    <div className="person-card premium skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-line name" />
        <div className="skeleton-line username" />
        <div className="skeleton-line meta" />
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-btn" />
        <div className="skeleton-btn" />
      </div>
    </div>
  );
 
  const renderPersonCard = (
    person: RelationshipUserSummaryResponse, 
    type: 'friend' | 'follower' | 'following' | 'blocked'
  ) => {
    const isFriend = type === 'friend';
    const isFollower = type === 'follower';
    const isFollowing = type === 'following';
    const isBlocked = type === 'blocked';
 
    return (
      <div key={person.userId} className={`person-card premium ${type}`}>
        <div className="card-glass-glow" />
        <Link to={`/profile/${person.userId}`} className="person-avatar-link">
          <UserAvatar size={72} userId={person.userId} src={person.profilePictureUrl || undefined} showLink={false} />
        </Link>
        <div className="person-info">
          <div className="name-wrapper">
            <Link to={`/profile/${person.userId}`} className="person-name">{person.displayName}</Link>
            {isBlocked && <ShieldAlert size={14} className="blocked-icon" />}
          </div>
          <span className="person-username">@{person.username}</span>
          
          
        </div>
        
        <div className="person-actions-v2">
          {isFriend && (
            <>
              <button 
                className="glass-action-btn" 
                onClick={() => handleAction(() => RelationshipService.unfriend(person.userId), "Friend removed")}
                title="Unfriend"
              >
                <UserMinus size={18} />
              </button>
              <button 
                className="glass-action-btn danger" 
                onClick={() => handleAction(() => RelationshipService.block(person.userId), "User blocked")}
                title="Block"
              >
                <ShieldAlert size={18} />
              </button>
            </>
          )}
          {isFollower && !followingIds.includes(person.userId) && person.relationshipType !== 'FRIEND' && (
            <button 
              className="glass-action-btn primary" 
              onClick={() => handleAction(() => RelationshipService.follow(person.userId), "Following user")}
              title="Follow Back"
            >
              <UserPlus size={18} />
              <span>Follow Back</span>
            </button>
          )}
          {isFollowing && (
            <button 
              className="glass-action-btn outline" 
              onClick={() => handleAction(() => RelationshipService.unfollow(person.userId), "Unfollowed successful")}
              title="Unfollow"
            >
              <UserMinus size={18} />
              <span>Unfollow</span>
            </button>
          )}
          {isBlocked && (
            <button 
              className="glass-action-btn success" 
              onClick={() => handleAction(() => RelationshipService.unblock(person.userId), "User unblocked")}
              title="Unblock"
            >
              <ShieldOff size={18} />
              <span>Unblock</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="people-grid">
          {[...Array(6)].map((_, i) => <PersonSkeleton key={i} />)}
        </div>
      );
    }
 
    switch (activeTab) {
      case 'friends':
        if (!friendsData || friendsData.content.length === 0) 
          return renderEmptyState(<UserCircle size={48} />, "No friends yet", "Connect with people to see them here.");
        return (
          <div className="people-grid-container">
            <div className="people-grid">
              {friendsData.content.map((p: RelationshipUserSummaryResponse) => renderPersonCard(p, 'friend'))}
            </div>
            {renderPagination(friendsData)}
          </div>
        );
      case 'followers':
        if (!followersData || followersData.content.length === 0) 
          return renderEmptyState(<Users size={48} />, "No followers", "Share your profile to get discovered!");
        return (
          <div className="people-grid-container">
            <div className="people-grid">
              {followersData.content.map((p: RelationshipUserSummaryResponse) => renderPersonCard(p, 'follower'))}
            </div>
            {renderPagination(followersData)}
          </div>
        );
      case 'following':
        if (!followingData || followingData.content.length === 0) 
          return renderEmptyState(<Users size={48} />, "Not following anyone", "Explore and follow interesting people.");
        return (
          <div className="people-grid-container">
            <div className="people-grid">
              {followingData.content.map(p => renderPersonCard(p, 'following'))}
            </div>
            {renderPagination(followingData)}
          </div>
        );
      case 'blocked':
        if (!blockedData || blockedData.content.length === 0) 
          return renderEmptyState(<ShieldOff size={48} />, "Clean blocklist", "No users are currently blocked.");
        return (
          <div className="people-grid-container">
            <div className="people-grid">
              {blockedData.content.map(p => renderPersonCard(p, 'blocked'))}
            </div>
            {renderPagination(blockedData)}
          </div>
        );
      case 'requests_received':
        if (!pendingReceivedData || pendingReceivedData.content.length === 0) 
          return renderEmptyState(<Clock size={48} />, "No requests", "You have no pending friend requests.");
        return (
          <div className="requests-stack">
            {pendingReceivedData.content.map(req => (
              <div key={req.requestId} className="request-card premium">
                <div className="request-content-v2">
                  <div className="request-header">
                    <UserAvatar size={56} userId={req.otherUserId} src={req.profilePictureUrl || undefined} />
                    <div className="request-user-info">
                      <Link to={`/profile/${req.otherUserId}`} className="person-name">{req.displayName}</Link>
                      <span className="person-username">@{req.username}</span>
                      <span className="request-time">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {req.message && <div className="request-message-v2">{req.message}</div>}
                </div>
                <div className="request-actions-v2">
                  <button 
                    className="req-btn-v2 accept"
                    onClick={() => handleAction(() => RelationshipService.acceptFriendRequest(req.requestId), "Friend request accepted")}
                  >
                    <Check size={18} />
                    <span>Accept</span>
                  </button>
                  <button
                    className="req-btn-v2 decline"
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
      case 'requests_sent':
        if (!pendingSentData || pendingSentData.content.length === 0)
          return renderEmptyState(<UserPlus size={48} />, "No outcoming requests", "Send requests to start new friendships!");
        return (
          <div className="requests-stack">
            {pendingSentData.content.map(req => (
              <div key={req.requestId} className="request-card premium sent">
                <div className="request-content-v2">
                  <div className="request-header">
                    <UserAvatar size={56} userId={req.otherUserId} src={req.profilePictureUrl || undefined} />
                    <div className="request-user-info">
                      <Link to={`/profile/${req.otherUserId}`} className="person-name">{req.displayName}</Link>
                      <span className="person-username">@{req.username}</span>
                      <span className="request-time">Sent on {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {req.message && <div className="request-message-v2">{req.message}</div>}
                </div>
                <div className="request-actions-v2">
                  <button 
                    className="req-btn-v2 cancel" 
                    onClick={() => handleAction(() => RelationshipService.cancelFriendRequest(req.requestId), "Friend request cancelled")}
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
      default:
        return null;
    }
  };
 
  return (
    <div className="people-page">
      <header className="people-header-v2">
        <div className="header-bg-glow" />
        <button className="back-btn-v2" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-content">
          <h1>Dynamic Network</h1>
          <p>Connect, discover, and build your social circle in real-time.</p>
        </div>
      </header>

      <nav className="people-tabs-v2">
        {[
          { id: 'friends', icon: <UserCheck size={18} />, label: 'Friends' },
          { id: 'following', icon: <UserPlus size={18} />, label: 'Following' },
          { id: 'followers', icon: <Users size={18} />, label: 'Followers' },
          { id: 'requests_received', icon: <Clock size={18} />, label: 'Received', indicator: pendingReceivedData?.totalElements },
          { id: 'requests_sent', icon: <Clock size={18} />, label: 'Sent' },
          { id: 'blocked', icon: <ShieldOff size={18} />, label: 'Privacy' },
        ].map(tab => (
          <button 
            key={tab.id}
            className={`tab-btn-v2 ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id as TabType)}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab-indicator"
                className="tab-active-bg"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="tab-content-z">
              {tab.icon}
              <span>{tab.label}</span>
              {!!tab.indicator && tab.indicator > 0 && (
                <span className="tab-indicator">{tab.indicator}</span>
              )}
            </span>
          </button>
        ))}
      </nav>

      <section className="people-main-v2">
        {renderTabContent()}
      </section>
    </div>
  );
};
