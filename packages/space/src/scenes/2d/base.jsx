// Shared backdrop primitives for the 2D cinematic lesson scenes.
// Starfield: random drifting stars (useReducedMotion = static opacity, no drift).
// SpaceStage: dark space gradient container that all 2D renderers mount on.
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Starfield({ count = 26 }) {
  const reduce = useReducedMotion();
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 5,
        dur: 3 + Math.random() * 4,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
          animate={reduce ? { opacity: 0.6 } : { opacity: [0, 0.85, 0], y: [-4, 6] }}
          transition={reduce ? {} : { repeat: Infinity, duration: s.dur, delay: s.delay }}
        />
      ))}
    </div>
  );
}

// Earth is drawn everywhere as the platform's 🌍 emoji (the globe kids see on the
// map icon), not a hand-painted gradient ball. Two helpers, one per render context.
export const EARTH_EMOJI = '🌍';

/** DOM context: an emoji sized to fill a `size`×`size` box (crop to a circle via
 * the parent's border-radius/overflow when needed). */
export function EmojiGlobe({ size, emoji = EARTH_EMOJI, style }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width: size,
        height: size,
        fontSize: size * 0.92,
        lineHeight: `${size}px`,
        textAlign: 'center',
        userSelect: 'none',
        ...style,
      }}
    >
      {emoji}
    </span>
  );
}

/** SVG context: an emoji glyph centred on (x,y) filling a circle of radius r. */
export function SvgEmoji({ x, y, r, emoji = EARTH_EMOJI }) {
  return (
    <text x={x} y={y} fontSize={r * 2} textAnchor="middle" dominantBaseline="central" aria-hidden>
      {emoji}
    </text>
  );
}

export function SpaceStage({ children, tint }) {
  const bg =
    tint === 'nebula'
      ? 'radial-gradient(120% 90% at 60% 35%, #2a1147 0%, #120a26 55%, #06060e 100%)'
      : tint === 'aurora'
        ? 'radial-gradient(120% 90% at 40% 30%, #0d2e2e 0%, #0a1a18 55%, #050d0c 100%)'
        : 'radial-gradient(120% 90% at 70% 30%, #1a1140 0%, #0a0a18 55%, #05060d 100%)';
  return (
    <div
      className="relative h-[230px] w-full overflow-hidden rounded-2xl"
      style={{ background: bg }}
    >
      <Starfield />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
