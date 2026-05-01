import { useCallback, useState } from 'react';
import heic2any from 'heic2any';

export const useHEIC = () => {
  const [isConverting, setIsConverting] = useState(false);

  const processFiles = useCallback(async (files: File[]): Promise<File[]> => {
    setIsConverting(true);
    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
            try {
              const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
              const resultBlob = Array.isArray(blob) ? blob[0] : blob;
              const newName = file.name.replace(/\.heic$/i, '.jpg');
              return new File([resultBlob], newName, { type: 'image/jpeg' });
            } catch (err) {
              console.error('HEIC conversion error:', err);
              return file;
            }
          }
          return file;
        })
      );
      return processedFiles;
    } finally {
      setIsConverting(false);
    }
  }, []);

  return {
    processFiles,
    isConverting
  };
};
