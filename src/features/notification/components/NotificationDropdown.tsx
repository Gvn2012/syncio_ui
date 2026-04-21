import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, ExternalLink, Loader2, MailOpen } from 'lucide-react';
import { type RootState, type AppDispatch } from '../../../store';
import { fetchNotifications } from '../../../store/slices/notificationSlice';
import { NotificationItem } from './NotificationItem';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    notifications, 
    loading, 
    loadingMore, 
    error, 
    unreadCount, 
    page, 
    hasNextPage 
  } = useSelector((state: RootState) => state.notification);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 0, size: 20 }));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (!isOpen || !hasNextPage || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          dispatch(fetchNotifications({ page: page + 1, size: 20 }));
        }
      },
      { threshold: 1.0, root: dropdownRef.current }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isOpen, hasNextPage, page, loadingMore, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-dropdown-header">
        <div className="header-left">
          <h3>Notifications</h3>
          {unreadCount > 0 && <span className="unread-count-badge">{unreadCount} new</span>}
        </div>
        <div className="header-actions">
           <button className="icon-btn" title="Mark all as read">
             <MailOpen size={18} />
           </button>
        </div>
      </div>

      <div className="notification-list-container">
        {loading && notifications.length === 0 ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={24} />
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Bell size={40} />
            </div>
            <p>No notifications yet</p>
            <span>We'll notify you when something happens.</span>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif) => (
              <NotificationItem 
                key={notif.id} 
                notification={notif} 
                onClick={(n) => console.log('Notification clicked:', n)}
              />
            ))}
            
            {/* Observer Trigger */}
            <div ref={observerTarget} className="scroll-trigger" />
            
            {loadingMore && (
              <div className="loading-more">
                <Loader2 className="animate-spin" size={20} />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="notification-dropdown-footer">
        <button className="view-all-btn">
          <span>View All Notifications</span>
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
};
