import React from 'react';
import { useCachedImage } from '../../hooks/useCachedImage';
import { Loader2 } from 'lucide-react';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  showLoader?: boolean;
  cacheKey?: string;
}

export const CachedImage: React.FC<CachedImageProps> = ({ 
  src, 
  fallbackSrc, 
  showLoader = false,
  cacheKey,
  className,
  alt,
  ...props 
}) => {
  const { cachedSrc, isLoading, error } = useCachedImage(src, cacheKey);

  if (isLoading && showLoader) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse`}>
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
      </div>
    );
  }

  const finalSrc = error ? (fallbackSrc || '') : (cachedSrc || fallbackSrc || src);

  return (
    <img 
      src={finalSrc} 
      alt={alt}
      className={className}
      {...props}
    />
  );
};
