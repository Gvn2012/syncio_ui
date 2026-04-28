import { useState, useEffect } from 'react';
import { urlCache } from '../common/utils/urlCache';

const CACHE_NAME = 'syncio-image-cache-v1';

// In-memory cache for blob URLs to prevent flickering on component remounts
const blobUrlCache = new Map<string, string>();
// Map to track in-flight requests to prevent duplicate blob URL creation
const pendingRequests = new Map<string, Promise<string>>();

export const checkImageCache = async (cacheKey: string | undefined): Promise<boolean> => {
  if (!cacheKey) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(cacheKey);
    return !!response;
  } catch (e) {
    return false;
  }
};

export const useCachedImage = (src: string | undefined, cacheKey?: string) => {
  const effectiveKey = cacheKey || src;
  
  const [cachedSrc, setCachedSrc] = useState<string | undefined>(() => {
    if (effectiveKey && blobUrlCache.has(effectiveKey)) return blobUrlCache.get(effectiveKey);
    if (src && urlCache.isBad(src)) return undefined;
    return undefined;
  });
  
  const [isLoading, setIsLoading] = useState(() => {
    if (!src && !effectiveKey) return false;
    if (src?.startsWith('data:') || src?.startsWith('blob:') || src?.includes('ui-avatars.com') || (effectiveKey && blobUrlCache.has(effectiveKey))) return false;
    return true;
  });

  const [error, setError] = useState<Error | null>(() => {
    if (src && urlCache.isBad(src)) return new Error('URL is marked as invalid (404)');
    return null;
  });

  useEffect(() => {
    if (!src && !effectiveKey) {
      setCachedSrc(undefined);
      setIsLoading(false);
      return;
    }

    // Use in-memory cache if available to prevent flicker
    if (effectiveKey && blobUrlCache.has(effectiveKey)) {
      setCachedSrc(blobUrlCache.get(effectiveKey));
      setIsLoading(false);
      return;
    }

    const loadAndCacheImage = async () => {
      if (!src || src.includes('ui-avatars.com')) return;
      
      const key = effectiveKey!;
      
      // If there's already a request in flight for this key, wait for it
      if (pendingRequests.has(key)) {
        try {
          const blobUrl = await pendingRequests.get(key);
          setCachedSrc(blobUrl);
          setIsLoading(false);
          return;
        } catch (err) {
          // If the pending request failed, we continue and try again
        }
      }

      const requestPromise = (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cacheKeyToUse = cacheKey || src;
          const cachedResponse = await cache.match(cacheKeyToUse);

          let blob: Blob;
          if (cachedResponse) {
            blob = await cachedResponse.blob();
          } else {
            const response = await fetch(src);
            if (response.status === 404) {
              urlCache.markBad(src);
              throw new Error('Image not found (404)');
            }
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            
            const responseToCache = response.clone();
            await cache.put(cacheKeyToUse, responseToCache);
            blob = await response.blob();
          }

          const blobUrl = URL.createObjectURL(blob);
          blobUrlCache.set(key, blobUrl);
          return blobUrl;
        } finally {
          pendingRequests.delete(key);
        }
      })();

      pendingRequests.set(key, requestPromise);
      setIsLoading(true);

      try {
        const blobUrl = await requestPromise;
        setCachedSrc(blobUrl);
      } catch (err) {
        console.error('Image caching failed:', err);
        setError(err as Error);
        setCachedSrc(src);
      } finally {
        setIsLoading(false);
      }
    };

    loadAndCacheImage();
  }, [src, effectiveKey]);

  return { cachedSrc, isLoading, error };
};
