import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query without effect/state boilerplate; safe under StrictMode. */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', notify);
      return () => media.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
