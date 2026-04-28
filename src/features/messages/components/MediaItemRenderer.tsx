import React, { useState, useEffect, useRef } from 'react';
import { Loader, Play } from 'lucide-react';
import type { MediaItem } from '../types';
import { uploadService } from '../../../api/upload.service';
import { CachedImage } from '../../../components/common/CachedImage';
import { VideoPlayer } from './VideoPlayer';

export const getMediaUrl = (path: string | undefined | null, signedUrl?: string) => {
  if (signedUrl) return signedUrl;
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return '';
};


const buildGcsPath = (item: MediaItem): string | null => {
  if (item.conversationId && item.mediaType && item.id) {
    return `msg/${item.conversationId}/${item.mediaType}/${item.id}`;
  }
  return null;
};

interface MediaItemRendererProps {
  item: MediaItem;
  onClick: () => void;
  isPending?: boolean;
  prefetchedUrl?: string;
  priority?: boolean;
}

export const MediaItemRenderer: React.FC<MediaItemRendererProps> = ({ item, onClick, isPending, prefetchedUrl, priority }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(prefetchedUrl || null);
  const [isInteracted, setIsInteracted] = useState(false);
  const signedUrlRef = useRef<string | null>(prefetchedUrl || null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync ref with state
  useEffect(() => {
    signedUrlRef.current = signedUrl;
  }, [signedUrl]);

  useEffect(() => {
    if (prefetchedUrl) {
      setSignedUrl(prefetchedUrl);
      return;
    }

    let urlToResolve = item.downloadUrl;
    if (!urlToResolve || urlToResolve.startsWith('http')) {
      const gcsPath = buildGcsPath(item);
      if (gcsPath) {
        urlToResolve = gcsPath;
      }
    }

    // If we have an HTTP URL already, use it as the current signedUrl
    if (item.downloadUrl?.startsWith('http') && !signedUrlRef.current) {
      setSignedUrl(item.downloadUrl);
    }

    // If there's nothing to resolve and no current signedUrl, try uploadUrl as last resort
    if (!urlToResolve || urlToResolve.startsWith('http')) {
      if (!signedUrlRef.current && item.uploadUrl?.startsWith('http')) {
        setSignedUrl(item.uploadUrl);
      }
      return;
    }
    
    let isMounted = true;
    const fetchUrl = (retryCount = 0) => {
      if (signedUrlRef.current && !signedUrlRef.current.startsWith('http')) return; 
      
      uploadService.requestDownloadUrls([urlToResolve!]).then(res => {
        if (isMounted && res.data?.downloadUrls?.[urlToResolve!]) {
          const newUrl = res.data.downloadUrls[urlToResolve!];
          setSignedUrl(newUrl);
        } else if (isMounted && retryCount < 3) {
          setTimeout(() => fetchUrl(retryCount + 1), 2000 * (retryCount + 1));
        }
      }).catch(err => {
        console.error(`Failed to fetch signed URL for ${urlToResolve}`, err);
        if (isMounted && retryCount < 2) {
          setTimeout(() => fetchUrl(retryCount + 1), 3000);
        } else if (isMounted && !signedUrlRef.current) {
          setSignedUrl(''); // Mark as failed
        }
      });
    };

    // For videos, we only fetch if the user has interacted (clicked)
    // For images, we fetch on priority or intersection
    const shouldFetchImmediately = priority && (item.mediaType === 'IMAGE' || isInteracted);
    
    if (shouldFetchImmediately) {
      fetchUrl();
      return () => { isMounted = false; };
    }

    // Only set up observer for images, or for videos that have been interacted with
    if (item.mediaType === 'IMAGE' || isInteracted) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchUrl();
          observer.disconnect();
        }
      }, { rootMargin: '200px' });

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => { 
        isMounted = false; 
        observer.disconnect(); 
      };
    }

    return () => { isMounted = false; };
  }, [item.downloadUrl, item.uploadUrl, item.conversationId, item.mediaType, item.id, prefetchedUrl, priority, isInteracted]);

  const handleVideoClick = () => {
    setIsInteracted(true);
  };

  // Loading state: only show spinner if signedUrl is null and it's an image or video being loaded
  if (isPending || (signedUrl === null && (item.mediaType === 'IMAGE' || isInteracted))) {
    return (
      <div className="media-item-loading" ref={containerRef}>
        <Loader size={20} className="animate-spin" />
        {isPending && <span>Uploading...</span>}
      </div>
    );
  }

  // Video placeholder (before click)
  if (item.mediaType === 'VIDEO' && !isInteracted) {
    return (
      <div 
        ref={containerRef}
        className="media-item video-placeholder clickable"
        onClick={handleVideoClick}
      >
        <div className="video-overlay-play static">
          <Play fill="currentColor" size={32} />
        </div>
        <span className="text-xs mt-2 opacity-50">Click to load video</span>
      </div>
    );
  }

  // If failed and no fallback, show placeholder or error state
  if (signedUrl === '') {
    return (
      <div className="media-item-error" ref={containerRef}>
        <span className="text-xs opacity-50">Failed to load</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`media-item ${item.mediaType === 'IMAGE' ? 'clickable' : ''}`}
      onClick={item.mediaType === 'IMAGE' ? onClick : undefined}
    >
      {item.mediaType === 'IMAGE' ? (
        <CachedImage src={signedUrl!} cacheKey={item.downloadUrl || item.uploadUrl} alt={item.fileName || 'media'} showLoader />
      ) : (
        <VideoPlayer src={signedUrl!} autoPlay={true} />
      )}
    </div>
  );
};
