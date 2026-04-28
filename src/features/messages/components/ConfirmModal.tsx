import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onClose: () => void;
  type: 'danger' | 'warning' | 'info';
  icon: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  onConfirm, 
  onClose,
  type,
  icon
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="delete-modal-overlay" onClick={onClose}>
          <motion.div 
            className="delete-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`delete-icon-wrapper icon-${type}`}>
              {icon}
            </div>
            <h3>{title}</h3>
            <p>{message}</p>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={onClose}>Cancel</button>
              <button 
                className={`delete-confirm-btn btn-${type}`} 
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
