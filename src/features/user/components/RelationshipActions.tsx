import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  UserX, 
  Slash, 
  ChevronDown,
  Check,
  X,
  ShieldOff,
  User
} from 'lucide-react';
import { RelationshipService } from '../api/relationship.service';
import type { RelationshipStatusResponse } from '../api/types';
import { showError, showSuccess } from '../../../store/slices/uiSlice';
import { fetchFriendRequestCount, fetchUnreadCount } from '../../../store/slices/notificationSlice';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../../store';
import './RelationshipActions.css';

interface RelationshipActionsProps {
  targetId: string;
  onStatusChange?: (status: RelationshipStatusResponse) => void;
}

export const RelationshipActions: React.FC<RelationshipActionsProps> = ({ targetId, onStatusChange }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<RelationshipStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDefaultDropdown, setShowDefaultDropdown] = useState(false);
  const [showFollowingDropdown, setShowFollowingDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await RelationshipService.getStatus(targetId);
      setStatus(data);
      if (onStatusChange) onStatusChange(data);
    } catch (error) {
      console.error('Failed to fetch relationship status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [targetId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowDefaultDropdown(false);
        setShowFollowingDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    try {
      setActionLoading(true);
      const res = await action();
      if (res.success) {
        dispatch(showSuccess(successMsg));
        dispatch(fetchFriendRequestCount());
        dispatch(fetchUnreadCount());
        await fetchStatus();
      } else {
        dispatch(showError(res.message || 'Action failed'));
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Action failed';
      dispatch(showError(message));
    } finally {
      setActionLoading(false);
      setShowDropdown(false);
      setShowDefaultDropdown(false);
      setShowFollowingDropdown(false);
    }
  };

  if (loading) {
    return <div className="relationship-actions-skeleton" />;
  }

  if (!status) return null;

  return (
    <div className="relationship-actions-container" ref={containerRef}>
      {/* 1. Blocked States */}
      {status.isBlocking && (
        <button 
          className="rel-btn unblock-btn" 
          disabled={actionLoading}
          onClick={() => handleAction(() => RelationshipService.unblock(targetId), 'User unblocked')}
        >
          <ShieldOff size={16} />
          <span>Unblock</span>
        </button>
      )}

      {status.isBlockedBy && !status.isBlocking && (
        <div className="rel-status-badge blocked">
          <Slash size={16} />
          <span>You are blocked by this user</span>
        </div>
      )}

      {/* 2. Friend Request Received */}
      {!status.isBlocking && !status.isBlockedBy && status.friendRequestStatus === 'PENDING_RECEIVED' && (
        <div className="rel-action-group">
          <button 
            className="rel-btn accept-btn" 
            disabled={actionLoading || !status.friendRequestId}
            onClick={() => status.friendRequestId && handleAction(() => RelationshipService.acceptFriendRequest(status.friendRequestId!), 'Friend request accepted')}
          >
            <Check size={16} />
            <span>Accept</span>
          </button>
          <button 
            className="rel-btn decline-btn" 
            disabled={actionLoading || !status.friendRequestId}
            onClick={() => status.friendRequestId && handleAction(() => RelationshipService.declineFriendRequest(status.friendRequestId!), 'Friend request declined')}
          >
            <X size={16} />
            <span>Decline</span>
          </button>
        </div>
      )}

      {/* 3. Friend Request Sent */}
      {!status.isBlocking && !status.isBlockedBy && status.friendRequestStatus === 'PENDING_SENT' && (
        <button 
          className="rel-btn cancel-request-btn" 
          disabled={actionLoading || !status.friendRequestId}
          onClick={() => status.friendRequestId && handleAction(() => RelationshipService.cancelFriendRequest(status.friendRequestId!), 'Friend request cancelled')}
        >
          <X size={16} />
          <span>Cancel Request</span>
        </button>
      )}

      {/* 4. Friends */}
      {!status.isBlocking && !status.isBlockedBy && status.isFriend && (
        <div className="rel-dropdown-container">
          <button 
            className="rel-btn friend-btn" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <UserCheck size={16} />
            <span>Friends</span>
            <ChevronDown size={14} />
          </button>
          
          {showDropdown && (
            <div className="rel-dropdown-menu">
              <button 
                onClick={() => handleAction(() => RelationshipService.unfriend(targetId), 'Friendship removed')}
                disabled={actionLoading}
              >
                <UserMinus size={14} />
                <span>Unfriend</span>
              </button>
              
              {!status.isFollowing ? (
                <button 
                  onClick={() => handleAction(() => RelationshipService.follow(targetId), 'Following user')}
                  disabled={actionLoading}
                >
                  <UserPlus size={14} />
                  <span>Follow</span>
                </button>
              ) : (
                <button 
                  onClick={() => handleAction(() => RelationshipService.unfollow(targetId), 'Unfollowed user')}
                  disabled={actionLoading}
                >
                  <UserX size={14} />
                  <span>Unfollow</span>
                </button>
              )}
              <button 
                className="danger" 
                onClick={() => handleAction(() => RelationshipService.block(targetId, 'OTHER'), 'User blocked')}
                disabled={actionLoading}
              >
                <Slash size={14} />
                <span>Block User</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Following but not Friends */}
      {!status.isBlocking && !status.isBlockedBy && !status.isFriend && status.isFollowing && (
        <div className="rel-action-group">
          <div className="rel-btn-group">
            <button className="rel-btn following-btn group-main" disabled>
              <UserCheck size={16} />
              <span>Following</span>
            </button>
            <button 
              className="rel-btn following-btn group-trigger"
              disabled={actionLoading}
              onClick={() => setShowFollowingDropdown(!showFollowingDropdown)}
            >
              <ChevronDown size={14} />
            </button>

            {showFollowingDropdown && (
              <div className="rel-dropdown-menu">
                <button 
                  onClick={() => handleAction(() => RelationshipService.unfollow(targetId), 'Unfollowed user')}
                  disabled={actionLoading}
                >
                  <UserX size={14} />
                  <span>Unfollow</span>
                </button>
                <button 
                  className="danger" 
                  onClick={() => handleAction(() => RelationshipService.block(targetId, 'OTHER'), 'User blocked')}
                  disabled={actionLoading}
                >
                  <Slash size={14} />
                  <span>Block User</span>
                </button>
              </div>
            )}
          </div>

          <button 
            className="rel-btn add-friend-secondary" 
            disabled={actionLoading}
            onClick={() => handleAction(() => RelationshipService.sendFriendRequest(targetId), 'Friend request sent')}
          >
            <UserPlus size={16} />
            <span>Add Friend</span>
          </button>
        </div>
      )}

      {/* 6. Default (No relationship) */}
      {!status.isBlocking && !status.isBlockedBy && !status.isFriend && !status.isFollowing && 
       status.friendRequestStatus !== 'PENDING_SENT' && status.friendRequestStatus !== 'PENDING_RECEIVED' && (
        <div className="rel-btn-group">
          <button 
            className="rel-btn add-friend-btn group-main" 
            disabled={actionLoading}
            onClick={() => handleAction(() => RelationshipService.sendFriendRequest(targetId), 'Friend request sent')}
          >
            <UserPlus size={16} />
            <span>Add Friend</span>
          </button>
          <button 
            className="rel-btn add-friend-btn group-trigger"
            disabled={actionLoading}
            onClick={() => setShowDefaultDropdown(!showDefaultDropdown)}
          >
            <ChevronDown size={14} />
          </button>

          {showDefaultDropdown && (
            <div className="rel-dropdown-menu">
              <button 
                onClick={() => handleAction(() => RelationshipService.follow(targetId), 'Following user')}
                disabled={actionLoading}
              >
                {status.isFollowedBy ? <UserCheck size={14} /> : <User size={14} />}
                <span>{status.isFollowedBy ? 'Follow back' : 'Follow'}</span>
              </button>
              <button 
                className="danger" 
                onClick={() => handleAction(() => RelationshipService.block(targetId, 'OTHER'), 'User blocked')}
                disabled={actionLoading}
              >
                <Slash size={14} />
                <span>Block User</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
