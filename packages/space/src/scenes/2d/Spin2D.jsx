// Spin2D — day & night on a spinning planet, seen from ABOVE THE NORTH POLE.
// The Sun shines from the left, so the planet's left half is always daytime and the
// right half always night (the terminator never moves). What DOES move is the planet:
// `fraction` (0..1, injected by a scrub base) spins the globe COUNTERCLOCKWISE —
// Earth's real direction seen from above the pole — carrying the continents and a
// "YOU" marker dawn → noon → dusk → night through the fixed light. The white polar
// cap at the centre IS the axis (it points at the viewer), so the in-plane rotation
// reads as true axial spin, not a rolling ball; that's also why the globe is drawn
// here (a from-space 🌍 emoji rotated in-plane looks like Earth tumbling sideways).
// Rendered as one responsive SVG; rotation uses native SVG rotate(deg cx cy) driven
// by a spring motion value — CSS transform-origin on SVG groups is unreliable.
import { useEffect, useState } from 'react';
import { useReducedMotion, useSpring, useMotionValueEvent } from 'framer-motion';
import { SpaceStage } from './base.jsx';

const W = 300;
const H = 160;
const SUN = { x: 34, y: 74, r: 18 };
const EARTH = { x: 192, y: 74, r: 46 };

// The marker starts at the TOP of the disc (on the terminator, about to turn into
// the light) and the globe spins counterclockwise: top=dawn → left(sun-facing)=noon
// → bottom=dusk → right(away from sun)=night. Four states span three quarter-turns.
const MARKER = { x: EARTH.x, y: EARTH.y - EARTH.r };
const FULL_SWEEP = -270; // negative = counterclockwise on screen

// Continents for the pole-down view — emoji-palette landmasses (golden coast, green
// interior) arranged in a ring around the polar cap so land keeps flowing past the
// day side at every angle of the spin. Local coords around the disc centre.
const CONTINENTS = [
  'M -14 -40 Q 2 -46 14 -38 Q 22 -30 12 -24 Q -2 -18 -14 -26 Q -22 -33 -14 -40 Z',
  'M 24 -14 Q 38 -18 42 -4 Q 44 10 32 14 Q 20 16 18 4 Q 16 -8 24 -14 Z',
  'M -6 24 Q 8 20 14 30 Q 18 40 6 43 Q -8 45 -12 36 Q -14 28 -6 24 Z',
  'M -42 -8 Q -32 -16 -24 -8 Q -18 0 -26 8 Q -36 14 -42 6 Q -46 -2 -42 -8 Z',
];
// green interiors, one patch per continent (local coords: cx, cy, rx, ry)
const GREEN = [[-1, -32, 9, 5], [30, 0, 7, 6], [1, 33, 7, 5], [-33, 0, 6, 5]];

export function Spin2DContent({ fraction = 0, markerLabel = 'YOU' }) {
  const reduce = useReducedMotion();
  const target = fraction * FULL_SWEEP;
  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const [sprung, setSprung] = useState(0);
  useEffect(() => {
    spring.set(target);
  }, [spring, target]);
  useMotionValueEvent(spring, 'change', (v) => setSprung(v));
  const deg = reduce ? target : sprung;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block"
      role="img"
      aria-label="Earth seen from above the North Pole, spinning counterclockwise through day and night; the Sun lights one side."
    >
      <defs>
        <radialGradient id="spin-sun" cx="38%" cy="38%">
          <stop offset="0%" stopColor="#fff7cf" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <radialGradient id="spin-ocean" cx="42%" cy="42%">
          <stop offset="0%" stopColor="#4aa8e8" />
          <stop offset="60%" stopColor="#1d6fc0" />
          <stop offset="100%" stopColor="#0c3f7e" />
        </radialGradient>
        <filter id="spin-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="spin-disc">
          <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} />
        </clipPath>
        <linearGradient id="spin-night" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(4,6,16,0)" />
          <stop offset="14%" stopColor="rgba(4,6,16,0.82)" />
          <stop offset="100%" stopColor="rgba(4,6,16,0.9)" />
        </linearGradient>
        <marker id="spin-arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="rgba(103,232,249,0.6)" />
        </marker>
      </defs>

      {/* Sun + light rays (fixed — sunlight never moves) */}
      <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="url(#spin-sun)" filter="url(#spin-glow)" />
      <text x={SUN.x} y={SUN.y + SUN.r + 15} textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="800">SUN</text>
      {[-22, -7, 8, 23].map((dy) => (
        <line key={dy} x1={SUN.x + SUN.r + 6} x2={EARTH.x - EARTH.r - 10}
          y1={SUN.y + dy} y2={SUN.y + dy}
          stroke="#fde68a" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
      ))}

      {/* The globe, pole-on: ocean + spinning continents + the polar cap on the axis */}
      <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="url(#spin-ocean)" />
      <g clipPath="url(#spin-disc)">
        <g transform={`rotate(${deg} ${EARTH.x} ${EARTH.y})`}>
          <g transform={`translate(${EARTH.x} ${EARTH.y})`}>
            {CONTINENTS.map((d, i) => (
              <path key={i} d={d} fill="#e8c86a" stroke="#c9a548" strokeWidth="1" />
            ))}
            {GREEN.map(([x, y, rx, ry], i) => (
              <ellipse key={`g${i}`} cx={x} cy={y} rx={rx} ry={ry} fill="#57b26a" opacity="0.7" />
            ))}
          </g>
        </g>
        {/* Fixed night side — always the half facing away from the Sun */}
        <rect x={EARTH.x - 6} y={EARTH.y - EARTH.r} width={EARTH.r + 8} height={EARTH.r * 2} fill="url(#spin-night)" />
      </g>
      {/* North-pole ice cap — the spin axis, pointing straight at the viewer */}
      <circle cx={EARTH.x} cy={EARTH.y} r={9} fill="#f4f8fc" stroke="#cfe4f5" strokeWidth="1.5" />
      <text x={EARTH.x} y={EARTH.y + 2.8} textAnchor="middle" fill="#5b7d9e" fontSize="7.5" fontWeight="900">N</text>
      <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="none" stroke="rgba(148,197,255,0.4)" strokeWidth="1.5" />

      {/* DAY / NIGHT labels on the two fixed halves */}
      <text x={EARTH.x - EARTH.r / 2 - 4} y={EARTH.y - EARTH.r - 8} textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="800" letterSpacing="0.08em">DAY</text>
      <text x={EARTH.x + EARTH.r / 2 + 4} y={EARTH.y - EARTH.r - 8} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="800" letterSpacing="0.08em">NIGHT</text>

      {/* Spin-direction hint — counterclockwise, matching the rotation */}
      <path
        d={`M ${EARTH.x - EARTH.r - 13} ${EARTH.y - 24} A ${EARTH.r + 13} ${EARTH.r + 13} 0 0 1 ${EARTH.x - EARTH.r - 13} ${EARTH.y + 24}`}
        fill="none" stroke="rgba(103,232,249,0.45)" strokeWidth="2" strokeDasharray="3 5" markerEnd="url(#spin-arrow)" />

      {/* YOU — rides the rim as the planet turns (above the night shading so it stays visible) */}
      <g transform={`rotate(${deg} ${EARTH.x} ${EARTH.y})`}>
        <circle cx={MARKER.x} cy={MARKER.y} r={6} fill="#fb7185" stroke="#fff" strokeWidth="2" filter="url(#spin-glow)" />
        {/* Counter-rotate the label about the marker point so the text stays upright.
            Drawn inward (below the dot) so it never collides with the DAY/NIGHT captions. */}
        <g transform={`rotate(${-deg} ${MARKER.x} ${MARKER.y})`}>
          <text x={MARKER.x} y={MARKER.y + 17} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="900">{markerLabel}</text>
        </g>
      </g>
    </svg>
  );
}

export default function Spin2D(props) {
  return (
    <SpaceStage>
      <Spin2DContent {...props} />
    </SpaceStage>
  );
}
