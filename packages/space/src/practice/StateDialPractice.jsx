import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const reduce = useReducedMotion();
  const states = step?.target?.states || DEFAULT_STATES;
  const targetId = step?.target?.state || states[0]?.id;
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const current = states[index] || states[0];
  const close = current?.id === targetId;
  const kind = step?.kind;

  useEffect(() => {
    if (!close || done) return;
    setDone(true);
    const t = setTimeout(() => onCorrect?.(), 500);
    return () => clearTimeout(t);
  }, [close, done, onCorrect]);

  const angle = states.length > 1 ? (index / states.length) * 360 - 90 : -90;
  const rad = (angle * Math.PI) / 180;
  const px = 50 + Math.cos(rad) * 32;
  const py = 50 + Math.sin(rad) * 32;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[300px] w-full max-w-[340px] overflow-hidden rounded-[28px] border border-cyan-300/15 bg-slate-950/40 shadow-2xl shadow-cyan-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(167,139,250,0.16),transparent_40%)]" />

        {kind === 'orbit-season' ? (
          <>
            <div className="absolute left-[18%] top-1/2 -translate-y-1/2 text-5xl drop-shadow-[0_0_18px_rgba(250,204,21,0.7)]">☀️</div>
            <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/20 border-dashed" />
            <motion.div
              className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 shadow-[0_0_24px_rgba(56,189,248,0.65)]"
              style={{ left: `${px}%`, top: `${py}%` }}
              animate={reduce ? false : { rotate: [-12, 12, -12] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            >
              <span className="text-3xl">🌍</span>
              <span className="absolute -right-1 -top-2 rotate-[23.5deg] text-cyan-100">|</span>
            </motion.div>
          </>
        ) : (
          <>
            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-5xl drop-shadow-[0_0_18px_rgba(250,204,21,0.7)]">☀️</div>
            <motion.div
              className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_0_28px_rgba(56,189,248,0.55)]"
              style={{ background: 'linear-gradient(90deg,#38bdf8 0 50%,#06111f 50% 100%)' }}
              animate={reduce ? false : { rotate: index * 90 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              <span className="text-5xl">🌍</span>
            </motion.div>
          </>
        )}

        <div className="absolute bottom-4 left-0 right-0 text-center">
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
