import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchDetailedReactions } from '../../api/feedApi';
import { ReactionType } from '../../types';
import { REACTION_CONFIG } from '../../utils/reactionUtils';
import { UserAvatar } from '../../../../components/UserAvatar';
import { useSelector } from 'react-redux';
import './DetailedReactionsModal.css';
import type { RootState } from '../../../../store';

interface DetailedReactionsModalProps {
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DetailedReactionsModal: React.FC<DetailedReactionsModalProps> = ({
  postId,
  isOpen,
  onClose,
}) => {
  const { id: currentUserId } = useSelector((state: RootState) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = (searchParams.get('type') as ReactionType | 'ALL') || 'ALL';

  const { data, isLoading } = useQuery({
    queryKey: ['post-reactions-detailed', postId],
    queryFn: () => fetchDetailedReactions(postId!),
    enabled: !!postId && isOpen,
    staleTime: 60000,
  });

  const reactionGroups = data?.data || [];


  const setActiveTab = (tab: ReactionType | 'ALL') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (tab === 'ALL') {
        newParams.delete('type');
      } else {
        newParams.set('type', tab);
      }
      return newParams;
    });
  };

  const totalReactions = reactionGroups.reduce((acc, group) => acc + group.count, 0);

  const displayedReactors = React.useMemo(() => {
    if (isLoading || reactionGroups.length === 0) return [];

    if (activeTab === 'ALL') {
      const allReactors = reactionGroups.flatMap(g => 
        g.reactors.map(r => ({ ...r, type: g.reactionType }))
      );
      
      return allReactors
        .sort((a, b) => (b.isFriend ? 1 : 0) - (a.isFriend ? 1 : 0));
    }

    const group = reactionGroups.find(g => g.reactionType === activeTab);
    return group ? group.reactors.map(r => ({ ...r, type: group.reactionType })) : [];
  }, [reactionGroups, activeTab, isLoading]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="detailed-reactions-overlay">
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="detailed-reactions-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <header className="modal-header">
              <div className="header-content">
                <h2>Reactions</h2>
                <span className="total-count">{totalReactions} {totalReactions === 1 ? 'person' : 'people'} reacted</span>
              </div>
              <button className="modal-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </header>

            <div className="modal-tabs">
              <button 
                className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                All
                {activeTab === 'ALL' && (
                  <motion.div layoutId="detailed-tab-active" className="tab-underline" />
                )}
              </button>
              {reactionGroups.filter(g => g.count > 0).map((group) => {
                const config = REACTION_CONFIG[group.reactionType];
                const Icon = config.icon;
                return (
                  <button 
                    key={group.reactionType}
                    className={`tab-btn ${activeTab === group.reactionType ? 'active' : ''}`}
                    onClick={() => setActiveTab(group.reactionType)}
                  >
                    <div className="tab-icon-wrapper">
                      <Icon size={16} color={config.color} fill={group.reactionType === ReactionType.LOVE ? config.color : 'transparent'} />
                    </div>
                    <span>{group.count}</span>
                    {activeTab === group.reactionType && (
                      <motion.div layoutId="detailed-tab-active" className="tab-underline" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="modal-body-scrollable">
              {isLoading ? (
                <div className="reactions-loading">
                  <div className="loading-spinner" />
                  <span>Loading reactors...</span>
                </div>
              ) : reactionGroups.length === 0 ? (
                <div className="empty-reactions">
                  <p>No reactions yet.</p>
                </div>
              ) : (
                <div className="reactors-list">
                  {displayedReactors.map((reactor, idx) => {
                      const config = REACTION_CONFIG[reactor.type as ReactionType];
                      const ReactionIcon = config.icon;
                      const isSelf = reactor.userId === currentUserId;
                      
                      return (
                        <Link 
                          key={`${reactor.userId}-${idx}`} 
                          to={reactor.userId ? `/profile/${reactor.userId}` : '#'}
                          className={`reactor-item ${!reactor.userId ? 'disabled' : ''}`}
                        >
                          <div className="reactor-avatar-wrapper">
                            <UserAvatar 
                              userId={reactor.userId || undefined}
                              src={reactor.avatarUrl || undefined}
                              size={44}
                              className="reactor-avatar"
                              showLink={false}
                            />
                            <div className="reactor-reaction-badge" style={{ backgroundColor: config.color }}>
                              <ReactionIcon size={10} color="white" fill="white" />
                            </div>
                          </div>
                          
                          <div className="reactor-main-info">
                            <div className="reactor-name-row">
                              <span className="reactor-full-name">{reactor.fullName}</span>
                              {reactor.isFriend && !isSelf && <span className="friend-badge">Friend</span>}
                              {isSelf && <span className="self-badge">You</span>}
                            </div>
                            <span className="reactor-username">@{reactor.username}</span>
                          </div>

                          <div className="reactor-actions">
                            {reactor.isBlocked && (
                              <div className="blocked-indicator" title="Blocked">
                                <ShieldAlert size={18} color="var(--error)" />
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
