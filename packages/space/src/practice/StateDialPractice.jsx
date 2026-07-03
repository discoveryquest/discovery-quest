// StateDialPractice — slider-driven state practice for two World-1 stations, sharing
// the lesson visuals so practice looks like what was just taught:
//   earth-spin    → Spin2DContent (fixed sunlight, rotating globe, YOU marker): "your
//                   town" is the marker, so "spin until your town has noon" is readable.
//   orbit-season  → SeasonOrbit: Sun at centre, Earth placed on its orbit by the slider
//                   with a FIXED 23.5° axis (N label) — summer is where the northern
//                   half leans toward the Sun, matching the lesson's state positions
//                   (spring top, summer right, autumn bottom, winter left).
import { useEffect, useRef, useState } from 'react';
import { Spin2DContent } from '../scenes/2d/Spin2D.jsx';
import { SeasonOrbit2DContent } from '../scenes/2d/SeasonOrbit2D.jsx';

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
          {kind === 'orbit-season' ? <SeasonOrbit2DContent fraction={fraction} /> : <Spin2DContent fraction={fraction} />}
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
