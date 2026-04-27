import { useState, useEffect } from 'react';
import { urlCache } from '../common/utils/urlCache';

const CACHE_NAME = 'syncio-image-cache-v1';

// In-memory cache for blob URLs to prevent flickering on component remounts
const blobUrlCache = new Map<string, string>();

export const useCachedImage = (src: string | undefined) => {
  const [cachedSrc, setCachedSrc] = useState<string | undefined>(() => {
    if (src && blobUrlCache.has(src)) return blobUrlCache.get(src);
    if (src && urlCache.isBad(src)) return undefined;
    return undefined;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!src) return false;
    if (src.startsWith('data:') || src.startsWith('blob:') || src.includes('ui-avatars.com') || blobUrlCache.has(src) || urlCache.isBad(src)) return false;
    return true;
  });
  const [error, setError] = useState<Error | null>(() => {
    if (src && urlCache.isBad(src)) return new Error('URL is marked as invalid (404)');
    return null;
  });

  useEffect(() => {
    if (!src) {
      setCachedSrc(undefined);
      setIsLoading(false);
      return;
    }

    // Check if URL is known to be bad
    if (urlCache.isBad(src)) {
      setCachedSrc(undefined);
      setIsLoading(false);
      setError(new Error('URL is marked as invalid (404)'));
      return;
    }

    // Handle data URLs, blob URLs, or specific fallbacks immediately
    if (src.startsWith('data:') || src.startsWith('blob:') || src.includes('ui-avatars.com')) {
      setCachedSrc(src);
      setIsLoading(false);
      return;
    }

    // Use in-memory cache if available to prevent flicker
    if (blobUrlCache.has(src)) {
      setCachedSrc(blobUrlCache.get(src));
      setIsLoading(false);
      return;
    }

    const loadAndCacheImage = async () => {
      setIsLoading(true);
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(src);

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
          await cache.put(src, responseToCache);
          blob = await response.blob();
        }

        const blobUrl = URL.createObjectURL(blob);
        blobUrlCache.set(src, blobUrl);
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
  }, [src]);

  return { cachedSrc, isLoading, error };
};
