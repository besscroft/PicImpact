import { useState, useEffect } from 'react'

export const useHydrated = () => {
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
};