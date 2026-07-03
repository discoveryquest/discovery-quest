// Body2D — single glowing celestial body with optional rings, phase mask, label.
// Supports roles: star, planet, moon, blackhole (each gets a distinctive gradient + glow).
// Reduced-motion: no idle float animation.
// Body2DContent is the bare inner content (no SpaceStage) for nesting as a scrub/reveal base.
import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { phaseMaskShift } from '../geometry.js';
import { celestialGradient, celestialGlow } from './roles.js';
import { SpaceStage, EmojiGlobe } from './base.jsx';

const BODY_SIZE = 120; // px diameter

// Per-role bloom radius (px) — larger for hotter/brighter bodies.
const ROLE_GLOW_SIZE = { star: 32, planet: 24, moon: 16, blackhole: 28 };

function Rings({ size, tilt = 20 }) {
  const uid = useId(); // unique per instance so two ringed bodies never share clipPath ids
  const rx = size * 0.72;
  const ry = rx * Math.sin((tilt * Math.PI) / 180) * 0.55;
  return (
    <svg
      width={size * 2}
      height={size}
      className="pointer-events-none absolute"
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      overflow="visible"
    >
      {/* back half (behind body) */}
      <ellipse
        cx={size}
        cy={size / 2}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgba(210,180,80,0.35)"
        strokeWidth={10}
        clipPath={`url(#ring-back-${uid})`}
      />
      {/* front half (over body) */}
      <ellipse
        cx={size}
        cy={size / 2}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgba(210,180,80,0.55)"
        strokeWidth={10}
        clipPath={`url(#ring-front-${uid})`}
      />
      <defs>
        <clipPath id={`ring-back-${uid}`}>
          <rect x={0} y={size / 2} width={size * 2} height={size} />
        </clipPath>
        <clipPath id={`ring-front-${uid}`}>
          <rect x={0} y={0} width={size * 2} height={size / 2} />
        </clipPath>
      </defs>
    </svg>
  );
}

// Bare content (no SpaceStage) — used standalone via Body2D, or nested as a scrub/reveal base.
export function Body2DContent({ body = {}, label }) {
  const reduce = useReducedMotion();
  const { role = 'planet', color, rings, tilt, phase } = body;
  const gradient = celestialGradient(role, color);
  const glow = celestialGlow(role, color);
  const glowSize = ROLE_GLOW_SIZE[role] ?? 24;
  const tiltDeg = tilt === true ? 23.5 : tilt;

  const boxShadow = [
    `0 0 ${glowSize}px ${glowSize / 2}px ${glow}`,
    `0 0 ${glowSize * 2}px ${glow.replace(/[\d.]+\)$/, '0.25)')}`,
    role === 'blackhole' ? `0 0 48px 10px rgba(255,80,30,0.35)` : null,
  ]
    .filter(Boolean)
    .join(', ');

  // Phase shadow mask (moon phases): a dark overlay offset horizontally.
  const phaseShift = phase != null ? phaseMaskShift(phase, BODY_SIZE) : null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: BODY_SIZE, height: BODY_SIZE }}>
        {rings && <Rings size={BODY_SIZE} tilt={typeof rings === 'number' ? rings : 20} />}

        <motion.div
          style={{
            width: BODY_SIZE,
            height: BODY_SIZE,
            borderRadius: '50%',
            background: role === 'planet' && color === 'earth' ? 'transparent' : gradient,
            boxShadow,
            transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
            position: 'relative',
            overflow: 'hidden',
          }}
          animate={reduce ? {} : { y: [-5, 5, -5] }}
          transition={reduce ? {} : { repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          {role === 'planet' && color === 'earth' && <EmojiGlobe size={BODY_SIZE} />}
          {phaseShift != null && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(4,4,12,0.92)',
                transform: `translateX(${phaseShift}px)`,
              }}
            />
          )}
        </motion.div>
      </div>

      {label && <p className="text-sm font-bold tracking-wide text-slate-300">{label}</p>}
    </div>
  );
}

export default function Body2D(props) {
  return (
    <SpaceStage>
      <Body2DContent {...props} />
    </SpaceStage>
  );
}
