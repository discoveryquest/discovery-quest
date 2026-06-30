import { useEffect, useState } from 'react';

const DEFAULT_STARS = [
  { id: 'a', x: 24, y: 68 },
  { id: 'b', x: 42, y: 42 },
  { id: 'c', x: 62, y: 58 },
  { id: 'd', x: 78, y: 30 },
];

export default function ConnectStarsPractice({ step, onCorrect, onHint }) {
  const stars = step?.target?.stars || DEFAULT_STARS;
  const order = step?.target?.order || stars.map((s) => s.id);
  const [picked, setPicked] = useState([]);
  const done = picked.length === order.length;
  const correct = done && picked.every((id, i) => id === order[i]);

  useEffect(() => {
    if (!done) return;
    if (correct) {
      const t = setTimeout(() => onCorrect?.(), 550);
      return () => clearTimeout(t);
    }
    onHint?.(step?.feedback?.hintSay);
    const t = setTimeout(() => setPicked([]), 900);
    return () => clearTimeout(t);
  }, [done, correct]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (id) => {
    if (picked.includes(id) || done) return;
    setPicked((p) => [...p, id]);
  };

  const byId = Object.fromEntries(stars.map((s) => [s.id, s]));
  const lines = [];
  for (let i = 1; i < picked.length; i++) {
    const a = byId[picked[i - 1]];
    const b = byId[picked[i]];
    if (a && b) lines.push([a, b]);
  }

  return (
    <div className="mx-auto h-[330px] w-full max-w-[360px] overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[radial-gradient(circle_at_35%_25%,rgba(129,140,248,.22),transparent_35%),linear-gradient(180deg,#0b1026,#05060f)] shadow-2xl shadow-cyan-950/30">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {lines.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.9" />
        ))}
        {stars.map((star) => {
          const idx = picked.indexOf(star.id);
          const selected = idx >= 0;
          return (
            <g key={star.id} onClick={() => tap(star.id)} style={{ cursor: 'pointer' }} role="button" aria-label={star.label || star.id}>
              <circle cx={star.x} cy={star.y} r={selected ? 4.6 : 3.7} fill={selected ? '#67e8f9' : '#f8fafc'} stroke="#bae6fd" strokeWidth="0.8" />
              <circle cx={star.x} cy={star.y} r="8" fill="transparent" />
              {selected && <text x={star.x} y={star.y + 1.5} textAnchor="middle" fontSize="4" fontWeight="900" fill="#020617">{idx + 1}</text>}
            </g>
          );
        })}
      </svg>
      <p className="-mt-9 text-center text-xs font-bold text-slate-400">Tap the stars in order to draw the pattern.</p>
    </div>
  );
}
