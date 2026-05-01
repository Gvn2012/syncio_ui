import React, { useState, useEffect } from 'react';
import { X, Search, Users, Check, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RelationshipService } from '../../user/api/relationship.service';
import type { RelationshipUserSummaryResponse } from '../../user/api/types';
import type { RootState } from '../../../store';
import { UserAvatar } from '../../../components/UserAvatar';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (name: string, participantIds: string[]) => void;
  loading?: boolean;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate, loading }) => {
  const { id: currentUserId } = useSelector((state: RootState) => state.user);
  const [friends, setFriends] = useState<RelationshipUserSummaryResponse[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupName, setGroupName] = useState('');
  const [fetchingFriends, setFetchingFriends] = useState(false);

  useEffect(() => {
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
    fetchFriends();
  }, [currentUserId]);

  const filteredFriends = friends.filter(friend => 
    friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = () => {
    if (selectedFriends.length > 0) {
      onCreate(groupName.trim(), selectedFriends);
    }
  };

  return (
    <div className="group-modal-overlay" onClick={onClose}>
      <div className="group-modal-content" onClick={e => e.stopPropagation()}>
        <div className="group-modal-header">
          <div className="header-title">
            <Users size={20} className="header-icon" />
            <h3>Create New Group</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="group-modal-body">
          <div className="group-setup-section">
            <label>Group Name (Optional)</label>
            <input 
              type="text" 
              placeholder="Enter group name..." 
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="group-name-input"
            />
            <p className="helper-text">If left blank, participants' names will be used.</p>
          </div>

          <div className="participant-selection-section">
            <div className="selection-header">
              <label>Select Participants ({selectedFriends.length})</label>
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search friends..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="friends-list">
              {fetchingFriends ? (
                <div className="list-loading">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Loading friends...</span>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="empty-list">No friends found</div>
              ) : (
                filteredFriends.map(friend => (
                  <div 
                    key={friend.userId} 
                    className={`friend-item ${selectedFriends.includes(friend.userId) ? 'selected' : ''}`}
                    onClick={() => toggleFriend(friend.userId)}
                  >
                    <UserAvatar 
                      src={friend.profilePictureUrl || undefined} 
                      userId={friend.userId}
                      size={32}
                    />
                    <div className="friend-info">
                      <span className="friend-name">{friend.displayName}</span>
                    </div>
                    <div className="checkbox">
                      {selectedFriends.includes(friend.userId) && <Check size={14} />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="group-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="create-btn" 
            disabled={selectedFriends.length === 0 || loading}
            onClick={handleCreate}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
