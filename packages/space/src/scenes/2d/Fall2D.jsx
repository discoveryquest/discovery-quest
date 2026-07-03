// Fall2D — gravity comparison: the same ball dropped on different worlds, side by
// side. All balls release together and fall with their world's surface gravity
// (t = √(2h/g)), so Jupiter's slams down while the Moon's floats — the speed
// difference IS the lesson. Loops forever; reduced-motion shows the balls resting.
// Designed to sit under a `reveal` beat's hotspots (tap a world → its fact line).
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { SpaceStage, SvgEmoji } from './base.jsx';

const W = 300;
const H = 170;
const TOP = 22; // ball release height
const GROUND = 106; // ball centre when resting on the world
const DROP = GROUND - TOP;
const CYCLE_MS = 4600; // release → slowest (Moon) lands → a beat of rest → again
const EARTH_FALL_MS = 1500; // how long the g=1 ball takes; others scale by 1/√g

const DEFAULT_ITEMS = [
  { label: 'Jupiter', emoji: '🪐', g: 2.5 },
  { label: 'Earth', emoji: '🌍', g: 1 },
  { label: 'Moon', emoji: '🌙', g: 0.17 },
];

function gLabel(g) {
  if (g === 1) return '1× Earth pull';
  if (g < 1) return `${(g === 0.17 ? '⅙' : g.toFixed(2))} of Earth's pull`;
  return `${g}× Earth's pull`;
}

export function Fall2DContent({ items = DEFAULT_ITEMS }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(0);
  const startRef = useRef(null);
  useEffect(() => {
    if (reduce) return undefined;
    let raf;
    const tick = (t) => {
      startRef.current ??= t;
      setNow(t - startRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const t = now % CYCLE_MS;
  const colW = W / items.length;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block"
      role="img" aria-label="Balls dropped at the same moment fall fastest on the strongest-gravity world.">
      {items.map((item, i) => {
        const cx = colW * i + colW / 2;
        // y(t) = TOP + ½·a·t² scaled so a g=1 world lands in EARTH_FALL_MS.
        const fallMs = EARTH_FALL_MS / Math.sqrt(item.g || 1);
        const p = reduce ? 1 : Math.min(1, t / fallMs);
        const y = TOP + DROP * p * p;
        return (
          <g key={item.label}>
            {/* drop guide */}
            <line x1={cx} y1={TOP - 6} x2={cx} y2={GROUND + 4} stroke="rgba(148,163,184,0.18)" strokeWidth="1.5" strokeDasharray="2 5" />
            {/* the falling ball */}
            <circle cx={cx} cy={y} r={7} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
            {p >= 1 && <ellipse cx={cx} cy={GROUND + 8} rx={10} ry={2.5} fill="rgba(248,250,252,0.25)" />}
            {/* the world as the ground */}
            <SvgEmoji x={cx} y={GROUND + 24} r={14} emoji={item.emoji} />
            <text x={cx} y={GROUND + 48} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="800">{item.label}</text>
            <text x={cx} y={GROUND + 60} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700">{gLabel(item.g)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Fall2D(props) {
  return (
    <SpaceStage>
      <Fall2DContent {...props} />
    </SpaceStage>
  );
}
