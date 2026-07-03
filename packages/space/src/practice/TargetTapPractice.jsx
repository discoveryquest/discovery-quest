import { useState } from 'react';
import { motion } from 'framer-motion';

const DEFAULT_ITEMS = [
  { id: 'core', label: 'Core', emoji: '🔥', x: 50, y: 50 },
  { id: 'surface', label: 'Surface', emoji: '☀️', x: 34, y: 36 },
  { id: 'rays', label: 'Rays', emoji: '✨', x: 72, y: 40 },
];

function backgroundFor(kind) {
  if (kind === 'compare-strength') return 'radial-gradient(circle at 50% 35%, rgba(34,211,238,.16), transparent 42%), linear-gradient(180deg,#0b1026,#05060f)';
  return 'radial-gradient(circle at 50% 45%, rgba(250,204,21,.22), transparent 34%), radial-gradient(circle at 30% 80%, rgba(34,211,238,.14), transparent 38%), linear-gradient(180deg,#0b1026,#05060f)';
}

export default function TargetTapPractice({ step, onCorrect, onHint }) {
  const [picked, setPicked] = useState(null);
  const items = step?.target?.items || DEFAULT_ITEMS;
  const targetId = step?.target?.id || step?.target?.hotspot || items[0]?.id;
  const kind = step?.kind;
  // The big glowing Sun backdrop only belongs to missions ABOUT the Sun — for
  // "Saturn's rings" or "asteroid belt" it was a nonsense centrepiece.
  const aboutSun = items.some((i) => ['core', 'rays', 'surface'].includes(i.id));

  const tap = (item) => {
    if (picked === targetId) return;
    setPicked(item.id);
    if (item.id === targetId) setTimeout(() => onCorrect?.(), 450);
    else onHint?.(step?.feedback?.hintSay);
  };

  return (
    <div className="relative mx-auto h-[330px] w-full max-w-[360px] overflow-hidden rounded-[28px] border border-cyan-300/15 shadow-2xl shadow-cyan-950/30" style={{ background: backgroundFor(kind) }}>
      {kind === 'compare-strength' ? (
        <div className="absolute inset-0 flex items-end justify-center gap-5 px-5 pb-16">
          {items.map((item) => {
            const size = item.size || 70;
            // Only the tapped item shows its state — never reveal the answer on a miss.
            const state = picked === item.id ? (item.id === targetId ? 'correct' : 'wrong') : 'idle';
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => tap(item)}
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-2 rounded-2xl border px-3 py-2 text-center font-extrabold"
                style={{ borderColor: state === 'correct' ? '#34d399' : state === 'wrong' ? '#fb7185' : 'rgba(255,255,255,.14)', background: 'rgba(2,6,23,.55)' }}
              >
                <span className="flex items-center justify-center rounded-full shadow-[0_0_22px_rgba(34,211,238,.35)]" style={{ width: size, height: size, fontSize: Math.min(48, size * 0.58) }}>{item.emoji}</span>
                <span className="text-sm text-white">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <>
          {aboutSun && (
            <>
              {/* Rays streaming outward so a "rays" hotspot has something to sit on */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {[[64, 30], [72, 42], [74, 56]].map(([x, y], i) => (
                  <line key={i} x1="52" y1="48" x2={x} y2={y} stroke="#fde68a" strokeOpacity="0.5" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="2 2" />
                ))}
              </svg>
              <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-300 text-6xl shadow-[0_0_42px_rgba(250,204,21,.7)]">☀️</div>
            </>
          )}
          {items.map((item) => {
            // Only the tapped item shows its state — never reveal the answer on a miss.
            const state = picked === item.id ? (item.id === targetId ? 'correct' : 'wrong') : 'idle';
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => tap(item)}
                whileTap={{ scale: 0.9 }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border px-3 py-2 text-xs font-extrabold text-white"
                style={{ left: `${item.x ?? 50}%`, top: `${item.y ?? 50}%`, borderColor: state === 'correct' ? '#34d399' : state === 'wrong' ? '#fb7185' : 'rgba(255,255,255,.22)', background: 'rgba(2,6,23,.68)' }}
              >
                <span className={aboutSun ? 'text-2xl' : 'text-4xl'}>{item.emoji}</span>
                {item.label}
              </motion.button>
            );
          })}
        </>
      )}
    </div>
  );
}
