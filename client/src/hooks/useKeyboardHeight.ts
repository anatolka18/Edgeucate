import { useState, useEffect } from 'react';

export const useKeyboardHeight = () => {
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) {
      const handleResize = () => setViewportHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const handleResize = () => {
      setViewportHeight(vv.height);
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  return { viewportHeight };
};