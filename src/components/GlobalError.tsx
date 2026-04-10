import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { type RootState } from '../store';
import { hideAlert } from '../store/slices/uiSlice';
import './GlobalError.css';

export const GlobalError: React.FC = () => {
  const { alert } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();

  useEffect(() => {
    if (alert?.isVisible) {
      const timer = setTimeout(() => {
        dispatch(hideAlert());
      }, alert.type === 'error' ? 8000 : 5000);

      return () => clearTimeout(timer);
    }
  }, [alert?.isVisible, alert?.type, dispatch]);

  if (!alert) return null;

  const getIcon = () => {
    switch (alert.type) {
      case 'success': return <CheckCircle size={22} />;
      case 'warning': return <AlertTriangle size={22} />;
      case 'info': return <Info size={22} />;
      default: return <AlertCircle size={22} />;
    }
  };

  return (
    <AnimatePresence>
      {alert.isVisible && (
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
            className={`global-error-content alert-${alert.type}`}
          >
            <div className={`error-icon-wrapper icon-${alert.type}`}>
              {getIcon()}
            </div>
            
            <div className="error-message-container">
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
            </div>

            <button 
              className="close-error-btn" 
              onClick={() => dispatch(hideAlert())}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
