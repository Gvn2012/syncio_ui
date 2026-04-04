import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertOctagon } from 'lucide-react';
import './Tooltip.css';

interface TooltipState {
  isVisible: boolean;
  content: string;
  variant: 'default' | 'error' | 'success' | 'warning';
  targetRect: DOMRect | null;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const GlobalTooltip: React.FC = () => {
  const [state, setState] = useState<TooltipState>({
    isVisible: false,
    content: '',
    variant: 'default',
    targetRect: null,
    position: 'top',
  });

  const hideTimeout = useRef<number | null>(null);

  const showTooltip = useCallback((
    content: string, 
    variant: TooltipState['variant'], 
    rect: DOMRect, 
    position: TooltipState['position'] = 'top'
  ) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setState({
      isVisible: true,
      content,
      variant,
      targetRect: rect,
      position,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
  }, []);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tooltip = target.closest('[data-tooltip]') as HTMLElement;
      
      if (tooltip) {
        const content = tooltip.getAttribute('data-tooltip') || '';
        const variant = (tooltip.getAttribute('data-tooltip-variant') as any) || 'default';
        const position = (tooltip.getAttribute('data-tooltip-position') as any) || 'top';
        showTooltip(content, variant, tooltip.getBoundingClientRect(), position);
      } else if (state.isVisible && !target.closest('.tooltip-container')) {
        hideTooltip();
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const tooltip = target.closest('[data-tooltip]') as HTMLElement;
      
      if (tooltip) {
        const content = tooltip.getAttribute('data-tooltip') || '';
        const variant = (tooltip.getAttribute('data-tooltip-variant') as any) || 'default';
        const position = (tooltip.getAttribute('data-tooltip-position') as any) || 'top';
        showTooltip(content, variant, tooltip.getBoundingClientRect(), position);
      }
    };

    const handleInvalid = (e: Event) => {
      const target = e.target as HTMLInputElement;
      e.preventDefault(); // Prevent native browser bubble
      
      const content = target.validationMessage;
      // Position validation at the bottom as requested by the user
      showTooltip(content, 'error', target.getBoundingClientRect(), 'bottom');
      
      // Auto-hide after some time or on input
      const onInput = () => {
        hideTooltip();
        target.removeEventListener('input', onInput);
      };
      target.addEventListener('input', onInput);
    };

    // Register global listeners
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', hideTooltip);
    document.addEventListener('mouseleave', hideTooltip);
    document.addEventListener('invalid', handleInvalid, true); // Capture phase for validation

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', hideTooltip);
      document.removeEventListener('mouseleave', hideTooltip);
      document.removeEventListener('invalid', handleInvalid, true);
    };
  }, [state.isVisible, showTooltip, hideTooltip]);

  if (!state.targetRect) return null;

  const getCoords = () => {
    const rect = state.targetRect!;
    
    let top = 0;
    let left = 0;

    switch (state.position) {
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
    
    return { top, left };
  };

  const coords = getCoords();
  const getIcon = () => {
    switch (state.variant) {
      case 'error': return <AlertCircle size={16} className="tooltip-icon" />;
      case 'success': return <CheckCircle size={16} className="tooltip-icon" />;
      case 'warning': return <AlertOctagon size={16} className="tooltip-icon" />;
      default: return null;
    }
  };

  const animationVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.95, 
      y: state.position === 'top' ? 5 : state.position === 'bottom' ? -5 : 0,
      x: state.position === 'left' ? 5 : state.position === 'right' ? -5 : 0
    },
    animate: { opacity: 1, scale: 1, y: 0, x: 0 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return createPortal(
    <AnimatePresence>
      {state.isVisible && (
        <motion.div
          key="global-tooltip"
          className={`tooltip-container tooltip-pos-${state.position}`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={animationVariants}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            top: coords.top,
            left: coords.left,
            position: 'fixed',
            zIndex: 9999,
            transform: state.position === 'top' 
              ? 'translate(-50%, -100%)' 
              : state.position === 'bottom' 
                ? 'translateX(-50%)' 
                : state.position === 'left' 
                  ? 'translate(-100%, -50%)' 
                  : 'translateY(-50%)'
          }}
        >
          <div className={`tooltip-content tooltip-variant-${state.variant}`}>
            {getIcon()}
            <span>{state.content}</span>
            <div className="tooltip-arrow" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
