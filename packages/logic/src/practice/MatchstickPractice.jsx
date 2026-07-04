// Matchstick puzzles — the Logic Quest flagship (design spec §3.1): numbers as
// seven-segment matchstick layouts; the learner moves matches to fix a digit,
// mend an equation, or build the biggest number. Tap-first (tap a match to
// lift it — empty slots appear — tap a slot to place), so it works the same on
// phone and desktop. Every VALID solution counts: `digits` goals check an
// accept list, `equation` goals accept ANY true equation, and `largest` goals
// compare against a breadth-first search over every reachable state, so
// alternate solutions can never be marked wrong.
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

// ── seven-segment world ─────────────────────────────────────────────────────
const SEGS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const BIT = Object.fromEntries(SEGS.map((s, i) => [s, 1 << i]));
const DIGIT_MASK = {
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg',
  5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};
const maskOf = (str) => [...str].reduce((m, s) => m | BIT[s], 0);
const DIGITS = Object.fromEntries(Object.entries(DIGIT_MASK).map(([d, s]) => [d, maskOf(s)]));
const MASK_TO_DIGIT = Object.fromEntries(Object.entries(DIGITS).map(([d, m]) => [m, d]));

const parseStart = (start) =>
  [...start].map((ch) =>
    ch >= '0' && ch <= '9' ? { type: 'digit', mask: DIGITS[ch] } : { type: 'op', ch });

const decode = (cells) => {
  let out = '';
  for (const c of cells) {
    if (c.type === 'op') out += c.ch;
    else {
      const d = MASK_TO_DIGIT[c.mask];
      if (d == null) return null;
      out += d;
    }
  }
  return out;
};

// "6+0=9" → true/false; groups digit runs into numbers, evaluates + and -.
function isTrueEquation(str) {
  if (!str || !str.includes('=')) return false;
  const [lhs, rhs] = str.split('=');
  if (!lhs || !rhs || !/^\d+$/.test(rhs)) return false;
  const toks = lhs.match(/\d+|[+-]/g);
  if (!toks || !/^\d+$/.test(toks[0])) return false;
  let val = Number(toks[0]);
  for (let i = 1; i < toks.length; i += 2) {
    if (!/^\d+$/.test(toks[i + 1] ?? '')) return false;
    val = toks[i] === '+' ? val + Number(toks[i + 1]) : val - Number(toks[i + 1]);
  }
  return val === Number(rhs);
}

// All digit-mask states reachable in ≤ maxMoves single-stick moves (a stick may
// return to its own slot, so every shallower depth stays reachable). Tiny space:
// ≤3 digit cells × 7 bits. Used to score `largest` fairly.
function reachable(cells, maxMoves) {
  const digitsIdx = cells.map((c, i) => (c.type === 'digit' ? i : -1)).filter((i) => i >= 0);
  const key = (st) => st.join(',');
  let frontier = [digitsIdx.map((i) => cells[i].mask)];
  const seen = new Set([key(frontier[0])]);
  const out = [frontier[0]];
  for (let mv = 0; mv < maxMoves; mv++) {
    const next = [];
    for (const st of frontier) {
      for (let s = 0; s < st.length; s++) for (const sb of SEGS) {
        if (!(st[s] & BIT[sb])) continue;
        for (let t = 0; t < st.length; t++) for (const tb of SEGS) {
          if (s === t && sb === tb) { // pick up and put back — allowed, wastes the move
            const cp = [...st];
            if (!seen.has(key(cp))) { seen.add(key(cp)); next.push(cp); out.push(cp); }
            continue;
          }
          if (st[t] & BIT[tb]) continue;
          const cp = [...st];
          cp[s] &= ~BIT[sb];
          cp[t] |= BIT[tb];
          const k = key(cp);
          if (!seen.has(k)) { seen.add(k); next.push(cp); out.push(cp); }
        }
      }
    }
    frontier = next;
  }
  return { states: out, digitsIdx };
}

function largestReachable(cells, maxMoves) {
  const { states, digitsIdx } = reachable(cells, maxMoves);
  let best = -Infinity;
  for (const st of states) {
    const cp = cells.map((c) => ({ ...c }));
    digitsIdx.forEach((ci, k) => { cp[ci].mask = st[k]; });
    const str = decode(cp);
    if (str != null && /^\d+$/.test(str)) best = Math.max(best, Number(str));
  }
  return best;
}

// ── rendering ───────────────────────────────────────────────────────────────
// Digit cell viewBox 100×180; segments as matchsticks (amber body, red head).
const SEG_GEOM = {
  a: { x1: 22, y1: 12, x2: 78, y2: 12 },
  b: { x1: 88, y1: 22, x2: 88, y2: 78 },
  c: { x1: 88, y1: 102, x2: 88, y2: 158 },
  d: { x1: 22, y1: 168, x2: 78, y2: 168 },
  e: { x1: 12, y1: 102, x2: 12, y2: 158 },
  f: { x1: 12, y1: 22, x2: 12, y2: 78 },
  g: { x1: 22, y1: 90, x2: 78, y2: 90 },
};

function Stick({ geom, state, onTap, held, qa }) {
  // state: 'filled' | 'empty'; held: this exact stick is picked up
  const mid = { x: (geom.x1 + geom.x2) / 2, y: (geom.y1 + geom.y2) / 2 };
  return (
    <g
      role="button"
      data-stick={qa}
      onClick={onTap}
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      opacity={state === 'empty' ? 1 : undefined}
    >
      {/* fat invisible hit area (≥44px feel at rendered size) */}
      <line x1={geom.x1} y1={geom.y1} x2={geom.x2} y2={geom.y2} stroke="transparent" strokeWidth="26" strokeLinecap="round" />
      {state === 'filled' ? (
        <motion.g animate={held ? { y: -5, scale: 1.04 } : { y: 0, scale: 1 }} style={{ transformOrigin: `${mid.x}px ${mid.y}px` }}>
          <line x1={geom.x1} y1={geom.y1} x2={geom.x2} y2={geom.y2}
            stroke={held ? '#fde68a' : '#f2c14e'} strokeWidth="11" strokeLinecap="round"
            style={held ? { filter: 'drop-shadow(0 0 6px #fde68a)' } : undefined} />
          <circle cx={geom.x1} cy={geom.y1} r="7.5" fill="#e25e4e" />
        </motion.g>
      ) : (
        <line x1={geom.x1} y1={geom.y1} x2={geom.x2} y2={geom.y2}
          stroke="#67e8f9" strokeOpacity="0.5" strokeWidth="9" strokeLinecap="round" strokeDasharray="4 7" />
      )}
    </g>
  );
}

function OpGlyph({ ch }) {
  const s = { stroke: '#8b95ad', strokeWidth: 10, strokeLinecap: 'round' };
  if (ch === '+') return <g><line x1="20" y1="90" x2="80" y2="90" {...s} /><line x1="50" y1="60" x2="50" y2="120" {...s} /></g>;
  if (ch === '-') return <line x1="20" y1="90" x2="80" y2="90" {...s} />;
  return <g><line x1="20" y1="74" x2="80" y2="74" {...s} /><line x1="20" y1="106" x2="80" y2="106" {...s} /></g>; // '='
}

export default function MatchstickPractice({ step, disabled, onCorrect, onHint }) {
  const start = step?.scene?.start ?? '8';
  const maxMoves = step?.scene?.moves ?? 1;
  const goal = step?.target?.goal ?? 'digits';
  const initial = useMemo(() => parseStart(start), [start]);
  const best = useMemo(() => (goal === 'largest' ? largestReachable(initial, maxMoves) : null), [initial, maxMoves, goal]);

  const [cells, setCells] = useState(() => initial.map((c) => ({ ...c })));
  const [held, setHeld] = useState(null); // { ci, seg }
  const [used, setUsed] = useState(0);
  const [shake, setShake] = useState(0);
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const reset = () => { setCells(initial.map((c) => ({ ...c }))); setHeld(null); setUsed(0); };

  function evaluate(nextCells) {
    const str = decode(nextCells);
    let ok = false;
    if (str != null) {
      if (goal === 'digits') ok = (step.target.accept ?? []).includes(str);
      else if (goal === 'equation') ok = isTrueEquation(str);
      else if (goal === 'largest') ok = /^\d+$/.test(str) && Number(str) === best;
    }
    if (ok) {
      doneRef.current = true;
      onCorrectRef.current?.();
    } else {
      setShake((c) => c + 1);
      onHintRef.current?.();
      setTimeout(reset, 1100); // put the matches back for another try
    }
  }

  function tapStick(ci, seg, filled) {
    if (disabled || doneRef.current) return;
    if (filled) {
      setHeld(held && held.ci === ci && held.seg === seg ? null : { ci, seg });
      return;
    }
    if (!held) return;
    // place the held match into this empty slot
    const next = cells.map((c) => ({ ...c }));
    next[held.ci].mask &= ~BIT[held.seg];
    next[ci].mask |= BIT[seg];
    const nUsed = used + 1;
    setCells(next);
    setHeld(null);
    setUsed(nUsed);
    if (nUsed >= maxMoves) evaluate(next);
  }

  const movesLeft = maxMoves - used;

  return (
    <motion.div
      key={shake}
      animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-3"
      data-practice="matchstick"
    >
      <div className="flex items-center gap-2 text-sm font-extrabold text-amber-300" data-moves-left={movesLeft}>
        {Array.from({ length: maxMoves }, (_, i) => (
          <span key={i} className={i < movesLeft ? '' : 'opacity-25'}>🔥</span>
        ))}
        <span className="text-amber-200/80">{movesLeft} move{movesLeft === 1 ? '' : 's'} left</span>
      </div>

      <div className="rounded-3xl border border-amber-300/15 bg-[#1a1410]/80 px-4 py-3 shadow-2xl">
        <svg
          viewBox={`0 0 ${cells.length * 100} 180`}
          className="block h-[150px] w-auto max-w-full sm:h-[180px]"
          role="img"
          aria-label={`Matchstick puzzle: ${start}`}
        >
          {cells.map((cell, ci) => (
            <g key={ci} transform={`translate(${ci * 100} 0)`}>
              {cell.type === 'op' ? (
                <OpGlyph ch={cell.ch} />
              ) : (
                SEGS.map((seg) => {
                  const filled = !!(cell.mask & BIT[seg]);
                  const isHeld = held && held.ci === ci && held.seg === seg;
                  if (!filled && !held) return null; // empty slots appear once a match is lifted
                  if (!filled && held && held.ci === ci && held.seg === seg) return null;
                  return (
                    <Stick key={seg} geom={SEG_GEOM[seg]} state={filled ? 'filled' : 'empty'} qa={`${ci}:${seg}:${filled ? 1 : 0}`}
                      held={isHeld} onTap={() => tapStick(ci, seg, filled)} />
                  );
                })
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs font-bold text-slate-500">
          {held ? 'Now tap a glowing slot to place it!' : 'Tap a match to pick it up.'}
        </p>
        <button type="button" onClick={() => { if (!doneRef.current) reset(); }}
          className="flex h-9 touch-manipulation items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-slate-400 transition-colors hover:bg-white/10"
          data-reset>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </motion.div>
  );
}
