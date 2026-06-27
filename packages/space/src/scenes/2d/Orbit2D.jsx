// Orbit2D — solar system diagram: central body + orbiting bodies with animated revolution.
// SVG dashed orbit rings; framer-motion rotation drives each body around the center.
// Reduced-motion: static positions via orbitPosition(), no rotation animation.
import { motion, useReducedMotion } from 'framer-motion';
import { orbitPosition, phaseMaskShift } from '../geometry.js';
import { SpaceStage } from './base.jsx';

// Width of the stage area for orbit placement
const W = 430;
const H = 230;
const CX = W / 2;
const CY = H / 2;

// Role-based body sizes
const ROLE_SIZE = { star: 52, planet: 28, moon: 14, blackhole: 36 };
const ROLE_GRADIENT = {
  star: 'radial-gradient(circle at 38% 35%, #fff7e0 0%, #ffe066 18%, #ffac18 48%, #c45a00 80%, #5a1800 100%)',
  planet:
    'radial-gradient(circle at 36% 32%, #c8e8ff 0%, #4fa8e8 22%, #1460b8 55%, #052050 85%, #020d1f 100%)',
  moon: 'radial-gradient(circle at 38% 32%, #e8e8e0 0%, #c0c0b8 25%, #8c8c80 60%, #404038 90%, #1a1a14 100%)',
  blackhole:
    'radial-gradient(circle at 50% 50%, #1a0808 0%, #0a0505 40%, #050202 70%, #020101 100%)',
};
const ROLE_GLOW = {
  star: 'rgba(255,180,30,0.7)',
  planet: 'rgba(60,150,255,0.55)',
  moon: 'rgba(200,200,180,0.25)',
  blackhole: 'rgba(255,80,30,0.6)',
};

// Auto-assign orbit radii when not provided
const AUTO_RADII = [62, 88, 110];

function CelestialBody({ role = 'planet', size, phaseLit, style: extraStyle }) {
  const grad = ROLE_GRADIENT[role] ?? ROLE_GRADIENT.planet;
  const glow = ROLE_GLOW[role] ?? ROLE_GLOW.planet;
  const boxShadow = `0 0 ${size * 0.5}px ${size * 0.25}px ${glow}`;
  const phaseShift = phaseLit != null ? phaseMaskShift(phaseLit, size) : null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: grad,
        boxShadow,
        position: 'relative',
        overflow: 'hidden',
        ...extraStyle,
      }}
    >
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
    </div>
  );
}

export default function Orbit2D({ bodies = [] }) {
  const reduce = useReducedMotion();

  // Separate center (no orbits prop) from orbiting bodies
  const center = bodies.find((b) => !b.orbits) ?? bodies[0];
  const orbiters = bodies.filter((b) => b.orbits || b !== center);

  // Assign radii to orbiters that don't specify one
  let autoIdx = 0;
  const orbitersWithRadius = orbiters.map((b) => ({
    ...b,
    radius: b.radius ?? AUTO_RADII[autoIdx++] ?? 80,
    period: b.period ?? 6,
  }));

  const centerSize = ROLE_SIZE[center?.role] ?? 36;

  return (
    <SpaceStage>
      <div className="relative h-full w-full">
        {/* SVG layer: dashed orbit rings */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ left: 0, top: 0 }}
        >
          {orbitersWithRadius.map((b) => (
            <ellipse
              key={b.id}
              cx={CX}
              cy={CY}
              rx={b.radius}
              ry={b.radius * 0.38}
              fill="none"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth={1}
              strokeDasharray="4 5"
            />
          ))}
        </svg>

        {/* Center body */}
        {center && (
          <div
            style={{
              position: 'absolute',
              left: CX - centerSize / 2,
              top: CY - centerSize / 2,
              zIndex: 2,
            }}
          >
            <CelestialBody role={center.role} size={centerSize} />
          </div>
        )}

        {/* Orbiting bodies */}
        {orbitersWithRadius.map((b, idx) => {
          const size = ROLE_SIZE[b.role] ?? 20;
          // Static angle for reduced motion (evenly spaced)
          const staticAngle = (360 / orbitersWithRadius.length) * idx;
          // Orbit is an inclined ellipse: rx = radius, ry = radius * 0.38
          const ry = b.radius * 0.38;

          if (reduce) {
            const pos = orbitPosition({ cx: CX, cy: CY, radius: b.radius, angleDeg: staticAngle });
            // Correct for inclined ellipse (y compressed)
            const px = CX + (pos.x - CX);
            const py = CY + (pos.y - CY) * 0.38;
            return (
              <div
                key={b.id}
                style={{
                  position: 'absolute',
                  left: px - size / 2,
                  top: py - size / 2,
                  zIndex: 3,
                }}
              >
                <CelestialBody role={b.role} size={size} phaseLit={b.phaseLit} />
              </div>
            );
          }

          // Animated orbit: use a rotating container, then counter-rotate child for label upright
          return (
            <motion.div
              key={b.id}
              style={{
                position: 'absolute',
                left: CX,
                top: CY,
                width: 0,
                height: 0,
                zIndex: 3,
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: b.period, ease: 'linear' }}
            >
              {/* Translate to orbit position along x axis, then squish y for inclined ellipse */}
              <div
                style={{
                  position: 'absolute',
                  left: b.radius - size / 2,
                  top: -size / 2,
                  transformOrigin: `${size / 2 - b.radius}px ${size / 2}px`,
                  transform: `scaleY(0.38)`,
                }}
              >
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: b.period, ease: 'linear' }}
                  style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
                >
                  <CelestialBody role={b.role} size={size} phaseLit={b.phaseLit} />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SpaceStage>
  );
}
