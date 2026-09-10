'use client';

import { useEffect, useState } from 'react';

const QUERY = '(hover: hover) and (pointer: fine)';

export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const sync = () => setFine(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return fine;
}
