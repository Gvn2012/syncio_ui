import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'syncio_scroll_positions';

const getSavedPositions = (): Record<string, number> => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const savePosition = (path: string, position: number) => {
  if (position < 0) return;
  try {
    const positions = getSavedPositions();
    positions[path] = position;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {
    console.warn('Failed to save scroll position', e);
  }
};

export const useScrollRestoration = (isDataLoaded: boolean, dependency?: any) => {
  const { pathname } = useLocation();
  const lastScrollPos = useRef(0);
  const isRestored = useRef(false);

  useEffect(() => {
    isRestored.current = false;
  }, [pathname]);

  useLayoutEffect(() => {
    const container = document.querySelector('.page-container');
    if (!container || !isDataLoaded || isRestored.current) return;

    const positions = getSavedPositions();
    const savedPos = positions[pathname];

    if (savedPos !== undefined && savedPos > 0) {
      let attempts = 0;
      const maxAttempts = 15;
      
      const tryRestore = () => {
        const currentContainer = document.querySelector('.page-container');
        if (!currentContainer) return;

        if (currentContainer.scrollHeight >= savedPos || attempts >= maxAttempts) {
          currentContainer.scrollTo({
            top: savedPos,
            behavior: 'instant' as any
          });
          isRestored.current = true;
        } else {
          attempts++;
          setTimeout(tryRestore, 100);
        }
      };

      const timer = setTimeout(tryRestore, 50);
      return () => clearTimeout(timer);
    } else {
      isRestored.current = true;
    }
  }, [isDataLoaded, pathname, dependency]);

  useEffect(() => {
    const container = document.querySelector('.page-container');
    if (!container) return;

    const handleScroll = () => {
      const currentScroll = container.scrollTop;
      lastScrollPos.current = currentScroll;
      
      if (currentScroll > 0) {
        savePosition(pathname, currentScroll);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      if (lastScrollPos.current > 0) {
        savePosition(pathname, lastScrollPos.current);
      }
      container.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);
};
