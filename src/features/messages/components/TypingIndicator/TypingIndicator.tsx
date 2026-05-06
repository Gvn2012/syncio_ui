import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  names?: string[];
  isSmall?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ names = [], isSmall = false }) => {
  const getText = () => {
    if (names.length === 0) return 'typing...';
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]} are typing...`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;
  };

  return (
    <div className={`typing-indicator-container ${isSmall ? 'small' : ''}`}>
      <div className="typing-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      {!isSmall && <span className="typing-text-label">{getText()}</span>}
    </div>
  );
};
