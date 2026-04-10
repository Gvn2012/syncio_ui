import { useState, useEffect } from 'react';

const CACHE_NAME = 'syncio-image-cache-v1';

export const useCachedImage = (src: string | undefined) => {
  const [cachedSrc, setCachedSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) {
      setCachedSrc(undefined);
      setIsLoading(false);
      return;
    }

    if (src.startsWith('data:') || src.includes('ui-avatars.com')) {
      setCachedSrc(src);
      setIsLoading(false);
      return;
    }

    const loadAndCacheImage = async () => {
      setIsLoading(true);
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(src);

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          setCachedSrc(URL.createObjectURL(blob));
          setIsLoading(false);
          return;
        }

        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const responseToCache = response.clone();
        await cache.put(src, responseToCache);

        const blob = await response.blob();
        setCachedSrc(URL.createObjectURL(blob));
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
