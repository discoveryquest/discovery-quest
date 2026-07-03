// Orbit2D — solar system diagram: central body + orbiting bodies with animated revolution.
// SVG dashed orbit rings; framer-motion rotation drives each body around the center.
// Reduced-motion: static positions via orbitPosition(), no rotation animation.
// Orbit2DContent is the bare inner content (no SpaceStage) for nesting as a scrub/reveal base.
import { motion, useReducedMotion, useTime, useTransform } from 'framer-motion';
import { orbitPosition, phaseMaskShift } from '../geometry.js';
import { celestialGradient, celestialGlow } from './roles.js';
import { SpaceStage, EmojiGlobe } from './base.jsx';

// Width of the stage area for orbit placement
const W = 430;
const H = 230;
const CX = W / 2;
const CY = H / 2;

const ROLE_SIZE = { star: 52, planet: 28, moon: 14, blackhole: 36 };
const ORBIT_Y_SCALE = 0.38;

// Auto-assign orbit radii when not provided
const AUTO_RADII = [62, 88, 110];

function CelestialBody({ role = 'planet', color, size, phaseLit, style: extraStyle }) {
  const grad = celestialGradient(role, color);
  const glow = celestialGlow(role, color);
  const boxShadow = `0 0 ${size * 0.5}px ${size * 0.25}px ${glow}`;
  const phaseShift = phaseLit != null ? phaseMaskShift(phaseLit, size) : null;
  const isEarth = role === 'planet' && color === 'earth'; // Earth is always the 🌍 emoji
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: isEarth ? 'transparent' : grad,
        boxShadow,
        position: 'relative',
        overflow: 'hidden',
        ...extraStyle,
      }}
    >
      {isEarth && <EmojiGlobe size={size} />}
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

function OrbitingBody({ body, index, count }) {
  const reduce = useReducedMotion();
  const size = ROLE_SIZE[body.role] ?? 20;
  const staticAngle = (360 / count) * index;
  const time = useTime();
  // Scrub-driven: the learner's drag (not a timer) places the body on its orbit.
  // Starts at the top and sweeps a quarter turn per state (4 states = 3/4 circle),
  // spring-gliding between notches instead of free-running.
  const scrubbed = body.scrubFraction != null;
  const scrubAngle = ((body.scrubFraction ?? 0) * 270 - 90) * (Math.PI / 180);
  const x = useTransform(time, (t) => {
    const angle = ((t / 1000 / body.period) * 360 + staticAngle) * (Math.PI / 180);
    return Math.cos(angle) * body.radius;
  });
  const y = useTransform(time, (t) => {
    const angle = ((t / 1000 / body.period) * 360 + staticAngle) * (Math.PI / 180);
    return Math.sin(angle) * body.radius * ORBIT_Y_SCALE;
  });

  if (scrubbed) {
    return (
      <motion.div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          zIndex: 3,
        }}
        animate={{
          x: Math.cos(scrubAngle) * body.radius,
          y: Math.sin(scrubAngle) * body.radius * ORBIT_Y_SCALE,
        }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 70, damping: 16 }}
      >
        <CelestialBody role={body.role} color={body.color} size={size} phaseLit={body.phaseLit} />
      </motion.div>
    );
  }

  if (reduce) {
    const pos = orbitPosition({ cx: CX, cy: CY, radius: body.radius, angleDeg: staticAngle });
    const px = pos.x;
    const py = CY + (pos.y - CY) * ORBIT_Y_SCALE;
    return (
      <div
        style={{ position: 'absolute', left: px - size / 2, top: py - size / 2, zIndex: 3 }}
      >
        <CelestialBody
          role={body.role}
          color={body.color}
          size={size}
          phaseLit={body.phaseLit}
        />
      </div>
    );
  }

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: CX,
        top: CY,
        x,
        y,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex: 3,
      }}
    >
      <CelestialBody
        role={body.role}
        color={body.color}
        size={size}
        phaseLit={body.phaseLit}
      />
    </motion.div>
  );
}

// Bare content (no SpaceStage) — used standalone via Orbit2D, or nested as a scrub/reveal base.
export function Orbit2DContent({ bodies = [] }) {
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
            ry={b.radius * ORBIT_Y_SCALE}
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
          <CelestialBody role={center.role} color={center.color} size={centerSize} />
        </div>
      )}

      {/* Orbiting bodies */}
      {orbitersWithRadius.map((b, idx) => (
        <OrbitingBody key={b.id} body={b} index={idx} count={orbitersWithRadius.length} />
      ))}
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
