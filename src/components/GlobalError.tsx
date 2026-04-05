import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { type RootState } from '../store';
import { hideError } from '../store/slices/uiSlice';
import './GlobalError.css';

export const GlobalError: React.FC = () => {
  const { globalError } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();

  useEffect(() => {
    if (globalError.isVisible) {
      const timer = setTimeout(() => {
        dispatch(hideError());
      }, 6000); // Auto-hide after 6 seconds

      return () => clearTimeout(timer);
    }
  }, [globalError.isVisible, dispatch]);

  return (
    <AnimatePresence>
      {globalError.isVisible && (
        <div className="global-error-overlay">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 20, 
              stiffness: 300 
            }}
            className="global-error-content"
          >
            <div className="error-icon-wrapper">
              <AlertCircle size={22} />
            </div>
            
            <div className="error-message-container">
              <h4>AUTHENTICATION ERROR</h4>
              <p>{globalError.message}</p>
            </div>

            <button 
              className="close-error-btn" 
              onClick={() => dispatch(hideError())}
              aria-label="Close error"
            >
              <X size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
