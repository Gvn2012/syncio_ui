import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../store';
import { fetchUserDetail } from '../store/slices/userSlice';
import { CachedImage } from './common/CachedImage';

interface UserAvatarProps {
  className?: string;
  size?: number;
  userId?: string;
  showLink?: boolean;
}


export const UserAvatar: React.FC<UserAvatarProps> = ({ className, size, userId, showLink = true }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: currentUserId, userDetail } = useSelector((state: RootState) => state.user);

  // If userId is provider and not matching currentUserId, we might not have userDetail yet
  // but for now let's assume if it's the current user we use the detail, 
  // otherwise we just show fallback or eventually fetch
  const isCurrentUser = !userId || userId === currentUserId;
  const user = isCurrentUser ? userDetail?.userResponse : null;
  const primaryPicture = isCurrentUser ? userDetail?.userProfileResponse?.userProfilePictureResponseList?.find(p => p.primary) : null;
  
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2596be&color=fff&size=${size || 200}`;
  
  const avatarUrl = primaryPicture?.url || fallbackUrl;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src === fallbackUrl) return;

    if (currentUserId && isCurrentUser) {
      console.warn("Avatar URL expired/failed. Refreshing user detail...");
      dispatch(fetchUserDetail(currentUserId));
    }
    
    e.currentTarget.src = fallbackUrl;
  };

  const avatarImage = (
    <CachedImage 
      src={avatarUrl} 
      fallbackSrc={fallbackUrl}
      alt={displayName}
      className={className}
      onError={handleImageError}
      loading="lazy"
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
