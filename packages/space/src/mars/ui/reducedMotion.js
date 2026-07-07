import { useEffect, useState } from 'react';

// Whether the visitor asked the OS to reduce motion (spec R4). We dampen the
// showy stuff (drifting dust, camera bob) while keeping the world explorable.
const QUERY = '(prefers-reduced-motion: reduce)';

// Non-reactive read for hot paths inside the Canvas (e.g. per-frame loops).
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(QUERY).matches
    : false;
}

// Reactive hook for UI that should re-render if the preference changes.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}
