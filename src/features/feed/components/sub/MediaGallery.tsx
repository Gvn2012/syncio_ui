import React from 'react';
import { useDispatch } from 'react-redux';
import type { PostMediaAttachment } from '../../types';
import { CachedImage } from '../../../../components/common/CachedImage';
import { openLightbox } from '../../../../store/slices/uiSlice';

interface MediaGalleryProps {
  attachments: PostMediaAttachment[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ attachments }) => {
  const dispatch = useDispatch();
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(a => a.type === 'IMAGE');
  const count = images.length;

  if (count === 0) return null;

  const handleImageClick = (index: number) => {
    dispatch(openLightbox({
      images: images.map(img => img.url),
      index
    }));
  };

  return (
    <div className={`media-gallery count-${count > 4 ? 'more' : count}`}>
      {images.slice(0, 4).map((image, index) => (
        <div 
          key={image.id} 
          className="media-item"
          style={{ position: 'relative' }}
          onClick={() => handleImageClick(index)}
        >
          <CachedImage 
            src={image.url} 
            alt={image.altText || 'Post content'} 
            className="gallery-image" 
            loading="lazy"
          />
          {index === 3 && count > 4 && (
            <div className="media-overlay">
              <span>+{count - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
