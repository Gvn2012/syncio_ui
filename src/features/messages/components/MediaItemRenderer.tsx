import React, { useState, useEffect, useRef } from 'react';
import { Loader } from 'lucide-react';
import type { MediaItem } from '../types';
import { uploadService, isUrlExpired } from '../../../api/upload.service';
import { CachedImage } from '../../../components/common/CachedImage';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';
import { checkImageCache } from '../../../hooks/useCachedImage';

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

  const signedUrlRef = useRef<string | null>(prefetchedUrl || null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    signedUrlRef.current = signedUrl;
  }, [signedUrl]);

  useEffect(() => {
    if (prefetchedUrl && !isUrlExpired(prefetchedUrl)) {
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

    if (item.downloadUrl?.startsWith('http') && !signedUrlRef.current) {
      setSignedUrl(item.downloadUrl);
    }

    if (!urlToResolve || urlToResolve.startsWith('http')) {
      if (!signedUrlRef.current && item.uploadUrl?.startsWith('http')) {
        setSignedUrl(item.uploadUrl);
      }
      return;
    }
    
    let isMounted = true;
    const fetchUrl = async (retryCount = 0) => {
      if (signedUrlRef.current && !signedUrlRef.current.startsWith('http') && !isUrlExpired(signedUrlRef.current)) return; 
      
      const isCached = await checkImageCache(urlToResolve);
      if (isCached && isMounted) {
        setSignedUrl(urlToResolve!); 
        return;
      }

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
          setSignedUrl('');
        }
      });
    };

    const shouldFetchImmediately = priority;

    if (shouldFetchImmediately) {
      fetchUrl();
      return () => { isMounted = false; };
    }

    if (item.mediaType === 'IMAGE' || item.mediaType === 'VIDEO') {
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
  }, [item.downloadUrl, item.uploadUrl, item.conversationId, item.mediaType, item.id, prefetchedUrl, priority]);

  if (isPending || (signedUrl === null && (item.mediaType === 'IMAGE' || item.mediaType === 'VIDEO'))) {
    return (
      <div className="media-item-loading" ref={containerRef}>
        <Loader size={20} className="animate-spin" />
        {isPending && <span>Uploading...</span>}
      </div>
    );
  }

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
      {item.mediaType === 'IMAGE' && (
        <CachedImage src={signedUrl!} cacheKey={item.downloadUrl || item.uploadUrl} alt={item.fileName || 'media'} showLoader />
      )}
      {item.mediaType === 'VIDEO' && (
        <VideoPlayer src={signedUrl!} autoPlay={false} />
      )}
      {item.mediaType === 'AUDIO' && (
        <AudioPlayer src={signedUrl!} />
      )}
    </div>
  );
};
