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

function Stick({ geom, state, onPointerDown, held, over, ghosted, qa }) {
  // state: 'filled' | 'empty'; held: this exact stick is picked up;
  // over: an empty slot the dragged match is hovering (glows green);
  // ghosted: the source match while it's being dragged (dimmed, ghost follows finger).
  const mid = { x: (geom.x1 + geom.x2) / 2, y: (geom.y1 + geom.y2) / 2 };
  return (
    <g
      role="button"
      data-stick={qa}
      onPointerDown={onPointerDown}
      style={{ cursor: state === 'filled' ? 'grab' : 'pointer', pointerEvents: 'all', touchAction: 'none' }}
      opacity={state === 'empty' ? 1 : undefined}
    >
      {/* fat invisible hit area (≥44px feel at rendered size) */}
      <line x1={geom.x1} y1={geom.y1} x2={geom.x2} y2={geom.y2} stroke="transparent" strokeWidth="26" strokeLinecap="round" />
      {state === 'filled' ? (
        <motion.g animate={held ? { y: -5, scale: 1.04 } : { y: 0, scale: 1 }} style={{ transformOrigin: `${mid.x}px ${mid.y}px`, opacity: ghosted ? 0.3 : 1 }}>
          <line x1={geom.x1} y1={geom.y1} x2={geom.x2} y2={geom.y2}
            stroke={held ? '#fde68a' : '#f2c14e'} strokeWidth="11" strokeLinecap="round"
            style={held ? { filter: 'drop-shadow(0 0 6px #fde68a)' } : undefined} />
          <circle cx={geom.x1} cy={geom.y1} r="7.5" fill="#e25e4e" />
        </motion.g>
      ) : (
        <line x1={geom.x1} y1={geom.y1} x2={geom.x2} y2={geom.y2}
          stroke={over ? '#4ade80' : '#67e8f9'} strokeOpacity={over ? 0.95 : 0.5}
          strokeWidth={over ? 12 : 9} strokeLinecap="round" strokeDasharray="4 7"
          style={over ? { filter: 'drop-shadow(0 0 6px #4ade80)' } : undefined} />
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
  const [drag, setDrag] = useState(null); // { ci, seg, x0, y0, x, y, moved, wasHeld, over }
  const svgRef = useRef(null);
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const reset = () => { setCells(initial.map((c) => ({ ...c }))); setHeld(null); setUsed(0); setDrag(null); };

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

  // Move the held match from its slot into an empty target slot.
  function place(fromCi, fromSeg, toCi, toSeg) {
    const next = cells.map((c) => ({ ...c }));
    next[fromCi].mask &= ~BIT[fromSeg];
    next[toCi].mask |= BIT[toSeg];
    const nUsed = used + 1;
    setCells(next);
    setHeld(null);
    setUsed(nUsed);
    if (nUsed >= maxMoves) evaluate(next);
  }

  // client → svg-user coords, so a dragged ghost tracks the finger exactly.
  function clientToSvg(cx, cy) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }
  // The empty slot under the pointer (if any) — targets carry data-stick "ci:seg:0".
  function slotUnder(cx, cy) {
    const el = document.elementFromPoint(cx, cy);
    const g = el && el.closest ? el.closest('[data-stick]') : null;
    if (!g) return null;
    const [ci, seg, filled] = g.getAttribute('data-stick').split(':');
    return filled === '0' ? { ci: Number(ci), seg } : null;
  }

  // Grab a filled match: lift it (reveals the empty target slots, same as tapping)
  // and begin a drag session. A tap without movement just leaves it lifted.
  function grabStick(ci, seg, e) {
    if (disabled || doneRef.current) return;
    const wasHeld = held && held.ci === ci && held.seg === seg;
    setHeld({ ci, seg });
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    setDrag({ ci, seg, x0: x, y0: y, x, y, moved: false, wasHeld, over: null });
    try { svgRef.current.setPointerCapture(e.pointerId); } catch { /* pre-capture browsers */ }
  }
  // Tapping an empty slot places the currently-held match there.
  function tapSlot(ci, seg) {
    if (disabled || doneRef.current || !held) return;
    place(held.ci, held.seg, ci, seg);
  }
  function dragMove(e) {
    if (!drag) return;
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const moved = drag.moved || Math.hypot(x - drag.x0, y - drag.y0) > 9;
    const over = moved ? slotUnder(e.clientX, e.clientY) : null;
    setDrag({ ...drag, x, y, moved, over });
  }
  function dragEnd(e) {
    if (!drag) return;
    try { svgRef.current.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    const target = slotUnder(e.clientX, e.clientY);
    if (drag.moved && target) place(drag.ci, drag.seg, target.ci, target.seg);
    else if (!drag.moved && drag.wasHeld) setHeld(null); // tap a lifted match again to set it back down
    // dragged-but-missed: keep it lifted so the glowing slots stay for a tap-place
    setDrag(null);
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
          ref={svgRef}
          viewBox={`0 0 ${cells.length * 100} 180`}
          className="block h-[150px] w-auto max-w-full sm:h-[180px]"
          role="img"
          aria-label={`Matchstick puzzle: ${start}`}
          style={{ touchAction: 'none' }}
          onPointerMove={dragMove}
          onPointerUp={dragEnd}
          onPointerCancel={dragEnd}
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
                  const isOver = !filled && drag && drag.over && drag.over.ci === ci && drag.over.seg === seg;
                  const isGhosted = filled && drag && drag.moved && drag.ci === ci && drag.seg === seg;
                  return (
                    <Stick key={seg} geom={SEG_GEOM[seg]} state={filled ? 'filled' : 'empty'} qa={`${ci}:${seg}:${filled ? 1 : 0}`}
                      held={isHeld} over={isOver} ghosted={isGhosted}
                      onPointerDown={(e) => (filled ? grabStick(ci, seg, e) : tapSlot(ci, seg))} />
                  );
                })
              )}
            </g>
          ))}
          {/* the dragged match, following the finger */}
          {drag && drag.moved && (() => {
            const g = SEG_GEOM[drag.seg];
            const hx = (g.x2 - g.x1) / 2;
            const hy = (g.y2 - g.y1) / 2;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <line x1={drag.x - hx} y1={drag.y - hy} x2={drag.x + hx} y2={drag.y + hy}
                  stroke="#fde68a" strokeWidth="11" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 7px #fde68a)' }} />
                <circle cx={drag.x - hx} cy={drag.y - hy} r="7.5" fill="#e25e4e" />
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs font-bold text-slate-500">
          {held ? 'Drop it on a glowing slot!' : 'Drag a match — or tap to pick it up.'}
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
