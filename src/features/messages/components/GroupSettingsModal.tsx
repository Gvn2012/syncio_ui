import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, ShieldAlert, LogOut, UserMinus, Edit2, Check, Search, Loader2 } from 'lucide-react';
import { UserAvatar } from '../../../components/UserAvatar';
import { useParticipant } from '../hooks/useParticipant';
import { RelationshipService } from '../../user/api/relationship.service';
import type { RelationshipUserSummaryResponse } from '../../user/api/types';
import './GroupSettingsModal.css';

interface ParticipantItemProps {
  userId: string;
  isAdmin: boolean;
  isSelf: boolean;
  canManage: boolean;
  onAction: (userId: string, action: 'REMOVE' | 'PROMOTE' | 'DEMOTE') => void;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ userId, isAdmin, isSelf, canManage, onAction }) => {
  const { participant } = useParticipant(userId);

  return (
    <div className="participant-item">
      <UserAvatar userId={userId} src={participant?.avatar} size={36} />
      <div className="participant-info">
        <span className="participant-name">
          {participant?.name || `User ${userId.substring(0, 4)}`}
          {isSelf && <span className="badge self">You</span>}
          {isAdmin && <span className="badge admin">Admin</span>}
        </span>
      </div>
      <div className="participant-actions">
        {canManage && !isSelf && (
          <>
            {!isAdmin ? (
              <button 
                className="action-icon-btn promote" 
                title="Promote to Admin"
                onClick={() => onAction(userId, 'PROMOTE')}
              >
                <Shield size={16} />
              </button>
            ) : (
              <button 
                className="action-icon-btn demote" 
                title="Demote from Admin"
                onClick={() => onAction(userId, 'DEMOTE')}
              >
                <ShieldAlert size={16} />
              </button>
            )}
            <button 
              className="action-icon-btn remove" 
              title="Remove from Group"
              onClick={() => onAction(userId, 'REMOVE')}
            >
              <UserMinus size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
  currentUserId: string | null;
  onUpdateGroup: (updates: { name?: string; description?: string }) => void;
  onManageMember: (userId: string, action: 'ADD' | 'REMOVE' | 'PROMOTE' | 'DEMOTE') => void;
  onLeaveGroup: () => void;
  initialTab?: 'info' | 'members';
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onUpdateGroup,
  onManageMember,
  onLeaveGroup,
  initialTab = 'info'
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'members'>(initialTab);
  const [name, setName] = useState(conversation?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Friend fetching for adding members
  const [friends, setFriends] = useState<RelationshipUserSummaryResponse[]>([]);
  const [fetchingFriends, setFetchingFriends] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const isAdmin = conversation?.adminIds?.includes(currentUserId || '');
  const participants = conversation?.participants || [];
  const adminIds = conversation?.adminIds || [];

  useEffect(() => {
    if (isOpen) {
      setName(conversation?.name || '');
      setIsEditingName(false);
      setActiveTab(initialTab);
      setIsAddingMember(false);
    }
  }, [isOpen, conversation.id, initialTab]); // Use conversation.id instead of entire object to avoid loops if needed

  useEffect(() => {
    if (activeTab === 'members' && isAdmin) {
      fetchFriends();
    }
  }, [activeTab, isAdmin, currentUserId]);

  const fetchFriends = async () => {
    if (!currentUserId) return;
    setFetchingFriends(true);
    try {
      const response = await RelationshipService.getFriendsPage(currentUserId, 0, 100);
      if (response.success) {
        setFriends(response.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setFetchingFriends(false);
    }
  };

  if (!isOpen) return null;

  const handleUpdateName = () => {
    if (name.trim() && name !== conversation.name) {
      onUpdateGroup({ name: name.trim() });
    }
    setIsEditingName(false);
  };

  const friendsToAdd = friends.filter(friend => 
    !participants.includes(friend.userId) &&
    friend.displayName.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content group-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Group Settings</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Information
          </button>
          <button 
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members ({participants.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'info' ? (
            <div className="settings-section">
              <div className="group-profile-header">
                <UserAvatar isGroup={true} size={80} src={conversation.groupAvatar} />
                <div className="group-name-edit">
                  {isEditingName && isAdmin ? (
                    <div className="edit-input-wrapper">
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                        autoFocus
                      />
                      <button className="confirm-edit-btn" onClick={handleUpdateName}><Check size={18} /></button>
                    </div>
                  ) : (
                    <div className="name-display">
                      <h4>{conversation.name || 'Group Chat'}</h4>
                      {isAdmin && <button className="edit-btn" onClick={() => setIsEditingName(true)}><Edit2 size={16} /></button>}
                    </div>
                  )}
                  <span className="group-id">ID: {conversation.id}</span>
                </div>
              </div>

              <div className="danger-zone">
                <button className="leave-group-btn" onClick={onLeaveGroup}>
                  <LogOut size={18} /> Leave Group
                </button>
              </div>
            </div>
          ) : (
            <div className="members-section">
              {isAdmin && !isAddingMember && (
                <button className="add-member-trigger" onClick={() => setIsAddingMember(true)}>
                  <UserPlus size={18} /> Add New Member
                </button>
              )}

              {isAdmin && isAddingMember && (
                <div className="add-member-container">
                  <div className="add-member-header">
                    <div className="search-input-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search friends to add..." 
                        value={memberSearchTerm}
                        onChange={e => setMemberSearchTerm(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button className="cancel-add-btn" onClick={() => setIsAddingMember(false)}>Cancel</button>
                  </div>
                  
                  <div className="friends-to-add-list">
                    {fetchingFriends ? (
                      <div className="loading-state"><Loader2 size={24} className="animate-spin" /></div>
                    ) : friendsToAdd.length === 0 ? (
                      <div className="empty-state">No friends found</div>
                    ) : (
                      friendsToAdd.map(friend => (
                        <div key={friend.userId} className="friend-add-item">
                          <UserAvatar src={friend.profilePictureUrl || undefined} userId={friend.userId} size={32} />
                          <span className="friend-name">{friend.displayName}</span>
                          <button 
                            className="add-btn"
                            onClick={() => onManageMember(friend.userId, 'ADD')}
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              <div className="participants-list-header">Group Members</div>
              <div className="participants-list">
                {participants.map((pid: string) => (
                  <ParticipantItem 
                    key={pid}
                    userId={pid}
                    isAdmin={adminIds.includes(pid)}
                    isSelf={pid === currentUserId}
                    canManage={isAdmin}
                    onAction={onManageMember}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
