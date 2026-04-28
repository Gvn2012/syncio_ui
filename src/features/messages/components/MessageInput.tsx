import React from 'react';
import { Paperclip, Send, X, Mic, Square, Trash2 } from 'lucide-react';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { AudioPlayer } from './AudioPlayer';

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
  onSendAudio: (blob: Blob) => void;
  stagedAudio: File | null;
  onClearStagedAudio: () => void;
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
  uploadingItems,
  onSendAudio,
  stagedAudio,
  onClearStagedAudio
}) => {
  const {
    isRecording,
    audioBlob,
    recordingDuration,
    startRecording,
    stopRecording,
    discardRecording
  } = useAudioRecorder();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendAudio(audioBlob);
      discardRecording();
    } else if (stagedAudio) {
      onSendAudio(stagedAudio);
      onClearStagedAudio();
    } else {
      onSendMessage();
    }
  };

  const previewAudioSrc = React.useMemo(() => {
    if (audioBlob) return URL.createObjectURL(audioBlob);
    if (stagedAudio) return URL.createObjectURL(stagedAudio);
    return null;
  }, [audioBlob, stagedAudio]);
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
          accept="image/*,video/*,audio/*"
        />
        <button className="icon-btn" onClick={() => fileInputRef.current?.click()} disabled={isRecording}>
          <Paperclip size={20} />
        </button>
        
        {isRecording ? (
          <div className="chat-input-recording">
            <span className="recording-dot"></span>
            Recording... {formatTime(recordingDuration)}
          </div>
        ) : previewAudioSrc ? (
          <div className="chat-input-audio-preview">
            <AudioPlayer src={previewAudioSrc} />
          </div>
        ) : (
          <textarea
            ref={textAreaRef}
            className="chat-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
          />
        )}
        
        {!inputText.trim() && uploadingItems.length === 0 && !previewAudioSrc ? (
          isRecording ? (
            <button className="icon-btn text-red-500" onClick={stopRecording}>
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button className="icon-btn" onClick={startRecording}>
              <Mic size={20} />
            </button>
          )
        ) : (
          <div className="chat-input-actions">
            {previewAudioSrc && (
              <button 
                className="icon-btn delete-audio-btn" 
                onClick={() => {
                  if (audioBlob) discardRecording();
                  if (stagedAudio) onClearStagedAudio();
                }}
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              className="send-btn"
              onClick={handleSend}
              disabled={(!inputText.trim() && uploadingItems.length === 0 && !previewAudioSrc) || isRecording}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

