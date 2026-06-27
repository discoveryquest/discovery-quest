// Field2D — nebula / galaxy / star-field background with layered particle cloud.
// tint drives SpaceStage gradient; density drives particle count.
// Optional label renders as a centered heading. Reduced-motion: static only.
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SpaceStage } from './base.jsx';

const DENSITY_COUNT = { low: 18, medium: 34, high: 52 };

export default function Field2D({ tint, density = 'medium', label }) {
  const reduce = useReducedMotion();
  const count = DENSITY_COUNT[density] ?? 34;

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Spiral arrangement: mix a radial spiral with random scatter
        const angle = (i / count) * Math.PI * 6 + Math.random() * 1.2;
        const r = 0.08 + (i / count) * 0.42 + Math.random() * 0.12;
        const cx = 50 + Math.cos(angle) * r * 46 + (Math.random() - 0.5) * 22;
        const cy = 50 + Math.sin(angle) * r * 36 + (Math.random() - 0.5) * 18;
        const size = 2 + Math.random() * 5;
        const opacity = 0.25 + Math.random() * 0.55;
        // Tint-based color
        const hue =
          tint === 'nebula'
            ? `hsla(${270 + Math.random() * 60},80%,70%,${opacity})`
            : tint === 'aurora'
              ? `hsla(${160 + Math.random() * 40},70%,65%,${opacity})`
              : `hsla(${190 + Math.random() * 30},60%,80%,${opacity})`;
        return { cx, cy, size, hue, dur: 3 + Math.random() * 5, delay: Math.random() * 4 };
      }),
    [count, tint],
  );

  return (
    <SpaceStage tint={tint}>
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Particle cloud */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.cx}%`,
              top: `${p.cy}%`,
              width: p.size,
              height: p.size,
              background: p.hue,
              filter: `blur(${p.size > 5 ? 2 : 0.5}px)`,
            }}
            animate={reduce ? { opacity: 1 } : { opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
            transition={reduce ? {} : { repeat: Infinity, duration: p.dur, delay: p.delay }}
          />
        ))}

        {/* Optional label */}
        {label && (
          <p className="relative z-10 max-w-[320px] text-center text-lg font-extrabold tracking-wide text-white/90"
            style={{ textShadow: '0 0 18px rgba(150,100,255,0.8)' }}>
            {label}
          </p>
        )}
      </div>
    </SpaceStage>
  );
}
