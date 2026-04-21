import React from 'react';
import { formatTimeAgo } from '../../../common/utils/date';
import { 
  Heart, 
  MessageCircle, 
  Repeat, 
  AtSign, 
  UserPlus, 
  AlertCircle, 
  PlusSquare, 
  CheckSquare, 
  Info,
  Mail
} from 'lucide-react';
import { NotificationType, type GetUserNotificationResponse } from '../api/types';
import './NotificationDropdown.css';

interface NotificationItemProps {
  notification: GetUserNotificationResponse;
  onClick?: (notification: GetUserNotificationResponse) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.POST_REACTION:
      return <Heart size={16} className="noti-icon reaction" />;
    case NotificationType.POST_COMMENT:
      return <MessageCircle size={16} className="noti-icon comment" />;
    case NotificationType.POST_SHARE:
      return <Repeat size={16} className="noti-icon share" />;
    case NotificationType.POST_MENTION:
      return <AtSign size={16} className="noti-icon mention" />;
    case NotificationType.FRIEND_REQUEST:
      return <UserPlus size={16} className="noti-icon friend" />;
    case NotificationType.SYSTEM_ALERT:
      return <AlertCircle size={16} className="noti-icon alert" />;
    case NotificationType.POST_CREATED:
      return <PlusSquare size={16} className="noti-icon post" />;
    case NotificationType.TASK_ASSIGNED:
      return <CheckSquare size={16} className="noti-icon task" />;
    case NotificationType.EMAIL_VERIFICATION:
      return <Mail size={16} className="noti-icon email" />;
    default:
      return <Info size={16} className="noti-icon default" />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <div 
      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
      onClick={() => onClick?.(notification)}
    >
      <div className="notification-icon-wrapper">
        {getNotificationIcon(notification.type)}
        {!notification.isRead && <span className="unread-dot" />}
      </div>
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-title">{notification.title}</span>
          <span className="notification-time">{timeAgo}</span>
        </div>
        <p className="notification-message">{notification.message}</p>
      </div>
    </div>
  );
};
