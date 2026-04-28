import React from 'react';
import { Edit, Clock, Trash } from 'lucide-react';
import { type MessageResponse, MessageContentType } from '../types';
import type { MediaItem } from '../types';
import { MediaItemRenderer, getMediaUrl } from './MediaItemRenderer';
import { UserAvatar } from '../../../components/UserAvatar';
import { useParticipant } from '../hooks/useParticipant';

/**
 * Look up a signed URL for a media item, trying multiple keys:
 * 1. downloadUrl
 * 2. uploadUrl  
 * 3. Constructed GCS path (msg/{conversationId}/{mediaType}/{id})
 */
const resolveSignedUrl = (item: MediaItem, signedUrls: Record<string, string>): string | undefined => {
  if (item.downloadUrl && signedUrls[item.downloadUrl]) return signedUrls[item.downloadUrl];
  if (item.uploadUrl && signedUrls[item.uploadUrl]) return signedUrls[item.uploadUrl];
  // Fallback: construct GCS path and check
  if (item.conversationId && item.mediaType && item.id) {
    const gcsPath = `msg/${item.conversationId}/${item.mediaType}/${item.id}`;
    if (signedUrls[gcsPath]) return signedUrls[gcsPath];
  }
  return undefined;
};

interface MessageGroupProps {
  group: any;
  currentUserId: string | null;
  isConsecutiveGroup: boolean;
  isLastInConversation: boolean;
  expandedMessageId: string | null;
  setExpandedMessageId: (id: string | null) => void;
  formatTimestamp: (ts: string) => Date;
  getStatusIcon: (msg: MessageResponse) => React.ReactNode;
  onEdit: (msg: MessageResponse) => void;
  onRecall: (msg: MessageResponse) => void;
  onDelete: (msg: MessageResponse) => void;
  onOpenLightbox: (images: string[], index: number) => void;
  signedUrls: Record<string, string>;
  avatars?: Record<string, string>;
}

export const MessageGroup = React.memo<MessageGroupProps>(({
  group,
  currentUserId,
  isConsecutiveGroup,
  isLastInConversation,
  expandedMessageId,
  setExpandedMessageId,
  formatTimestamp,
  getStatusIcon,
  onEdit,
  onRecall,
  onDelete,
  onOpenLightbox,
  signedUrls,
  avatars = {}
}) => {
  const isSent = group.senderId === currentUserId;
  const { participant } = useParticipant(avatars[group.senderId] ? undefined : group.senderId);
  const avatarSrc = avatars[group.senderId] || participant?.avatar;

  if (group.isMediaGroup) {
    return (
      <div 
        className={`message-group ${isSent ? 'sent' : 'received'} ${isConsecutiveGroup ? 'grouped' : 'first-in-group'}`}
      >
        {!isSent && !isConsecutiveGroup && (
          <UserAvatar size={32} userId={group.senderId} src={avatarSrc} className="message-avatar" showLink={false} />
        )}
        <div className="message-bubble-wrapper media-wrapper">
          <div className="media-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${Math.min(group.messages.reduce((acc: number, m: any) => acc + (m.mediaItems?.length || 1), 0), 3)}, 1fr)`,
            gap: '4px',
            maxWidth: '400px',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {group.messages.map((msg: MessageResponse) => {
              const isPending = msg.type === MessageContentType.IMAGE_PENDING || msg.type === MessageContentType.VIDEO_PENDING;
              
              const allImageUrls = group.messages.flatMap((m: MessageResponse) => 
                m.mediaItems?.filter(i => i.mediaType === 'IMAGE').map(i => getMediaUrl(i.downloadUrl || i.uploadUrl, resolveSignedUrl(i, signedUrls))) || 
                (m.type === MessageContentType.IMAGE && m.mediaUrl ? [getMediaUrl(m.mediaUrl, signedUrls[m.mediaUrl])] : [])
              );

              if (msg.mediaItems && msg.mediaItems.length > 0) {
                return msg.mediaItems.map((item) => (
                  <MediaItemRenderer 
                    key={item.id} 
                    item={item}
                    isPending={isPending}
                    prefetchedUrl={resolveSignedUrl(item, signedUrls)}
                    priority={isLastInConversation}
                    onClick={() => {
                      if (item.mediaType === 'IMAGE') {
                        const currentUrl = getMediaUrl(item.downloadUrl || item.uploadUrl, resolveSignedUrl(item, signedUrls));
                        const index = allImageUrls.indexOf(currentUrl);
                        onOpenLightbox(allImageUrls, index >= 0 ? index : 0);
                      }
                    }}
                  />
                ));
              }
              
              return (
                <MediaItemRenderer 
                  key={msg.id} 
                  item={{
                    id: msg.mediaId || msg.id,
                    batchId: msg.batchId || '',
                    conversationId: msg.conversationId,
                    fileName: 'media',
                    contentType: '',
                    mediaType: msg.type === MessageContentType.VIDEO ? 'VIDEO' : 'IMAGE',
                    status: 'COMPLETED',
                    downloadUrl: msg.mediaUrl
                  }}
                  isPending={isPending}
                  prefetchedUrl={msg.mediaUrl ? signedUrls[msg.mediaUrl] : undefined}
                  priority={isLastInConversation}
                  onClick={() => {
                    if (msg.type === MessageContentType.IMAGE && msg.mediaUrl) {
                      const currentUrl = getMediaUrl(msg.mediaUrl, signedUrls[msg.mediaUrl]);
                      const index = allImageUrls.indexOf(currentUrl);
                      onOpenLightbox(allImageUrls, index >= 0 ? index : 0);
                    }
                  }}
                />
              );
            })}
          </div>
          {group.messages.map((msg: MessageResponse) => msg.content && !msg.isRecalled && (
            <div key={`caption-${msg.id}`} className="message-bubble media-caption">
              <div className="text-content">{msg.content}</div>
            </div>
          ))}
          <div className="message-meta-interactive">
             <span className="time">
                {formatTimestamp(group.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {isSent && getStatusIcon(group.messages[group.messages.length - 1])}
          </div>
        </div>
      </div>
    );
  }

  const msg = group.messages[0];
  const isExpanded = expandedMessageId === msg.id;

  return (
    <div 
      key={msg.id} 
      className={`message-group ${isSent ? 'sent' : 'received'} ${isConsecutiveGroup ? 'grouped' : 'first-in-group'} ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
    >
      {!isSent && !isConsecutiveGroup && (
        <UserAvatar size={32} userId={msg.senderId} src={avatarSrc} className="message-avatar" showLink={false} />
      )}
      <div className="message-bubble-wrapper">
        <div className={`message-bubble ${msg.isRecalled ? 'recalled' : ''}`}>
          <div className="text-content">
            {msg.isRecalled ? 'This message was recalled' : msg.content}
          </div>
        </div>
        {(isLastInConversation || isExpanded || msg.isEdited) && (
          <div className="message-meta-interactive">
            <span className="time">
               {formatTimestamp(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {msg.isEdited && !msg.isRecalled && (
              <span className="edited-indicator" title="Edited">
                <Edit size={10} />
              </span>
            )}
            {isSent && !msg.isRecalled && getStatusIcon(msg)}
            {isExpanded && !msg.isRecalled && (
              <div className="message-actions">
                {isSent && (new Date().getTime() - formatTimestamp(msg.timestamp).getTime() < 6 * 60 * 60 * 1000) && (
                  <>
                    <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); onEdit(msg); }} title="Edit message">
                      <Edit size={14} /> <span>Edit</span>
                    </button>
                    <button className="action-btn recall" onClick={(e) => { e.stopPropagation(); onRecall(msg); }} title="Recall for everyone">
                      <Clock size={14} /> <span>Recall</span>
                    </button>
                  </>
                )}
                <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(msg); }} title="Delete for me">
                  <Trash size={14} /> <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
