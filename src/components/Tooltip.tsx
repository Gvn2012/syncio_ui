import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertOctagon } from 'lucide-react';
import './Tooltip.css';

export type TooltipVariant = 'default' | 'error' | 'success' | 'warning' | 'info';
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactElement;
  content: string | null;
  variant?: TooltipVariant;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  variant = 'default',
  position = 'top',
  delay = 200,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }

      setCoords({ top, left });
    }
  };

  const showTooltip = () => {
    if (!content) return;
    timeoutRef.current = window.setTimeout(() => {
      updateCoords();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getIcon = () => {
    switch (variant) {
      case 'error': return <AlertCircle size={16} className="tooltip-icon" />;
      case 'success': return <CheckCircle size={16} className="tooltip-icon" />;
      case 'warning': return <AlertOctagon size={16} className="tooltip-icon" />;
      case 'info': return <Info size={16} className="tooltip-icon" />;
      default: return null;
    }
  };

  const variants = {
    initial: { 
      opacity: 0, 
      scale: 0.95, 
      y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0,
      x: position === 'left' ? 5 : position === 'right' ? -5 : 0
    },
    animate: { opacity: 1, scale: 1, y: 0, x: 0 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <>
      {React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      })}
      {createPortal(
        <AnimatePresence>
          {isVisible && content && (
            <motion.div
              className={`tooltip-container tooltip-pos-${position} ${className}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                top: coords.top,
                left: coords.left,
                transformOrigin: position === 'top' ? 'bottom center' : position === 'bottom' ? 'top center' : position === 'left' ? 'center right' : 'center left',
                position: 'fixed',
                zIndex: 9999,
                transform: position === 'top' 
                  ? 'translate(-50%, -100%)' 
                  : position === 'bottom' 
                    ? 'translateX(-50%)' 
                    : position === 'left' 
                      ? 'translate(-100%, -50%)' 
                      : 'translateY(-50%)'
              }}
            >
              <div className={`tooltip-content tooltip-variant-${variant}`}>
                {getIcon()}
                <span>{content}</span>
                <div className="tooltip-arrow" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
