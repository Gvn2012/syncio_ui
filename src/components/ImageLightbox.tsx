/* ImageLightbox.tsx - Universal Visual Orchestration */
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setLightboxImage } from '../store/slices/uiSlice';
import { X } from 'lucide-react';
import './ImageLightbox.css';

export const ImageLightbox: React.FC = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector((state: RootState) => state.ui.activeLightboxImage);

  // Close on Escape keypress
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(setLightboxImage(null));
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [dispatch]);

  if (!activeImage) return null;

  return (
    <div className="lightbox-overlay" onClick={() => dispatch(setLightboxImage(null))}>
      <button 
        className="lightbox-close" 
        onClick={() => dispatch(setLightboxImage(null))}
        title="Close Preview (Esc)"
      >
        <X size={28} />
      </button>

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img 
          src={activeImage} 
          alt="Full-scale review" 
          className="lightbox-img" 
        />
        <div className="lightbox-footer">
          Click backdrop or press [Esc] to exit
        </div>
      </div>
    </div>
  );
};
