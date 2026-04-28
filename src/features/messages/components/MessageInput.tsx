import React from 'react';
import { Paperclip, Send, X } from 'lucide-react';

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  isEditing: boolean;
  editingContent?: string;
  onCancelEdit: () => void;
  uploadingItems: Array<{ id: string; progress: number; file: File }>;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  inputText,
  setInputText,
  onSendMessage,
  onKeyDown,
  onFileSelect,
  fileInputRef,
  textAreaRef,
  isEditing,
  editingContent,
  onCancelEdit,
  uploadingItems
}) => {
  return (
    <div className="chat-input-area">
      {uploadingItems.length > 0 && (
        <div className="selected-images-preview">
          {uploadingItems.map(item => (
            <div key={item.id} className="preview-item">
              {item.file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(item.file)} alt="preview" />
              ) : (
                <div className="file-icon-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                   <Paperclip size={16} />
                </div>
              )}
              <div className="upload-progress-overlay">
                <div className="progress-circle">
                   <div className="progress-percentage">{Math.round(item.progress * 100)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="editing-banner">
          <div className="editing-info">
             <span className="editing-label">Editing Message</span>
             <span className="editing-content">{editingContent}</span>
          </div>
          <button className="cancel-edit-btn" onClick={onCancelEdit}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="chat-input-container">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          multiple 
          onChange={onFileSelect}
          accept="image/*,video/*"
        />
        <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={20} />
        </button>
        
        <textarea
          ref={textAreaRef}
          className="chat-input"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />
        
        <button 
          className="send-btn"
          onClick={onSendMessage}
          disabled={!inputText.trim() && uploadingItems.length === 0}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

