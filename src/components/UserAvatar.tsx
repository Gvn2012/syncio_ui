import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../store';
import { fetchUserDetail } from '../store/slices/userSlice';
import { CachedImage } from './common/CachedImage';
import { useParticipant } from '../features/messages/hooks/useParticipant';

interface UserAvatarProps {
  className?: string;
  size?: number;
  userId?: string;
  showLink?: boolean;
  src?: string;
}


const failedUrls = new Set<string>();

export const UserAvatar: React.FC<UserAvatarProps> = ({ className, size, userId, showLink = true, src }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: currentUserId, userDetail, userDetailLoading } = useSelector((state: RootState) => state.user);
  
  const isCurrentUser = !!currentUserId && (userId === currentUserId || !userId);
  const { participant } = useParticipant(isCurrentUser ? undefined : userId);

  const user = isCurrentUser ? userDetail?.userResponse : null;
  const primaryPicture = isCurrentUser ? userDetail?.userProfileResponse?.userProfilePictureResponseList?.find(p => p.primary) : null;
  
  const displayName = isCurrentUser 
    ? (user ? `${user.firstName} ${user.lastName}` : 'You') 
    : (participant?.name || 'User');
  
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2596be&color=fff&size=${size || 200}`;
  
  const avatarUrl = src || (isCurrentUser ? primaryPicture?.url : participant?.avatar) || fallbackUrl;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src === fallbackUrl) return;

    // Check if we already attempted a refresh for this specific URL
    if (currentUserId && isCurrentUser && !userDetailLoading && !failedUrls.has(avatarUrl)) {
      console.warn("Avatar URL expired/failed. Refreshing user detail...");
      failedUrls.add(avatarUrl);
      dispatch(fetchUserDetail(currentUserId));
    }
    
    e.currentTarget.src = fallbackUrl;
  };

  const avatarImage = (
    <CachedImage 
      src={avatarUrl} 
      cacheKey={avatarUrl !== fallbackUrl ? userId : undefined}
      fallbackSrc={fallbackUrl}
      alt={displayName}
      className={className}
      onError={handleImageError}
      loading="lazy"
      width={size}
      height={size}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'cover', 
        borderRadius: '50%',
        flexShrink: 0
      }}
    />
  );

  if (showLink && userId) {
    return (
      <Link to={`/profile/${userId}`} className="avatar-link">
        {avatarImage}
      </Link>
    );
  }

  return avatarImage;
};
