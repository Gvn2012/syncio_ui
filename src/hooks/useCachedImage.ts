import { useState, useEffect } from 'react';
import { urlCache } from '../common/utils/urlCache';

const CACHE_NAME = 'syncio-image-cache-v1';

// In-memory cache for blob URLs to prevent flickering on component remounts
const blobUrlCache = new Map<string, string>();

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
      setIsLoading(true);
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
        if (effectiveKey) blobUrlCache.set(effectiveKey, blobUrl);
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
