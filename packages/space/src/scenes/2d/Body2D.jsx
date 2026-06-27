// Body2D — single glowing celestial body with optional rings, phase mask, label.
// Supports roles: star, planet, moon, blackhole (each gets a distinctive gradient + glow).
// Reduced-motion: no idle float animation.
import { motion, useReducedMotion } from 'framer-motion';
import { phaseMaskShift } from '../geometry.js';
import { SpaceStage } from './base.jsx';

const BODY_SIZE = 120; // px diameter

// Role → gradient + bloom color
const ROLE_STYLES = {
  star: {
    gradient:
      'radial-gradient(circle at 38% 35%, #fff7e0 0%, #ffe066 18%, #ffac18 48%, #c45a00 80%, #5a1800 100%)',
    glow: 'rgba(255,180,30,0.7)',
    glowSize: 32,
  },
  planet: {
    gradient:
      'radial-gradient(circle at 36% 32%, #c8e8ff 0%, #4fa8e8 22%, #1460b8 55%, #052050 85%, #020d1f 100%)',
    glow: 'rgba(60,150,255,0.55)',
    glowSize: 24,
  },
  moon: {
    gradient:
      'radial-gradient(circle at 38% 32%, #e8e8e0 0%, #c0c0b8 25%, #8c8c80 60%, #404038 90%, #1a1a14 100%)',
    glow: 'rgba(200,200,180,0.35)',
    glowSize: 16,
  },
  blackhole: {
    gradient:
      'radial-gradient(circle at 50% 50%, #1a0808 0%, #0a0505 40%, #050202 70%, #020101 100%)',
    glow: 'rgba(255,80,30,0.7)',
    glowSize: 28,
  },
};

function Rings({ size, tilt = 20 }) {
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
        strokeDasharray="0 0"
        clipPath="url(#ring-back)"
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
        clipPath="url(#ring-front)"
      />
      <defs>
        <clipPath id="ring-back">
          <rect x={0} y={size / 2} width={size * 2} height={size} />
        </clipPath>
        <clipPath id="ring-front">
          <rect x={0} y={0} width={size * 2} height={size / 2} />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function Body2D({ body = {}, label }) {
  const reduce = useReducedMotion();
  const { role = 'planet', rings, tilt, phase } = body;
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.planet;

  const boxShadow = [
    `0 0 ${style.glowSize}px ${style.glowSize / 2}px ${style.glow}`,
    `0 0 ${style.glowSize * 2}px ${style.glow.replace(/[\d.]+\)$/, '0.25)')}`,
    // accretion ring glow for black holes
    role === 'blackhole' ? `0 0 48px 10px rgba(255,80,30,0.35)` : null,
  ]
    .filter(Boolean)
    .join(', ');

  // Phase shadow mask (moon phases). The mask is a dark overlay offset horizontally.
  const phaseShift = phase != null ? phaseMaskShift(phase, BODY_SIZE) : null;

  return (
    <SpaceStage>
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="relative" style={{ width: BODY_SIZE, height: BODY_SIZE }}>
          {/* Rings behind body */}
          {rings && <Rings size={BODY_SIZE} tilt={typeof rings === 'number' ? rings : 20} />}

          {/* The body itself */}
          <motion.div
            style={{
              width: BODY_SIZE,
              height: BODY_SIZE,
              borderRadius: '50%',
              background: style.gradient,
              boxShadow,
              transform: tilt ? `rotate(${tilt}deg)` : undefined,
              position: 'relative',
              overflow: 'hidden',
            }}
            animate={reduce ? {} : { y: [-5, 5, -5] }}
            transition={reduce ? {} : { repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            {/* Phase shadow mask */}
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

        {label && (
          <p className="text-sm font-bold tracking-wide text-slate-300">{label}</p>
        )}
      </div>
    </SpaceStage>
  );
}
