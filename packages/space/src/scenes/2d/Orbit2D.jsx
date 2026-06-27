// Orbit2D — solar system diagram: central body + orbiting bodies with animated revolution.
// SVG dashed orbit rings; framer-motion rotation drives each body around the center.
// Reduced-motion: static positions via orbitPosition(), no rotation animation.
// Orbit2DContent is the bare inner content (no SpaceStage) for nesting as a scrub/reveal base.
import { motion, useReducedMotion } from 'framer-motion';
import { orbitPosition, phaseMaskShift } from '../geometry.js';
import { roleGradient, roleGlow } from './roles.js';
import { SpaceStage } from './base.jsx';

// Width of the stage area for orbit placement
const W = 430;
const H = 230;
const CX = W / 2;
const CY = H / 2;

const ROLE_SIZE = { star: 52, planet: 28, moon: 14, blackhole: 36 };

// Auto-assign orbit radii when not provided
const AUTO_RADII = [62, 88, 110];

function CelestialBody({ role = 'planet', size, phaseLit, style: extraStyle }) {
  const grad = roleGradient(role);
  const glow = roleGlow(role);
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

// Bare content (no SpaceStage) — used standalone via Orbit2D, or nested as a scrub/reveal base.
export function Orbit2DContent({ bodies = [] }) {
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
        const staticAngle = (360 / orbitersWithRadius.length) * idx;

        if (reduce) {
          const pos = orbitPosition({ cx: CX, cy: CY, radius: b.radius, angleDeg: staticAngle });
          const px = pos.x;
          const py = CY + (pos.y - CY) * 0.38; // squish y for the inclined ellipse
          return (
            <div
              key={b.id}
              style={{ position: 'absolute', left: px - size / 2, top: py - size / 2, zIndex: 3 }}
            >
              <CelestialBody role={b.role} size={size} phaseLit={b.phaseLit} />
            </div>
          );
        }

        // Animated orbit: rotating container, then counter-rotate child so it stays upright.
        return (
          <motion.div
            key={b.id}
            style={{ position: 'absolute', left: CX, top: CY, width: 0, height: 0, zIndex: 3 }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: b.period, ease: 'linear' }}
          >
            {/* Translate to orbit position along x, then squish y for the inclined ellipse */}
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
  );
}

export default function Orbit2D(props) {
  return (
    <SpaceStage>
      <Orbit2DContent {...props} />
    </SpaceStage>
  );
}
