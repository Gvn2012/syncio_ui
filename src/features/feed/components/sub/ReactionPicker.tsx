import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REACTION_CONFIG } from '../../utils/reactionUtils';
import { ReactionType } from '../../types';
import './ReactionPicker.css';

interface ReactionPickerProps {
  isVisible: boolean;
  onSelect: (type: ReactionType) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isVisible,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => {
  const reactions = Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="reaction-picker-container"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="reaction-picker-content">
            {reactions.map(([type, config], index) => {
              const Icon = config.icon;
              return (
                <motion.button
                  key={type}
                  className="reaction-option-btn"
                  onClick={() => onSelect(type)}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { delay: index * 0.05, duration: 0.3, type: "spring", stiffness: 260, damping: 20 }
                  }}
                  whileHover={{ scale: 1.3, y: -8 }}
                  whileTap={{ scale: 0.9 }}
                  title={config.label}
                >
                  <Icon size={24} style={{ color: config.color }} />
                  <span className="reaction-tooltip">{config.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
