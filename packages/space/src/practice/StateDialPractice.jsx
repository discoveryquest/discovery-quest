// StateDialPractice — slider-driven state practice for two World-1 stations, sharing
// the lesson visuals so practice looks like what was just taught:
//   earth-spin    → Spin2DContent (fixed sunlight, rotating globe, YOU marker): "your
//                   town" is the marker, so "spin until your town has noon" is readable.
//   orbit-season  → SeasonOrbit: Sun at centre, Earth placed on its orbit by the slider
//                   with a FIXED 23.5° axis (N label) — summer is where the northern
//                   half leans toward the Sun, matching the lesson's state positions
//                   (spring top, summer right, autumn bottom, winter left).
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion, useSpring, useMotionValueEvent } from 'framer-motion';
import { Spin2DContent } from '../scenes/2d/Spin2D.jsx';

const DEFAULT_STATES = [
  { id: 'dawn', label: 'Dawn' },
  { id: 'noon', label: 'Noon' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
];

function clampIndex(n, len) {
  return Math.max(0, Math.min(len - 1, Math.round(n)));
}

function iconFor(kind, id) {
  if (kind === 'orbit-season') return { spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️' }[id] || '🌍';
  return { dawn: '🌅', noon: '☀️', dusk: '🌇', night: '🌙' }[id] || '🌍';
}

// Season orbit diagram (responsive SVG). Earth's axis keeps the same fixed lean the
// whole year — that's the entire point of seasons — so the axis is drawn leaning
// LEFT (N pole up-left): on the right of the Sun the north half faces the Sun
// (summer), on the left it faces away (winter).
const SO = { w: 300, h: 170, cx: 150, cy: 85, rx: 96, ry: 50, er: 15, tilt: -23.5 };

function SeasonOrbit({ fraction }) {
  const reduce = useReducedMotion();
  const target = -90 + fraction * 270; // spring top → summer right → autumn bottom → winter left
  const spring = useSpring(-90, { stiffness: 70, damping: 16 });
  const [sprung, setSprung] = useState(-90);
  useEffect(() => {
    spring.set(target);
  }, [spring, target]);
  useMotionValueEvent(spring, 'change', (v) => setSprung(v));
  const deg = reduce ? target : sprung;
  const rad = (deg * Math.PI) / 180;
  const ex = SO.cx + Math.cos(rad) * SO.rx;
  const ey = SO.cy + Math.sin(rad) * SO.ry;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${SO.w} ${SO.h}`} preserveAspectRatio="xMidYMid meet" className="block"
      role="img" aria-label="Earth on its orbit around the Sun; its tilted axis always leans the same way.">
      <defs>
        <radialGradient id="season-sun" cx="38%" cy="38%">
          <stop offset="0%" stopColor="#fff7cf" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <radialGradient id="season-earth" cx="38%" cy="34%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#2779c4" />
          <stop offset="100%" stopColor="#0b2f5e" />
        </radialGradient>
        <filter id="season-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx={SO.cx} cy={SO.cy} rx={SO.rx} ry={SO.ry} fill="none" stroke="#67e8f9" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 6" />
      <circle cx={SO.cx} cy={SO.cy} r={19} fill="url(#season-sun)" filter="url(#season-glow)" />
      <text x={SO.cx} y={SO.cy + 34} textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="800">SUN</text>
      {/* Earth + its never-changing tilted axis */}
      <g transform={`translate(${ex.toFixed(1)} ${ey.toFixed(1)})`}>
        <g transform={`rotate(${SO.tilt})`}>
          <line x1="0" y1={-SO.er - 8} x2="0" y2={SO.er + 8} stroke="#e2e8f0" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
          <circle cx="0" cy="0" r={SO.er} fill="url(#season-earth)" filter="url(#season-glow)" />
          <text x="0" y={-SO.er - 11} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="900">N</text>
        </g>
      </g>
    </svg>
  );
}

export default function StateDialPractice({ step, onCorrect }) {
  const states = step?.target?.states || DEFAULT_STATES;
  const targetId = step?.target?.state || states[0]?.id;
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const current = states[index] || states[0];
  const close = current?.id === targetId;
  const kind = step?.kind;
  const fraction = states.length > 1 ? index / (states.length - 1) : 0;

  // Latest onCorrect without making it an effect dep: the parent recreates it on
  // every render (Luna's talking flips re-render PracticeScreen), and as a dep the
  // effect cleanup would cancel the pending timer — the mission would never advance.
  const onCorrectRef = useRef(onCorrect);
  onCorrectRef.current = onCorrect;
  useEffect(() => {
    if (!close || doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    const t = setTimeout(() => onCorrectRef.current?.(), 500);
    return () => clearTimeout(t);
  }, [close]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[340px] overflow-hidden rounded-[28px] border border-cyan-300/15 bg-slate-950/40 shadow-2xl shadow-cyan-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.10),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(167,139,250,0.12),transparent_40%)]" />

        <div className="relative h-[200px] w-full pt-2">
          {kind === 'orbit-season' ? <SeasonOrbit fraction={fraction} /> : <Spin2DContent fraction={fraction} />}
        </div>

        <div className="relative pb-3 text-center">
          <p className="text-lg font-extrabold text-white">{iconFor(kind, current?.id)} {current?.label}</p>
          <p className="text-xs font-bold text-slate-400">Target: {states.find((s) => s.id === targetId)?.label || targetId}</p>
        </div>
      </div>

      <div className="w-full max-w-[340px]">
        <input
          type="range"
          min={0}
          max={states.length - 1}
          step={1}
          value={index}
          disabled={done}
          onChange={(e) => setIndex(clampIndex(Number(e.target.value), states.length))}
          className="w-full accent-cyan-300"
          aria-label="Move through choices"
        />
        <div className="mt-1 flex justify-between gap-1 text-[10px] font-bold text-slate-500">
          {states.map((s, i) => <span key={s.id} className={i === index ? 'text-cyan-200' : ''}>{s.label}</span>)}
        </div>
      </div>
    </div>
  );
}
