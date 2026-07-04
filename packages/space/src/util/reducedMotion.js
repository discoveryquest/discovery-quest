import { useEffect, useState } from 'react';

// Respect the OS "reduce motion" setting (spec §9): skip warp/flight animation,
// dampen parallax. Returns a boolean that updates if the preference changes.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}
