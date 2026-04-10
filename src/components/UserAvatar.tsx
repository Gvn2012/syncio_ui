import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../store';
import { fetchUserDetail } from '../store/slices/userSlice';

interface UserAvatarProps {
  className?: string;
  size?: number;
}


export const UserAvatar: React.FC<UserAvatarProps> = ({ className, size }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { id, userDetail } = useSelector((state: RootState) => state.user);

  const user = userDetail?.userResponse;
  const primaryPicture = userDetail?.userProfileResponse?.userProfilePictureResponseList?.find(p => p.primary);
  
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2596be&color=fff&size=${size || 200}`;
  
  const avatarUrl = primaryPicture?.url || fallbackUrl;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src === fallbackUrl) return;

    if (id) {
      console.warn("Avatar URL expired/failed. Refreshing user detail...");
      dispatch(fetchUserDetail(id));
    }
    
    e.currentTarget.src = fallbackUrl;
  };

  return (
    <img 
      src={avatarUrl} 
      alt={displayName}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};
