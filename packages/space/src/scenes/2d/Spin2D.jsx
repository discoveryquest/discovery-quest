// Spin2D — day & night on a spinning planet. Top-down view: the Sun shines from the
// left, so the planet's left half is always daytime and the right half always night
// (the terminator never moves). What DOES move is the planet itself: `fraction` (0..1,
// injected by a scrub base) turns the globe — continents and a "YOU" marker ride the
// spin, carrying the marker dawn → noon → dusk → night through the fixed light.
// Rendered as one responsive SVG so it scales inside any stage without overflowing.
// Rotation uses native SVG rotate(deg cx cy) driven by a spring motion value —
// CSS transform-origin on SVG groups is unreliable, so we never rely on it.
import { useEffect, useState } from 'react';
import { useReducedMotion, useSpring, useMotionValueEvent } from 'framer-motion';
import { SpaceStage } from './base.jsx';

const W = 300;
const H = 160;
const SUN = { x: 34, y: 74, r: 18 };
const EARTH = { x: 192, y: 74, r: 46 };

// The marker starts at the bottom of the disc (on the terminator, about to turn into
// the light) and the globe rotates clockwise: bottom=dawn → left(sun-facing)=noon →
// top=dusk → right(away from sun)=night. Four states span three quarter-turns.
const MARKER = { x: EARTH.x, y: EARTH.y + EARTH.r };
const FULL_SWEEP = 270;

// Simple continent blobs (local coords around the earth centre) that make the spin visible.
const CONTINENTS = [
  'M -26 -19 q 12 -10 24 -3 q 9 5 2 14 q -12 8 -22 1 q -10 -5 -4 -12 Z',
  'M 5 7 q 14 -5 20 5 q 5 10 -5 15 q -14 5 -19 -5 q -3 -10 4 -15 Z',
  'M -32 10 q 8 -3 12 3 q 2 7 -7 9 q -8 0 -10 -5 q 0 -5 5 -7 Z',
];

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
      aria-label="Earth spinning through day and night; the Sun lights one side."
    >
      <defs>
        <radialGradient id="spin-sun" cx="38%" cy="38%">
          <stop offset="0%" stopColor="#fff7cf" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <radialGradient id="spin-ocean" cx="38%" cy="34%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#2779c4" />
          <stop offset="100%" stopColor="#0b2f5e" />
        </radialGradient>
        <filter id="spin-glow">
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

      {/* Ocean disc */}
      <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="url(#spin-ocean)" />

      {/* Rotating globe: continents spin with the planet */}
      <g clipPath="url(#spin-disc)">
        <g transform={`rotate(${deg} ${EARTH.x} ${EARTH.y})`}>
          <g transform={`translate(${EARTH.x} ${EARTH.y})`} fill="#3fae6a" stroke="#2b7a4b" strokeWidth="1">
            {CONTINENTS.map((d, i) => <path key={i} d={d} />)}
          </g>
        </g>
        {/* Fixed night side — always the half facing away from the Sun */}
        <rect x={EARTH.x - 6} y={EARTH.y - EARTH.r} width={EARTH.r + 8} height={EARTH.r * 2} fill="url(#spin-night)" />
      </g>
      <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="none" stroke="rgba(148,197,255,0.4)" strokeWidth="1.5" />

      {/* DAY / NIGHT labels on the two fixed halves */}
      <text x={EARTH.x - EARTH.r / 2 - 4} y={EARTH.y - EARTH.r - 8} textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="800" letterSpacing="0.08em">DAY</text>
      <text x={EARTH.x + EARTH.r / 2 + 4} y={EARTH.y - EARTH.r - 8} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="800" letterSpacing="0.08em">NIGHT</text>

      {/* Spin-direction hint */}
      <path
        d={`M ${EARTH.x - EARTH.r - 13} ${EARTH.y + 24} A ${EARTH.r + 13} ${EARTH.r + 13} 0 0 0 ${EARTH.x - EARTH.r - 13} ${EARTH.y - 24}`}
        fill="none" stroke="rgba(103,232,249,0.45)" strokeWidth="2" strokeDasharray="3 5" markerEnd="url(#spin-arrow)" />

      {/* YOU — rides the rim as the planet turns (above the night shading so it stays visible) */}
      <g transform={`rotate(${deg} ${EARTH.x} ${EARTH.y})`}>
        <circle cx={MARKER.x} cy={MARKER.y} r={6} fill="#fb7185" stroke="#fff" strokeWidth="2" filter="url(#spin-glow)" />
        {/* Counter-rotate the label about the marker point so the text stays upright */}
        <g transform={`rotate(${-deg} ${MARKER.x} ${MARKER.y})`}>
          <text x={MARKER.x} y={MARKER.y + 19} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="900">{markerLabel}</text>
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
