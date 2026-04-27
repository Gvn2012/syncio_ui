import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { UserAvatar } from '../../../../components/UserAvatar';
import './CommentInput.css';

interface CommentInputProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  isReply?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  placeholder = "Write a comment...",
  onSubmit,
  isLoading = false,
  autoFocus = false,
  onCancel,
  isReply = false
}) => {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || isLoading) return;
    onSubmit(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  const adjustHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  return (
    <div className={`comment-input-container ${isReply ? 'reply-input' : ''}`}>
      <div className="input-avatar">
        <UserAvatar size={isReply ? 32 : 40} />
      </div>
      <form className="input-field-wrapper" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="comment-textarea"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
        />
        <div className="input-actions">
          <div className="input-tools">
            <button type="button" className="tool-btn" title="Add Emoji">
              <Smile size={18} />
            </button>
            <button type="button" className="tool-btn" title="Attach File">
              <Paperclip size={18} />
            </button>
          </div>
          <div className="submit-actions">
            {onCancel && (
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className={`send-btn ${content.trim() ? 'active' : ''}`}
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? (
                <div className="loading-dots">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
