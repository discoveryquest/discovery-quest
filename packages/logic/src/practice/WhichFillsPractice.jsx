// Riddle Rapids — the which-cup-fills riddle (Logic Quest design spec §3.4):
// water pours from the funnel through branching pipes, but some pipes are
// plugged. The kid PREDICTS which cup gets the water by tapping it — then the
// water animates down the pipes and proves it. A wrong guess still gets the
// full animation (the payoff teaches), then the puzzle resets for another go.
// The winning cup is DERIVED by flooding the pipe graph, never authored.
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Flood the graph from segment 0, skipping blocked segs; returns
// { order: [segId…] in flow order, cup: winning cup id }.
export function flood(segs, blocked) {
  const byId = Object.fromEntries(segs.map((s) => [s.id, s]));
  const order = [];
  let cup = null;
  const queue = [segs[0].id];
  const seen = new Set(queue);
  while (queue.length) {
    const id = queue.shift();
    if (blocked.includes(id)) continue;
    const seg = byId[id];
    order.push(id);
    if (seg.cup) { cup = cup ?? seg.cup; continue; }
    for (const nx of seg.to ?? []) if (!seen.has(nx)) { seen.add(nx); queue.push(nx); }
  }
  return { order, cup };
}

export default function WhichFillsPractice({ step, disabled, onCorrect, onHint }) {
  const segs = step?.scene?.segs ?? [];
  const blocked = step?.scene?.blocked ?? [];
  const cups = step?.scene?.cups ?? []; // [{ id, x, emoji? }]
  const { order, cup: winner } = useMemo(() => flood(segs, blocked), [segs, blocked]);

  const [pouring, setPouring] = useState(false);
  const [wet, setWet] = useState([]); // seg ids the water has reached
  const [filledCup, setFilledCup] = useState(null);
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  function predict(cupId) {
    if (disabled || doneRef.current || pouring) return;
    const right = cupId === winner;
    setPouring(true);
    order.forEach((id, i) => setTimeout(() => setWet((w) => [...w, id]), 300 + i * 380));
    const total = 300 + order.length * 380 + 350;
    setTimeout(() => setFilledCup(winner), total - 250);
    setTimeout(() => {
      if (right) {
        doneRef.current = true;
        onCorrectRef.current?.();
      } else {
        onHintRef.current?.();
        setTimeout(() => { setWet([]); setFilledCup(null); setPouring(false); }, 1600);
      }
    }, total);
  }

  return (
    <div className="flex flex-col items-center gap-3" data-practice="whichFills">
      <div className="rounded-3xl border border-white/10 bg-[#101a26]/85 p-3">
        <svg viewBox="0 0 100 96" className="block h-[230px] w-auto max-w-full" role="img"
          aria-label="Water pours from a funnel through branching pipes; some pipes are plugged.">
          {/* funnel */}
          <path d="M 42 2 L 58 2 L 52 9 L 48 9 Z" fill="#94a3b8" />
          {segs.map((s) => {
            const isWet = wet.includes(s.id);
            const isBlocked = blocked.includes(s.id);
            return (
              <g key={s.id}>
                <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#3b4a5e" strokeWidth="7" strokeLinecap="round" />
                {isWet && (
                  <motion.line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    stroke="#4db3f5" strokeWidth="4.5" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.34 }} />
                )}
                {isBlocked && (
                  <circle cx={(s.x1 + s.x2) / 2} cy={(s.y1 + s.y2) / 2} r="4.5" fill="#b91c1c" stroke="#f87171" strokeWidth="1.4" />
                )}
              </g>
            );
          })}
          {/* cups */}
          {cups.map((c) => (
            <g key={c.id} role="button" data-cup={c.id} onClick={() => predict(c.id)} style={{ cursor: 'pointer', pointerEvents: 'all' }}>
              <rect x={c.x - 8} y={80} width="16" height="13" rx="2.5" fill="transparent" stroke={filledCup === c.id ? '#4db3f5' : '#cbd5e1'} strokeWidth="2" />
              {filledCup === c.id && (
                <motion.rect x={c.x - 6.6} width="13.2" rx="1.5" fill="#4db3f5"
                  initial={{ y: 91.5, height: 0 }} animate={{ y: 82.5, height: 9 }} transition={{ duration: 0.5 }} />
              )}
              <text x={c.x} y={90.5} textAnchor="middle" fontSize="7" fontWeight="900"
                fill={filledCup === c.id ? '#0b1622' : '#e2e8f0'}>{c.id.toUpperCase()}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="text-xs font-bold text-slate-500">
        {pouring ? 'Watch the water…' : 'Red plugs stop the water. Tap the cup you think fills up!'}
      </p>
    </div>
  );
}
