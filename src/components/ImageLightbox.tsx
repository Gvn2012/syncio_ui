/* ImageLightbox.tsx - Universal Visual Orchestration */
import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { closeLightbox, nextLightboxImage, prevLightboxImage } from '../store/slices/uiSlice';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ImageLightbox.css';

export const ImageLightbox: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    activeLightboxImage, 
    lightboxImages, 
    activeLightboxIndex 
  } = useSelector((state: RootState) => state.ui);

  const handleClose = useCallback(() => dispatch(closeLightbox()), [dispatch]);
  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(nextLightboxImage());
  }, [dispatch]);
  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(prevLightboxImage());
  }, [dispatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleNext, handlePrev]);

  if (!activeLightboxImage) return null;

  return (
    <div className="lightbox-overlay" onClick={handleClose}>
      <button 
        className="lightbox-close" 
        onClick={handleClose}
        title="Close Preview (Esc)"
      >
        <X size={28} />
      </button>

      {lightboxImages.length > 1 && (
        <>
          <button className="nav-btn prev" onClick={handlePrev} aria-label="Previous image">
            <ChevronLeft size={40} />
          </button>
          <button className="nav-btn next" onClick={handleNext} aria-label="Next image">
            <ChevronRight size={40} />
          </button>
        </>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeLightboxImage}
            src={activeLightboxImage} 
            alt={`Preview ${activeLightboxIndex + 1}`} 
            className="lightbox-img"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </AnimatePresence>
        
        <div className="lightbox-footer">
          {lightboxImages.length > 1 && (
            <div className="counter">{activeLightboxIndex + 1} / {lightboxImages.length}</div>
          )}
          <span>Click backdrop or press [Esc] to exit</span>
        </div>
      </div>
    </div>
  );
};
