// Riddle Rapids — the water-measuring riddle (Logic Quest design spec §3.4):
// jugs of fixed sizes, a tap and a drain; fill, empty, and pour between jugs
// until one holds EXACTLY the target amount. Interaction is select-source →
// select-destination (tap-first). Pours follow the classic rule: a pour fills
// the destination or empties the source, whichever comes first. A built-in
// breadth-first solver knows the minimum solution length; wandering far past
// it triggers Luna's hint (and costs the star, like any hint).
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// minimal number of actions (fill/empty/pour) to get `target` in any jug
function minActions(caps, target) {
  const start = caps.map(() => 0);
  const key = (st) => st.join(',');
  const seen = new Set([key(start)]);
  let frontier = [start];
  for (let depth = 1; depth < 24; depth++) {
    const next = [];
    for (const st of frontier) {
      const succs = [];
      for (let i = 0; i < st.length; i++) {
        succs.push(st.map((v, k) => (k === i ? caps[i] : v))); // fill i
        succs.push(st.map((v, k) => (k === i ? 0 : v))); // empty i
        for (let j = 0; j < st.length; j++) {
          if (i === j) continue;
          const amount = Math.min(st[i], caps[j] - st[j]);
          succs.push(st.map((v, k) => (k === i ? v - amount : k === j ? v + amount : v)));
        }
      }
      for (const nx of succs) {
        if (nx.includes(target)) return depth;
        const k = key(nx);
        if (!seen.has(k)) { seen.add(k); next.push(nx); }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return Infinity;
}

function Jug({ cap, amt, i, selected, onTap, scale }) {
  const h = 40 + cap * scale;
  return (
    <button type="button" data-jug={i} data-amt={amt} onClick={onTap}
      className={`flex touch-manipulation flex-col items-center gap-1 ${selected ? '' : ''}`}>
      <div className={`relative w-16 overflow-hidden rounded-b-2xl rounded-t-md border-2 ${selected ? 'border-amber-300' : 'border-cyan-200/40'} bg-white/[0.04]`}
        style={{ height: h, boxShadow: selected ? '0 0 12px rgba(252,211,77,0.35)' : undefined }}>
        <motion.div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1d7fd4] to-[#4db3f5]"
          animate={{ height: (amt / cap) * (h - 4) }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }} />
        <div className="absolute inset-x-0 top-1 text-center font-mono text-sm font-extrabold text-white/90">{amt}</div>
      </div>
      <span className="text-xs font-extrabold text-slate-400">holds {cap}</span>
    </button>
  );
}

export default function PourJugsPractice({ step, disabled, onCorrect, onHint }) {
  const caps = step?.scene?.jugs ?? [3, 5];
  const target = step?.target?.amount ?? 4;
  const optimal = useMemo(() => minActions(caps, target), [caps, target]);
  const [amts, setAmts] = useState(caps.map(() => 0));
  const [src, setSrc] = useState(null); // 'tap' | jug index
  const [acts, setActs] = useState(0);
  const scale = 22;
  const doneRef = useRef(false);
  const hintedRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  function after(next) {
    setAmts(next);
    setSrc(null);
    const n = acts + 1;
    setActs(n);
    if (next.includes(target)) {
      doneRef.current = true;
      setTimeout(() => onCorrectRef.current?.(), 700);
    } else if (!hintedRef.current && n > optimal * 2 + 2) {
      hintedRef.current = true;
      onHintRef.current?.(); // gentle course-correct after lots of wandering
    }
  }

  function tapJug(i) {
    if (disabled || doneRef.current) return;
    if (src === null) return setSrc(i);
    if (src === 'tap') return after(amts.map((v, k) => (k === i ? caps[i] : v)));
    if (src === i) return setSrc(null);
    const amount = Math.min(amts[src], caps[i] - amts[i]);
    after(amts.map((v, k) => (k === src ? v - amount : k === i ? v + amount : v)));
  }

  function tapDrain() {
    if (disabled || doneRef.current || src === null || src === 'tap') return;
    after(amts.map((v, k) => (k === src ? 0 : v)));
  }

  return (
    <div className="flex flex-col items-center gap-4" data-practice="pourJugs" data-acts={acts}>
      <p className="rounded-full border border-yellow-300/30 bg-yellow-400/10 px-4 py-1 text-sm font-extrabold text-yellow-300">
        Measure exactly {target}! {src === null ? 'Tap a source…' : src === 'tap' ? 'Tap a jug to fill it!' : 'Tap another jug to pour, or the drain to empty.'}
      </p>
      <div className="flex items-end justify-center gap-5 rounded-3xl border border-white/10 bg-[#101c26]/80 px-6 py-5">
        <button type="button" data-tap onClick={() => !disabled && !doneRef.current && setSrc('tap')}
          className={`flex touch-manipulation flex-col items-center gap-1 rounded-2xl border px-3 py-2 ${src === 'tap' ? 'border-amber-300 bg-amber-400/10' : 'border-white/10 bg-white/[0.05]'}`}>
          <span className="text-3xl leading-none">🚰</span>
          <span className="text-xs font-extrabold text-slate-400">tap</span>
        </button>
        {caps.map((cap, i) => (
          <Jug key={i} cap={cap} amt={amts[i]} i={i} selected={src === i} scale={scale} onTap={() => tapJug(i)} />
        ))}
        <button type="button" data-drain onClick={tapDrain}
          className="flex touch-manipulation flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2">
          <span className="text-3xl leading-none">🕳️</span>
          <span className="text-xs font-extrabold text-slate-400">drain</span>
        </button>
      </div>
      <button type="button" onClick={() => { if (!doneRef.current) { setAmts(caps.map(() => 0)); setSrc(null); } }}
        className="h-9 touch-manipulation rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-slate-400 transition-colors hover:bg-white/10">
        ↺ Empty everything
      </button>
    </div>
  );
}
