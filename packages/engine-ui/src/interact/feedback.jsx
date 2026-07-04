// interact/feedback — the shared right/wrong/celebrate vocabulary, so every
// course's manipulatives feel like one game: SnapGlow (one-shot expanding ring
// on a correct placement), ConfettiBurst (win celebration), useShake (wrong-
// answer wobble for elements that aren't DragPieces — pieces shake themselves).
// All transform/opacity-only and silent under prefers-reduced-motion.
import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export function SnapGlow({ show, color = '#4ADE80' }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 0 3px ${color}` }}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.35 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
}

const CONFETTI = ['🎉', '⭐', '✨', '🟡', '🔷'];

export function ConfettiBurst({ show, count = 18 }) {
  const reduce = useReducedMotion();
  if (reduce || !show) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const d = 70 + (i % 4) * 26;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-lg"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d - 30, opacity: 0, scale: 1.15, rotate: i % 2 ? 160 : -160 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: (i % 5) * 0.03 }}
          >
            {CONFETTI[i % CONFETTI.length]}
          </motion.span>
        );
      })}
    </div>
  );
}

// For non-piece elements that need a wrong-answer wobble:
//   const [shakeProps, shake] = useShake();  <motion.div {...shakeProps}>…
export function useShake() {
  const [nonce, setNonce] = useState(0);
  const trigger = useCallback(() => setNonce((n) => n + 1), []);
  const props = {
    key: undefined, // callers keep their own key
    animate: nonce ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 },
    transition: { duration: 0.36 },
    custom: nonce,
  };
  return [props, trigger, nonce];
}
