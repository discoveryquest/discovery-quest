// Shape Shore — count-the-shapes puzzles (Logic Quest design spec §3.2), in a
// chalk-on-slate style. Two modes:
//   choose — the kid counts in their head and picks a number; the payoff
//            animation then proves it by tinting every shape one-by-one.
//   claim  — the kid taps a shape's corners (3 for triangles) to claim it;
//            valid claims tint and stay, until all are found.
// The answer key is DERIVED from the figure by shapeGeometry (never authored),
// so alternate readings and author slips can't produce a wrong key.
import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findShapes } from './shapeGeometry.js';

const TINTS = ['#f59e0b', '#22d3ee', '#4ade80', '#f472b6', '#a78bfa', '#fb7185', '#fde047', '#34d399', '#60a5fa', '#f97316'];
const CHALK = '#e8e6df';

const keyOf = (ids) => [...ids].sort((a, b) => a - b).join('-');

export default function ShapeCountPractice({ step, disabled, onCorrect, onHint }) {
  const { vertices, edges, find = 'triangles' } = step?.scene ?? {};
  const mode = step?.target?.mode ?? 'choose';
  const shapes = useMemo(() => findShapes(vertices, edges, find), [vertices, edges, find]);
  const count = shapes.length;
  const clawSize = find === 'triangles' ? 3 : 4;

  const [picked, setPicked] = useState([]); // claim: selected vertex ids
  const [found, setFound] = useState([]); // claim: claimed shape keys / choose: payoff reveals
  const [reveal, setReveal] = useState(-1); // choose payoff progress
  const [shake, setShake] = useState(0);
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  // stable, non-revealing choice row: count + 3 nearby distractors, deterministic order
  const choices = useMemo(() => {
    const opts = [count, count + 1, Math.max(1, count - 1), count + 2];
    const uniq = [...new Set(opts)];
    while (uniq.length < 4) uniq.push(uniq[uniq.length - 1] + 1);
    return uniq.sort((a, b) => ((a * 7) % 5) - ((b * 7) % 5) || a - b);
  }, [count]);

  // viewBox from figure bounds (+padding), coords scaled ×10
  const view = useMemo(() => {
    const xs = vertices.map((p) => p[0] * 10);
    const ys = vertices.map((p) => p[1] * 10);
    const pad = 18;
    const x0 = Math.min(...xs) - pad;
    const y0 = Math.min(...ys) - pad;
    return { x0, y0, w: Math.max(...xs) - x0 + pad, h: Math.max(...ys) - y0 + pad };
  }, [vertices]);
  const P = (i) => ({ x: vertices[i][0] * 10, y: vertices[i][1] * 10 });

  function choose(n) {
    if (disabled || doneRef.current || reveal >= 0) return;
    if (n !== count) {
      setShake((c) => c + 1);
      onHintRef.current?.();
      return;
    }
    // the payoff: tint every shape one-by-one, then finish
    doneRef.current = true;
    shapes.forEach((_, i) => setTimeout(() => setReveal(i), 350 + i * 520));
    setTimeout(() => onCorrectRef.current?.(), 350 + shapes.length * 520 + 700);
  }

  function tapVertex(vi) {
    if (disabled || doneRef.current || mode !== 'claim') return;
    if (picked.includes(vi)) return setPicked(picked.filter((v) => v !== vi));
    const next = [...picked, vi];
    if (next.length < clawSize) return setPicked(next);
    const k = keyOf(next);
    const hit = shapes.some((s) => keyOf(s) === k);
    if (hit && !found.includes(k)) {
      const nf = [...found, k];
      setFound(nf);
      setPicked([]);
      if (nf.length === count) {
        doneRef.current = true;
        setTimeout(() => onCorrectRef.current?.(), 700);
      }
    } else {
      setShake((c) => c + 1);
      setPicked([]);
      onHintRef.current?.(); // already-found repeats count as flaws too — keeps claims deliberate
    }
  }

  const foundIdx = shapes.map((s, i) => (found.includes(keyOf(s)) ? i : -1)).filter((i) => i >= 0);
  const litShapes = mode === 'claim' ? foundIdx : shapes.map((_, i) => i).filter((i) => i <= reveal);

  return (
    <motion.div
      key={shake}
      animate={shake ? { x: [0, -9, 9, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.38 }}
      className="flex flex-col items-center gap-3"
      data-practice="shapeCount"
      data-count={count}
    >
      {mode === 'claim' && (
        <p className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-1 text-sm font-extrabold text-cyan-200" data-found={found.length}>
          Found {found.length} of {count} — tap {clawSize} corners to claim one!
        </p>
      )}

      <div className="rounded-3xl border border-white/10 bg-[#20242c] px-5 py-4 shadow-2xl" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 60%)' }}>
        <svg viewBox={`${view.x0} ${view.y0} ${view.w} ${view.h}`} className="block h-[190px] w-auto max-w-full sm:h-[230px]" role="img"
          aria-label={`A figure made of chalk lines — count the ${find}.`}>
          {/* claimed / revealed shapes tint beneath the chalk lines */}
          <AnimatePresence>
            {litShapes.map((i) => (
              <motion.polygon key={i}
                points={shapes[i].map((vi) => `${P(vi).x},${P(vi).y}`).join(' ')}
                fill={TINTS[i % TINTS.length]}
                initial={{ opacity: 0 }} animate={{ opacity: 0.42 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }} />
            ))}
          </AnimatePresence>
          {edges.map(([a, b], i) => (
            <line key={i} x1={P(a).x} y1={P(a).y} x2={P(b).x} y2={P(b).y}
              stroke={CHALK} strokeWidth="2.6" strokeLinecap="round" opacity="0.92" />
          ))}
          {mode === 'claim' && vertices.map((_, vi) => (
            <g key={vi} role="button" data-vertex={vi} onClick={() => tapVertex(vi)} style={{ cursor: 'pointer' }}>
              <circle cx={P(vi).x} cy={P(vi).y} r="13" fill="transparent" />
              <motion.circle cx={P(vi).x} cy={P(vi).y} r={picked.includes(vi) ? 7 : 4.5}
                fill={picked.includes(vi) ? '#fbbf24' : CHALK}
                animate={picked.includes(vi) ? { scale: [1, 1.25, 1] } : {}}
                style={picked.includes(vi) ? { filter: 'drop-shadow(0 0 5px #fbbf24)' } : undefined} />
            </g>
          ))}
          {/* payoff counter */}
          {mode === 'choose' && reveal >= 0 && (
            <text x={view.x0 + view.w - 6} y={view.y0 + 16} textAnchor="end" fill="#fde047" fontSize="15" fontWeight="900">
              {Math.min(reveal + 1, count)} ✓
            </text>
          )}
        </svg>
      </div>

      {mode === 'choose' && (
        <div className="flex items-center gap-2.5">
          {choices.map((n) => (
            <button key={n} type="button" data-choice={n} onClick={() => choose(n)}
              className="h-12 w-14 touch-manipulation rounded-2xl border border-white/12 bg-white/5 font-mono text-xl font-extrabold text-slate-200 transition-colors hover:bg-white/10 active:scale-95">
              {n}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
