import React from 'react';

interface PostContentProps {
  content: string;
  contentHtml?: string;
  mentions?: string[];
  tags?: string[];
}

export const PostContent: React.FC<PostContentProps> = ({ 
  content, 
  contentHtml,
}) => {
  // Use HTML if available, otherwise fallback to plain text
  // NOTE: In a real app, use a sanitizer like DOMPurify here.
  const hasHtml = !!contentHtml && contentHtml.length > 0;

  return (
    <div className="feed-content">
      {hasHtml ? (
        <div 
          className="content-rich" 
          dangerouslySetInnerHTML={{ __html: contentHtml }} 
        />
      ) : (
        <p className="content-plain">{content}</p>
      )}
    </div>
  );
};
