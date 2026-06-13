// Interactive hints — topic-tailored visual aids shown on the lightbulb tap.
// A step may carry `interactiveHint: { kind, ... }`; QuestScreen renders the
// matching component from INTERACTIVE_HINTS. Generic by design: new topics add
// a kind + a component here (number lines, ten-frames, fraction bars, …).

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Pie, FracLabel, Coin, ClockFace } from './boardsFacts.jsx';

const ROW_C = '#22D3EE'; // horizontal sweep
const COL_C = '#FFE066'; // vertical sweep
const ANS_C = '#4ADE80'; // the meeting point

// Shared 3D-ish cube face (top highlight + bottom shadow + glow) used across the
// block reps — add (CombineBlocks), subtract (TakeAwayBlocks), × (ArrayModel),
// ÷ (ShareGroups) — so manipulatives look like real, consistent Numberblocks cubes.
const cubeFace = (color) => ({
  background: color,
  boxShadow: `inset 0 4px 0 #ffffff77, inset 0 -5px 0 #00000026, 0 0 10px ${color}aa`,
});

// Multiplication grid. Opens as a plain table, then animates: the row sweeps
// across, the column sweeps down, and they converge on the answer cell which
// pops in. `mode: 'div'` reads it backwards (the answer is the column header).
export function MulTableHint({ hint }) {
  const N = 10;
  const { row, col, mode } = hint;
  const product = row * col;
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0); // bump to replay

  const STEP = reduce ? 0 : 0.07;
  const rowDur = col * STEP; // time for the horizontal sweep to reach the answer column
  const colBase = rowDur + (reduce ? 0 : 0.25); // column sweep starts after
  const answerAt = colBase + row * STEP + (reduce ? 0 : 0.3);

  const cellTransition = (delay) => ({ duration: reduce ? 0 : 0.32, delay });

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="max-w-[320px] text-center text-sm font-bold text-slate-300">
        {mode === 'div'
          ? `Find ${product} in row ${row} — the column on top is your answer!`
          : `Watch row ${row} go across and column ${col} go down — they meet at the answer!`}
      </p>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e1014] p-2">
        <table key={run} className="border-collapse font-mono text-[13px] font-bold sm:text-sm">
          <tbody>
            {Array.from({ length: N + 1 }, (_, r) => (
              <tr key={r}>
                {Array.from({ length: N + 1 }, (_, c) => {
                  const corner = r === 0 && c === 0;
                  const isHeader = r === 0 || c === 0;
                  const val = corner ? '×' : r === 0 ? c : c === 0 ? r : r * c;

                  const isAnswer = !isHeader && r === row && c === col;
                  const onRowPath = r === row && c <= col && !isAnswer; // includes header
                  const onColPath = c === col && r <= row && !isAnswer;
                  const colHeadAns = mode === 'div' && r === 0 && c === col;

                  // resting look
                  let bg = 'rgba(0,0,0,0)';
                  let color = corner ? '#64748b' : isHeader ? '#94a3b8' : '#475569';
                  let delay = 0;
                  let animate = false;

                  if (onRowPath) {
                    bg = ROW_C + '22';
                    color = ROW_C;
                    delay = c * STEP;
                    animate = true;
                  } else if (onColPath) {
                    bg = COL_C + '22';
                    color = COL_C;
                    delay = colBase + r * STEP;
                    animate = true;
                  } else if (isAnswer || colHeadAns) {
                    bg = ANS_C + '33';
                    color = ANS_C;
                    delay = answerAt;
                    animate = true;
                  }

                  const base = 'border border-white/5 text-center align-middle';
                  const dims = { width: 30, height: 26 };

                  if (!animate) {
                    return (
                      <td key={c} className={base} style={{ ...dims, color }}>
                        {val}
                      </td>
                    );
                  }
                  return (
                    <motion.td
                      key={c}
                      className={base}
                      style={dims}
                      initial={{ backgroundColor: 'rgba(0,0,0,0)', color: isHeader ? '#94a3b8' : '#475569' }}
                      animate={{ backgroundColor: bg, color }}
                      transition={cellTransition(delay)}
                    >
                      {isAnswer || colHeadAns ? (
                        <motion.span
                          className="inline-block"
                          initial={{ scale: 0.5 }}
                          animate={{ scale: [0.5, 1.6, 1] }}
                          transition={{ delay: answerAt, duration: reduce ? 0 : 0.5, times: [0, 0.6, 1] }}
                          style={{ textShadow: `0 0 12px ${ANS_C}` }}
                        >
                          {val}
                        </motion.span>
                      ) : (
                        val
                      )}
                    </motion.td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <p className="font-mono text-lg font-bold text-slate-500">
          {row} <span style={{ color: ROW_C }}>×</span> {col} ={' '}
          <motion.span
            key={run}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: answerAt, duration: reduce ? 0 : 0.4 }}
            style={{ color: ANS_C, textShadow: `0 0 10px ${ANS_C}88` }}
          >
            {product}
          </motion.span>
        </p>
      </div>
    </div>
  );
}

// Number line: a token hops one unit at a time from the start, arcs drawing in
// as it goes, a running count underneath, landing on the answer. Teaches
// counting-on (+) , counting-back (−), and bonds (how many hops to the target).
export function NumberLineHint({ hint }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const { start, op } = hint;
  const delta = op === 'bondup' ? hint.target - start : hint.delta;
  const dir = op === 'sub' ? -1 : 1;
  const end = op === 'bondup' ? hint.target : start + dir * delta;
  const hops = Math.abs(delta);
  const max = Math.max(start, end) + 1;
  const W = 360;
  const PAD = 22;
  const x = (v) => PAD + (v / max) * (W - 2 * PAD);
  const Y = 84;
  const PEAK = 40;

  // landing values along the path
  const lands = Array.from({ length: hops + 1 }, (_, i) => start + dir * i);
  // marker keyframes: per hop, an arc midpoint then the landing
  const cx = [x(lands[0])];
  const cy = [Y];
  for (let i = 1; i <= hops; i++) {
    cx.push((x(lands[i - 1]) + x(lands[i])) / 2, x(lands[i]));
    cy.push(Y - PEAK, Y);
  }
  const HOP = reduce ? 0 : 0.5;
  const total = reduce ? 0 : hops * HOP;
  const answer = op === 'bondup' ? hops : end;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="max-w-[330px] text-center text-sm font-bold text-slate-300">
        {op === 'sub'
          ? `Start at ${start} and hop back ${hops} — where do you land?`
          : op === 'bondup'
            ? `Start at ${start} and hop up to ${hint.target} — count the hops!`
            : `Start at ${start} and hop forward ${hops} — where do you land?`}
      </p>
      <div className="rounded-2xl border border-white/10 bg-[#0e1014] p-3">
        <svg key={run} width={W} height={120} viewBox={`0 0 ${W} 120`}>
          {/* base line */}
          <line x1={PAD} y1={Y} x2={W - PAD} y2={Y} stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          {/* the amount you START with (0 → start), highlighted before the hops */}
          <motion.line
            x1={x(0)} y1={Y} x2={x(start)} y2={Y}
            stroke="#22D3EE" strokeWidth="6" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: reduce ? 0 : 0.5 }}
          />
          {/* ticks + labels */}
          {Array.from({ length: max + 1 }, (_, v) => (
            <g key={v}>
              <line x1={x(v)} y1={Y - 5} x2={x(v)} y2={Y + 5} stroke="#475569" strokeWidth="1.5" />
              <text x={x(v)} y={Y + 20} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono"
                fill={v === start ? '#22D3EE' : v === end ? '#4ADE80' : '#64748b'}
                fontWeight={v === start || v === end ? 'bold' : 'normal'}>
                {v}
              </text>
            </g>
          ))}
          {/* hop arcs draw in sequence */}
          {lands.slice(1).map((_, i) => {
            const x0 = x(lands[i]);
            const x1 = x(lands[i + 1]);
            return (
              <motion.path
                key={i}
                d={`M ${x0} ${Y} Q ${(x0 + x1) / 2} ${Y - PEAK - 6} ${x1} ${Y}`}
                fill="none"
                stroke="#A78BFA"
                strokeWidth="2"
                strokeDasharray="0 0"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ delay: i * HOP, duration: reduce ? 0 : HOP * 0.9 }}
              />
            );
          })}
          {/* running hop counter under each landing */}
          {lands.slice(1).map((v, i) => (
            <motion.text
              key={`c${i}`}
              x={x(v)} y={Y - PEAK - 12} textAnchor="middle" fontSize="11" fontWeight="bold"
              fontFamily="JetBrains Mono" fill="#A78BFA"
              initial={{ opacity: 0, y: Y - PEAK }}
              animate={{ opacity: 1 }}
              transition={{ delay: (i + 1) * HOP - 0.05 }}
            >
              {i + 1}
            </motion.text>
          ))}
          {/* the hopping token */}
          <motion.circle
            r="8" fill="#FFE066" stroke="#0e1014" strokeWidth="2"
            initial={{ cx: x(start), cy: Y }}
            animate={{ cx, cy }}
            transition={{ duration: total, times: cx.map((_, i) => (cx.length > 1 ? i / (cx.length - 1) : 0)), ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 6px #FFE066)' }}
          />
          {/* answer glow on the landing tick */}
          <motion.circle
            cx={x(end)} cy={Y} r="11" fill="none" stroke="#4ADE80" strokeWidth="2.5"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0.7], scale: [0.5, 1.3, 1] }}
            transition={{ delay: total, duration: reduce ? 0 : 0.6 }}
          />
        </svg>
      </div>
      <div className="flex items-center gap-3">
        <motion.p
          key={run}
          className="font-mono text-lg font-bold"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: total + 0.1 }}
          style={{ color: '#4ADE80', textShadow: '0 0 10px #4ADE8088' }}
        >
          {op === 'bondup' ? `${start} + ${answer} = ${hint.target}` : `${start} ${op === 'sub' ? '−' : '+'} ${hops} = ${answer}`}
        </motion.p>
      </div>
    </div>
  );
}

// ── concept representations (used by the "Learn it" screen) ─────────────────

// Repeated addition: `a` groups of `b` blocks appear one group at a time, with
// a running sum — multiplication as fast adding.
export function RepeatedAddition({ a, b, run = 0 }) {
  const reduce = useReducedMotion();
  const STEP = reduce ? 0 : 0.7;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-end justify-center gap-3">
        {Array.from({ length: a }, (_, g) => (
          <div key={g} className="flex flex-col items-center gap-1">
            <div className="grid grid-cols-1 gap-1">
              {Array.from({ length: b }, (_, i) => (
                <motion.span
                  key={i}
                  className="h-5 w-5 rounded-[4px]"
                  style={{ background: '#4ADE80', boxShadow: '0 0 6px #4ADE8088' }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: g * STEP + i * 0.06 }}
                />
              ))}
            </div>
            <motion.span
              className="font-mono text-sm font-bold text-emerald-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: g * STEP + 0.2 }}
            >
              {b}
            </motion.span>
          </div>
        ))}
      </div>
      <motion.p
        key={run}
        className="font-mono text-lg font-bold text-emerald-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: a * STEP }}
        style={{ textShadow: '0 0 10px #4ADE8088' }}
      >
        {Array.from({ length: a }, () => b).join(' + ')} = {a * b}
      </motion.p>
    </div>
  );
}

// Array model: an a×b rectangle of dots fills in, then the total counts up.
export function ArrayModel({ a, b }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-cyan-300">{a} rows</span>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/4 p-3">
          {Array.from({ length: a }, (_, r) => (
            <div key={r} className="flex gap-1.5">
              {Array.from({ length: b }, (_, c) => (
                <motion.span
                  key={c}
                  className="h-6 w-6 rounded-md"
                  style={cubeFace('#A78BFA')}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: reduce ? 0 : (r * b + c) * 0.05, type: 'spring', stiffness: 300, damping: 16 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="font-mono text-sm font-bold text-yellow-300">{b} in each row</span>
      <p className="font-mono text-lg font-bold text-emerald-300" style={{ textShadow: '0 0 10px #4ADE8088' }}>
        {a} × {b} = {a * b}
      </p>
    </div>
  );
}

// Count dots: each lights up with its number as you "point" to it.
// Count along: each number lights up in turn — "one, two, three…" — so the
// child sees exactly which one we're on. The highlight travels and loops.
export function CountDots({ n = 5 }) {
  const reduce = useReducedMotion();
  // `count` = how many we've said so far (1..n); the n-th dot is the one we're
  // saying now. 0 is a brief rest beat before it loops back to one.
  const [count, setCount] = useState(reduce ? n : 0);
  useEffect(() => {
    if (reduce) return;
    let c = 0;
    setCount(0);
    const id = setInterval(() => {
      c = c >= n ? 0 : c + 1; // 0,1,2,…,n, rest, then count again
      setCount(c);
    }, 650);
    return () => clearInterval(id);
  }, [n, reduce]);
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" style={{ maxWidth: 280 }}>
      {Array.from({ length: n }, (_, i) => {
        const counted = i < count;            // already said → calm lit
        const saying = !reduce && i + 1 === count; // the one we're on now
        const lit = counted || saying || reduce;
        return (
          <motion.div
            key={i}
            className="flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-bold"
            animate={{
              scale: saying ? 1.28 : 1,
              backgroundColor: lit ? '#FFE066' : '#2a2f3a',
              color: lit ? '#0e1014' : '#7c8699',
              boxShadow: saying ? '0 0 24px #FFE066' : counted ? '0 0 8px #FFE06655' : '0 0 0px rgba(0,0,0,0)',
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            {i + 1}
          </motion.div>
        );
      })}
    </div>
  );
}

// Ten-frame: `filled` cells lit, the rest pulse to show how many more.
export function TenFrame({ filled = 6, showEq = true }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid grid-cols-5 gap-1.5 rounded-2xl border border-white/10 bg-white/4 p-2">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.span
            key={i}
            className="h-9 w-9 rounded-md border-2"
            style={{ borderColor: '#22D3EE55', background: i < filled ? '#22D3EE66' : 'transparent' }}
            initial={i < filled ? { scale: 0 } : { opacity: 0.3 }}
            animate={i < filled ? { scale: 1 } : { opacity: [0.3, 0.8, 0.3] }}
            transition={i < filled ? { delay: reduce ? 0 : i * 0.12 } : { repeat: Infinity, duration: 1.6, delay: 0.8 }}
          />
        ))}
      </div>
      {showEq && <p className="font-mono text-base font-bold text-cyan-200">{filled} + {10 - filled} = 10</p>}
    </div>
  );
}

// Combine two groups of blocks into one total.
// Numberblocks-style: build a real tower of cubes — `a` (green) stacked, then
// `b` (cyan) stacking on top, counting up to a+b, so the combination is visible.
export function CombineBlocks({ a = 5, b = 3 }) {
  const reduce = useReducedMotion();
  const total = a + b;
  const S = 32; // cube size px
  const Cube = ({ i }) => {
    const color = i < a ? '#4ADE80' : '#22D3EE';
    return (
      <motion.div
        initial={{ opacity: 0, y: -26, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: reduce ? 0 : i * 0.18, type: 'spring', stiffness: 360, damping: 19 }}
        className="flex items-center justify-center rounded-md font-mono text-sm font-extrabold text-slate-900"
        style={{ width: S, height: S, ...cubeFace(color) }}
      >
        {i + 1}
      </motion.div>
    );
  };
  return (
    <div className="flex items-center justify-center gap-6">
      {/* the tower, built bottom-up: green base of `a`, then cyan `b` on top */}
      <div className="flex flex-col-reverse items-center gap-[5px]">
        {Array.from({ length: total }, (_, i) => (
          <Cube key={i} i={i} />
        ))}
      </div>
      {/* equation, revealed once the tower is complete */}
      <motion.p
        className="font-mono text-2xl font-extrabold"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: reduce ? 0 : total * 0.18 + 0.25 }}
      >
        <span style={{ color: '#4ADE80', textShadow: '0 0 8px #4ADE8088' }}>{a}</span>
        <span className="text-slate-500"> + </span>
        <span style={{ color: '#22D3EE', textShadow: '0 0 8px #22D3EE88' }}>{b}</span>
        <span className="text-slate-500"> = </span>
        <span style={{ color: '#FFE066', textShadow: '0 0 10px #FFE06688' }}>{total}</span>
      </motion.p>
    </div>
  );
}

// Take-away: start with `a` blocks, `b` fade out, count what remains.
// Take away: a tower of `a` cubes; the top `b` lift off and vanish, leaving a−b.
export function TakeAwayBlocks({ a = 8, b = 3 }) {
  const reduce = useReducedMotion();
  const ROSE = '#F472B6';
  return (
    <div className="flex items-center justify-center gap-6">
      <div className="flex flex-col-reverse items-center gap-[5px]">
        {Array.from({ length: a }, (_, i) => {
          const gone = i >= a - b; // the top `b` cubes are taken away
          return (
            <motion.div
              key={i}
              className="flex items-center justify-center rounded-md font-mono text-sm font-extrabold text-slate-900"
              style={{ width: 32, height: 32, ...cubeFace(ROSE) }}
              animate={gone ? { opacity: [1, 1, 0], scale: [1, 1, 0.5], y: [0, 0, -30] } : {}}
              transition={gone ? { delay: reduce ? 0 : 0.9 + (a - 1 - i) * 0.4, duration: 0.6, times: [0, 0.4, 1] } : {}}
            >
              {i + 1}
            </motion.div>
          );
        })}
      </div>
      <motion.p
        className="font-mono text-2xl font-extrabold"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: reduce ? 0 : 0.9 + b * 0.4 + 0.5 }}
      >
        <span style={{ color: ROSE, textShadow: `0 0 8px ${ROSE}88` }}>{a}</span>
        <span className="text-slate-500"> − </span>
        <span style={{ color: ROSE, textShadow: `0 0 8px ${ROSE}88` }}>{b}</span>
        <span className="text-slate-500"> = </span>
        <span style={{ color: '#FFE066', textShadow: '0 0 10px #FFE06688' }}>{a - b}</span>
      </motion.p>
    </div>
  );
}

// Share total into `groups` equal groups, dealt one at a time.
export function ShareGroups({ total = 12, groups = 3 }) {
  const reduce = useReducedMotion();
  const per = Math.floor(total / groups);
  const GROUP_C = ['#4ADE80', '#22D3EE', '#A78BFA', '#FFE066', '#F472B6', '#FB923C'];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-start justify-center gap-3">
        {Array.from({ length: groups }, (_, g) => (
          <div key={g} className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/4 p-2">
            {Array.from({ length: per }, (_, i) => (
              <motion.span
                key={i}
                className="h-6 w-6 rounded-md"
                style={cubeFace(GROUP_C[g % GROUP_C.length])}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: reduce ? 0 : (i * groups + g) * 0.25 }} // deal round-robin
              />
            ))}
          </div>
        ))}
      </div>
      <motion.p className="font-mono text-lg font-bold text-emerald-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : per * groups * 0.25 + 0.2 }} style={{ textShadow: '0 0 10px #4ADE8088' }}>
        {total} ÷ {groups} = {per}
      </motion.p>
    </div>
  );
}

// Base-ten blocks: `t` ten-rods + `o` unit-blocks build the number.
export function BaseTenBlocks({ t = 2, o = 3 }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-end gap-4 rounded-2xl border border-white/10 bg-white/4 p-4">
        <div className="flex gap-1.5">
          {Array.from({ length: t }, (_, k) => (
            <motion.div
              key={k}
              className="flex h-24 w-5 origin-bottom flex-col gap-px rounded-md border border-cyan-300/50 bg-cyan-400/15 p-0.5"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: reduce ? 0 : k * 0.2 }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="flex-1 rounded-[1px] bg-cyan-300/40" />
              ))}
            </motion.div>
          ))}
        </div>
        <div className="flex max-w-[120px] flex-wrap gap-1.5">
          {Array.from({ length: o }, (_, k) => (
            <motion.span
              key={k}
              className="h-5 w-5 rounded-[3px] border border-yellow-300/60 bg-yellow-300/25"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: reduce ? 0 : t * 0.2 + k * 0.12, type: 'spring', stiffness: 300, damping: 14 }}
            />
          ))}
        </div>
      </div>
      <p className="font-mono text-base font-bold">
        <span className="text-cyan-300">{t} ten{t !== 1 ? 's' : ''}</span>
        <span className="text-slate-500"> + </span>
        <span className="text-yellow-300">{o} one{o !== 1 ? 's' : ''}</span>
        <span className="text-slate-500"> = </span>
        <span className="text-emerald-300" style={{ textShadow: '0 0 10px #4ADE8088' }}>{t * 10 + o}</span>
      </p>
    </div>
  );
}

// Compare two numbers: bars grow to each value; the bigger one glows.
export function CompareCards({ a = 42, b = 28 }) {
  const reduce = useReducedMotion();
  const max = Math.max(a, b);
  const bigger = a >= b ? 'a' : 'b';
  const Card = ({ v, key: which }) => {
    const win = which === bigger;
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-3xl font-bold" style={{ color: win ? '#4ADE80' : '#94a3b8', textShadow: win ? '0 0 10px #4ADE8088' : 'none' }}>{v}</span>
        <div className="flex h-32 w-12 items-end overflow-hidden rounded-lg border border-white/10 bg-white/4">
          <motion.div
            className="w-full rounded-t-md"
            style={{ background: win ? '#4ADE80' : '#64748b' }}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ duration: reduce ? 0 : 0.9, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-8">
        <Card v={a} key="a" />
        <Card v={b} key="b" />
      </div>
      <p className="font-mono text-base font-bold text-emerald-300">
        {Math.max(a, b)} &gt; {Math.min(a, b)}
      </p>
    </div>
  );
}

// Even/odd: dots arranged two-per-row to show pairs; an odd one is left over.
// Even/odd: dots pop into a row, then visibly SEPARATE into groups of two. If
// odd, the last one slides out alone and pulses — "one left over!".
export function EvenOddDots({ n = 6 }) {
  const reduce = useReducedMotion();
  const odd = n % 2 === 1;
  const popDone = reduce ? 0 : n * 0.12 + 0.3; // when the separation begins
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-center" style={{ minHeight: 30 }}>
        {Array.from({ length: n }, (_, i) => {
          const leftover = odd && i === n - 1;
          const startsPair = i % 2 === 0; // a gap opens before each new pair
          const color = leftover ? '#F472B6' : '#A78BFA';
          return (
            <motion.span
              key={i}
              className="rounded-full"
              style={{ width: 28, height: 28, background: color, boxShadow: `0 0 9px ${color}aa` }}
              initial={{ scale: 0, marginLeft: i === 0 ? 0 : 4 }}
              animate={{
                scale: leftover ? [0, 1, 1.25, 1] : 1,
                marginLeft: i === 0 ? 0 : startsPair ? 26 : 4,
              }}
              transition={{
                scale: { delay: reduce ? 0 : i * 0.12, duration: 0.3 },
                marginLeft: { delay: popDone, duration: 0.55, ease: 'easeOut' },
              }}
            />
          );
        })}
      </div>
      <motion.p
        className="font-mono text-lg font-extrabold"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: popDone + 0.7 }}
        style={{ color: odd ? '#F472B6' : '#4ADE80', textShadow: `0 0 10px ${odd ? '#F472B6' : '#4ADE80'}88` }}
      >
        {n} is {odd ? 'ODD — one left over!' : 'EVEN — perfect pairs!'}
      </motion.p>
    </div>
  );
}

// Skip counting: stones at 0, step, 2·step… with a token hopping across.
export function SkipHops({ step = 5, count = 4 }) {
  const reduce = useReducedMotion();
  const vals = Array.from({ length: count }, (_, i) => step * (i + 1));
  const W = 360;
  const PAD = 26;
  const x = (i) => PAD + (i / count) * (W - 2 * PAD);
  const Y = 70;
  const HOP = reduce ? 0 : 0.6;
  const cx = [x(0)];
  const cy = [Y];
  for (let i = 1; i <= count; i++) {
    cx.push((x(i - 1) + x(i)) / 2, x(i));
    cy.push(Y - 34, Y);
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={W} height={104} viewBox={`0 0 ${W} 104`}>
        <line x1={PAD} y1={Y} x2={W - PAD} y2={Y} stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
        {[0, ...vals].map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={Y} r="4" fill="#475569" />
            <motion.text x={x(i)} y={Y + 20} textAnchor="middle" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono"
              fill={i === 0 ? '#64748b' : '#A78BFA'}
              initial={{ opacity: i === 0 ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: i * HOP }}>
              {v}
            </motion.text>
          </g>
        ))}
        {vals.map((_, i) => (
          <motion.path key={i} d={`M ${x(i)} ${Y} Q ${(x(i) + x(i + 1)) / 2} ${Y - 40} ${x(i + 1)} ${Y}`}
            fill="none" stroke="#A78BFA" strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ delay: i * HOP, duration: reduce ? 0 : HOP * 0.9 }} />
        ))}
        <motion.circle r="8" fill="#FFE066" stroke="#0e1014" strokeWidth="2"
          initial={{ cx: x(0), cy: Y }} animate={{ cx, cy }}
          transition={{ duration: reduce ? 0 : count * HOP, times: cx.map((_, i) => (cx.length > 1 ? i / (cx.length - 1) : 0)), ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 6px #FFE066)' }} />
      </svg>
      <p className="font-mono text-base font-bold text-purple-300">+{step} each hop → {vals.join(', ')}</p>
    </div>
  );
}

// ── fraction reps (reuse the Pie component) ─────────────────────────────────

// A fraction as a bar: n equal parts, first k filled.
export function FractionBar({ n = 4, k = 3, color = '#4ADE80' }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1 rounded-lg border border-white/10 p-1">
        {Array.from({ length: n }, (_, i) => (
          <motion.span
            key={i}
            className="h-10 w-10 rounded"
            style={{ background: i < k ? color + '99' : 'transparent', border: `1.5px solid ${color}55` }}
            initial={i < k ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : i * 0.18 }}
          />
        ))}
      </div>
      <FracLabel top={k} bottom={n} color={color} />
    </div>
  );
}

// Concept: the same fraction shown as a pie and as a bar, side by side.
export function FractionPieBar({ k = 3, n = 4 }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-7">
      <div className="flex flex-col items-center gap-2">
        <Pie n={n} k={k} size={140} />
        <FracLabel top={k} bottom={n} />
      </div>
      <FractionBar n={n} k={k} />
    </div>
  );
}

// Equivalent: a/b and (a·m)/(b·m) — same shaded area, finer slices.
export function EquivFractions({ a = 1, b = 2, m = 2 }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <div className="flex flex-col items-center gap-2">
        <Pie n={b} k={a} size={130} color="#A78BFA" />
        <FracLabel top={a} bottom={b} color="#A78BFA" />
      </div>
      <span className="font-mono text-4xl text-slate-500">=</span>
      <div className="flex flex-col items-center gap-2">
        <Pie n={b * m} k={a * m} size={130} delay={0.3} />
        <FracLabel top={a * m} bottom={b * m} />
      </div>
    </div>
  );
}

// Compare: two pies; the larger fraction glows.
export function CompareFractions({ k1 = 1, n1 = 2, k2 = 1, n2 = 3 }) {
  const f1 = k1 / n1;
  const big1 = f1 >= k2 / n2;
  const Card = ({ k, n, win, color }) => (
    <motion.div className="flex flex-col items-center gap-2 rounded-2xl border-2 p-3"
      style={{ borderColor: win ? '#4ADE80' : '#ffffff14', boxShadow: win ? '0 0 26px #4ADE8044' : 'none' }}
      animate={{ scale: win ? 1.06 : 1 }}>
      <Pie n={n} k={k} size={120} color={win ? '#4ADE80' : color} />
      <FracLabel top={k} bottom={n} color={win ? '#4ADE80' : color} />
    </motion.div>
  );
  return (
    <div className="flex items-center justify-center gap-5">
      <Card k={k1} n={n1} win={big1} color="#FFE066" />
      <span className="font-mono text-3xl font-bold text-slate-400">{big1 ? '>' : '<'}</span>
      <Card k={k2} n={n2} win={!big1} color="#F472B6" />
    </div>
  );
}

// Add like denominators: pie + pie = pie (the result fills in).
export function AddFractions({ a = 1, b = 2, n = 4 }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-center gap-3">
      <div key={run} className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-1"><Pie n={n} k={a} size={92} color="#4ADE80" /><FracLabel top={a} bottom={n} /></div>
        <span className="font-mono text-3xl text-slate-500">+</span>
        <div className="flex flex-col items-center gap-1"><Pie n={n} k={b} size={92} color="#22D3EE" delay={0.2} /><FracLabel top={b} bottom={n} color="#22D3EE" /></div>
        <span className="font-mono text-3xl text-slate-500">=</span>
        <div className="flex flex-col items-center gap-1"><Pie n={n} k={a + b} size={92} color="#FFE066" delay={0.5} /><FracLabel top={a + b} bottom={n} color="#FFE066" /></div>
      </div>
    </div>
  );
}

// Rounding: value sits between two anchors; past the midpoint it snaps up.
export function RoundingLine({ v = 47, unit = 10 }) {
  const reduce = useReducedMotion();
  const lo = Math.floor(v / unit) * unit;
  const hi = lo + unit;
  const mid = lo + unit / 2;
  const nearer = v >= mid ? hi : lo;
  const W = 340;
  const PAD = 30;
  const x = (val) => PAD + ((val - lo) / unit) * (W - 2 * PAD);
  const Y = 70;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={W} height={108} viewBox={`0 0 ${W} 108`}>
        <line x1={PAD} y1={Y} x2={W - PAD} y2={Y} stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
        {/* midpoint marker */}
        <line x1={x(mid)} y1={Y - 14} x2={x(mid)} y2={Y + 14} stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x={x(mid)} y={Y + 28} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="JetBrains Mono">middle</text>
        {/* anchors */}
        {[lo, hi].map((a) => (
          <g key={a}>
            <line x1={x(a)} y1={Y - 8} x2={x(a)} y2={Y + 8} stroke={a === nearer ? '#4ADE80' : '#94a3b8'} strokeWidth="3" />
            <text x={x(a)} y={Y - 16} textAnchor="middle" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono"
              fill={a === nearer ? '#4ADE80' : '#94a3b8'}>{a}</text>
          </g>
        ))}
        {/* the value, then it snaps to the nearer anchor */}
        <motion.g initial={{ x: 0 }} animate={{ x: reduce ? x(nearer) - x(v) : [0, 0, x(nearer) - x(v)] }}
          transition={{ duration: reduce ? 0 : 1.6, times: [0, 0.5, 1] }}>
          <circle cx={x(v)} cy={Y} r="7" fill="#FFE066" stroke="#0e1014" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px #FFE066)' }} />
          <text x={x(v)} y={Y + 26} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#FFE066" fontFamily="JetBrains Mono">{v}</text>
        </motion.g>
      </svg>
      <motion.p className="font-mono text-lg font-bold text-emerald-300"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.6 }}
        style={{ textShadow: '0 0 10px #4ADE8088' }}>
        {v} rounds to {nearer}
      </motion.p>
    </div>
  );
}

// Word problems: a story card, then the bare operation it hides reveals.
export function WordReveal() {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  return (
    <div key={run} className="flex max-w-[360px] flex-col items-center gap-4">
      <motion.div className="rounded-2xl border-2 border-emerald-300/30 bg-[#171b28] p-4 text-center"
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="mb-1 text-3xl">🍎🍎🍎🍎🍎</div>
        <p className="text-base font-bold text-slate-100">Mia has 5 apples and gets 3 more. How many now?</p>
      </motion.div>
      <motion.div className="flex items-center gap-2 text-sm font-bold text-slate-400"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.2 }}>
        <span className="rounded bg-cyan-400/15 px-2 py-0.5 text-cyan-300">“more” → add</span>
      </motion.div>
      <motion.p className="font-mono text-2xl font-bold text-emerald-300"
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduce ? 0 : 2 }}
        style={{ textShadow: '0 0 10px #4ADE8088' }}>
        5 + 3 = 8
      </motion.p>
    </div>
  );
}

// ── decimal reps ────────────────────────────────────────────────────────────

// A 10×10 "whole" shaded by a decimal value (column-major: tenths = columns).
export function DecimalGrid({ value = 0.3, color = '#22D3EE', size = 150, delay = 0 }) {
  const reduce = useReducedMotion();
  const cells = Math.round(value * 100);
  const fullCols = Math.floor(cells / 10);
  const extra = cells - fullCols * 10;
  const cell = size / 10;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-10 rounded-lg border-2 border-white/15" style={{ width: size }}>
        {Array.from({ length: 100 }, (_, i) => {
          const c = i % 10;
          const r = Math.floor(i / 10);
          const shaded = c < fullCols || (c === fullCols && r < extra);
          return (
            <motion.span
              key={i}
              style={{ width: cell, height: cell, background: shaded ? color + '99' : 'transparent', borderRight: '0.5px solid #ffffff14', borderBottom: '0.5px solid #ffffff14' }}
              initial={shaded ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : delay + c * 0.08 }}
            />
          );
        })}
      </div>
      <span className="font-mono text-lg font-bold" style={{ color, textShadow: `0 0 8px ${color}66` }}>{value}</span>
    </div>
  );
}

export function CompareDecimals({ a = 0.5, b = 0.45 }) {
  const big = a >= b ? 'a' : 'b';
  return (
    <div className="flex items-center justify-center gap-4">
      <div style={{ filter: big === 'a' ? 'drop-shadow(0 0 12px #4ADE8088)' : 'none' }}>
        <DecimalGrid value={a} size={130} color={big === 'a' ? '#4ADE80' : '#94a3b8'} />
      </div>
      <span className="font-mono text-3xl font-bold text-slate-400">{a >= b ? '>' : '<'}</span>
      <div style={{ filter: big === 'b' ? 'drop-shadow(0 0 12px #4ADE8088)' : 'none' }}>
        <DecimalGrid value={b} size={130} color={big === 'b' ? '#4ADE80' : '#94a3b8'} delay={0.3} />
      </div>
    </div>
  );
}

// Add decimals: stacked with the points aligned, sum revealed.
export function AddDecimals({ a = 1.2, b = 3.4 }) {
  const reduce = useReducedMotion();
  const sum = Math.round((a + b) * 10) / 10;
  const Row = ({ val, sign }) => (
    <div className="flex items-center gap-1">
      <span className="w-5 text-right font-mono text-2xl text-slate-500">{sign}</span>
      <span className="font-mono text-3xl font-bold text-slate-100">{val.toFixed(1)}</span>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="mb-1 text-xs font-bold text-cyan-300">Line up the decimal points! ⬇</p>
      <div className="inline-flex flex-col items-end gap-1 rounded-2xl border border-white/10 bg-white/4 p-4">
        <Row val={a} sign="" />
        <Row val={b} sign="+" />
        <div className="my-1 h-[2px] w-full rounded bg-slate-400" />
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 1 }} className="flex items-center gap-1">
          <span className="w-5" />
          <span className="font-mono text-3xl font-bold text-emerald-300" style={{ textShadow: '0 0 10px #4ADE8088' }}>{sum.toFixed(1)}</span>
        </motion.div>
      </div>
    </div>
  );
}

// ×10 / ÷10: the decimal point hops.
export function DecimalHop({ from = 3.4, factor = 10, op = '×' }) {
  const reduce = useReducedMotion();
  const result = op === '×' ? from * factor : from / factor;
  const hops = factor === 100 ? 2 : 1;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 font-mono text-4xl font-bold">
        <span className="text-slate-100">{from}</span>
        <span className="text-slate-500">{op}</span>
        <span className="text-cyan-300">{factor}</span>
      </div>
      <motion.div className="flex items-center gap-1 text-cyan-300"
        animate={{ x: op === '×' ? [0, 16, 0] : [0, -16, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        <span className="text-3xl">.</span>
        <span className="text-sm font-extrabold">point hops {hops} {op === '×' ? 'right →' : '← left'}</span>
      </motion.div>
      <motion.p className="font-mono text-3xl font-bold text-emerald-300" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduce ? 0 : 1 }} style={{ textShadow: '0 0 10px #4ADE8088' }}>
        = {Number.isInteger(result) ? result : result.toFixed(2)}
      </motion.p>
    </div>
  );
}

// ── measure reps (reuse Coin + ClockFace) ───────────────────────────────────

// Coin tray: coins appear biggest-first with a running total.
export function CoinTray({ coins = [25, 10] }) {
  const reduce = useReducedMotion();
  const sorted = [...coins].sort((a, b) => b - a);
  let running = 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/4 p-5">
        {sorted.map((v, i) => {
          running += v;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <Coin v={v} delay={i * 0.5} />
              <motion.span className="font-mono text-xs font-bold text-yellow-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : i * 0.5 + 0.3 }}>
                {running}¢
              </motion.span>
            </div>
          );
        })}
      </div>
      <p className="font-mono text-lg font-bold text-emerald-300" style={{ textShadow: '0 0 10px #4ADE8088' }}>
        = {coins.reduce((a, b) => a + b, 0)}¢
      </p>
    </div>
  );
}

export function ClockRead({ h = 3, m = 30 }) {
  return (
    <div className="flex items-center gap-6">
      <ClockFace h={h} m={m} size={160} />
      <div className="flex flex-col items-center">
        <span className="font-mono text-3xl font-bold text-cyan-200">{h}:{String(m).padStart(2, '0')}</span>
        <span className="text-xs font-bold text-slate-400">{m === 0 ? "o'clock" : m === 30 ? 'half past' : `${m} past`}</span>
      </div>
    </div>
  );
}

export function ElapsedClocks({ h1 = 2, m1 = 0, dh = 1, dm = 30 }) {
  let h2 = h1 + dh;
  let m2 = m1 + dm;
  if (m2 >= 60) { m2 -= 60; h2 += 1; }
  const dur = `${dh ? `${dh}h` : ''}${dh && dm ? ' ' : ''}${dm ? `${dm}m` : ''}`;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <ClockFace h={h1} m={m1} size={120} />
        <div className="flex flex-col items-center text-cyan-300">
          <span className="text-2xl">⏳ →</span>
          <span className="text-sm font-extrabold">{dur}</span>
        </div>
        <ClockFace h={h2} m={m2} size={120} />
      </div>
      <p className="font-mono text-base font-bold text-emerald-300">
        {h1}:{String(m1).padStart(2, '0')} + {dur} = {h2}:{String(m2).padStart(2, '0')}
      </p>
    </div>
  );
}

// Unit ladder: how a big unit relates to small ones.
export function UnitLadder({ big = 'm', small = 'cm', per = 100, n = 2 }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/4 px-5 py-4">
        <span className="font-mono text-2xl font-bold text-cyan-300">1 {big}</span>
        <div className="flex flex-col items-center text-slate-400">
          <span className="text-xs font-extrabold text-emerald-300">× {per}</span>
          <span className="text-2xl">=</span>
        </div>
        <span className="font-mono text-2xl font-bold text-yellow-300">{per} {small}</span>
      </div>
      <motion.p className="font-mono text-lg font-bold text-emerald-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.8 }} style={{ textShadow: '0 0 10px #4ADE8088' }}>
        {n} {big} = {n * per} {small}
      </motion.p>
    </div>
  );
}

// ── geometry reps ────────────────────────────────────────────────────────────

// Regular-polygon vertices on a 0..100 viewBox (flat-bottom for squares).
const polyPts = (n) => {
  const rot = n === 4 ? Math.PI / 4 : -Math.PI / 2;
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * 2 * Math.PI;
    return [50 + 38 * Math.cos(a), 50 + 38 * Math.sin(a)];
  });
};

// Shapes: trace the outline and number each side as you go.
export function ShapeSides({ sides = 4, name = 'square' }) {
  const reduce = useReducedMotion();
  const pts = polyPts(sides);
  return (
    <div className="flex items-center gap-8">
      <svg width={180} height={180} viewBox="0 0 100 100">
        <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="#A78BFA22" stroke="#A78BFA" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((p, i) => {
          const next = pts[(i + 1) % sides];
          const mx = (p[0] + next[0]) / 2;
          const my = (p[1] + next[1]) / 2;
          return (
            <motion.g key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduce ? 0 : 0.4 + i * 0.5, type: 'spring', stiffness: 300 }}>
              <circle cx={mx} cy={my} r="9" fill="#A78BFA" />
              <text x={mx} y={my + 3.2} fontSize="9" fontWeight="bold" fill="#0e1014" textAnchor="middle" fontFamily="JetBrains Mono">{i + 1}</text>
            </motion.g>
          );
        })}
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-mono text-3xl font-bold text-purple-300">{sides}</span>
        <span className="text-xs font-extrabold text-slate-400">sides → {name}</span>
      </div>
    </div>
  );
}

// Symmetry: a dashed fold line; one half folds onto the other.
export function SymmetryFold({ emoji = '🦋' }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 150 }}>
        <span className="text-7xl" style={{ filter: 'drop-shadow(0 0 8px #F472B655)' }}>{emoji}</span>
        <div className="absolute inset-y-0 left-1/2 -ml-px w-0.5" style={{ background: 'repeating-linear-gradient(#4ADE80 0 6px, transparent 6px 12px)' }} />
        {/* right half flips across the line to land on the left, proving the match */}
        <motion.span
          className="absolute text-7xl"
          style={{ left: '50%', transformOrigin: 'left center', clipPath: 'inset(0 0 0 50%)' }}
          initial={{ scaleX: 1 }}
          animate={reduce ? { scaleX: 1 } : { scaleX: [1, -1, -1, 1] }}
          transition={{ duration: 3, times: [0, 0.35, 0.7, 1], repeat: Infinity, repeatDelay: 0.6 }}
        >
          {emoji}
        </motion.span>
      </div>
      <p className="text-sm font-extrabold text-emerald-300">Both halves match — it's symmetric!</p>
    </div>
  );
}

// Angles: an arm sweeps open from the base line to the target degrees.
export function AngleSweep({ deg = 90 }) {
  const reduce = useReducedMotion();
  const a = (-deg * Math.PI) / 180;
  const large = deg > 180 ? 1 : 0;
  const ex = 20 + 60 * Math.cos(a);
  const ey = 70 + 60 * Math.sin(a);
  const tag = deg === 90 ? 'a square corner' : deg === 180 ? 'a straight line' : `${deg}°`;
  return (
    <div className="flex items-center gap-8">
      <svg width={190} height={170} viewBox="0 0 100 90">
        <line x1="20" y1="70" x2="90" y2="70" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <motion.line x1="20" y1="70" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round"
          initial={{ x2: 90, y2: 70 }} animate={{ x2: ex, y2: ey }} transition={{ duration: reduce ? 0 : 1.4, ease: 'easeInOut' }} />
        {deg === 90 && <rect x="20" y="58" width="12" height="12" fill="none" stroke="#FFE066" strokeWidth="1.5" />}
        <path d={`M 42 70 A 22 22 0 ${large} 0 ${20 + 22 * Math.cos(a)} ${70 + 22 * Math.sin(a)}`} fill="none" stroke="#FFE066" strokeWidth="2.5" />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-mono text-3xl font-bold text-cyan-200">{deg}°</span>
        <span className="text-xs font-extrabold text-slate-400">{tag}</span>
      </div>
    </div>
  );
}

// One reusable w×h grid; `mode` highlights the edge (perimeter) or fills (area).
function UnitGrid({ w, h, mode }) {
  const cell = Math.min(30, 200 / Math.max(w, h));
  const edge = (i) => { const r = Math.floor(i / w); const c = i % w; return r === 0 || c === 0 || r === h - 1 || c === w - 1; };
  return (
    <div
      className={`grid ${mode === 'perimeter' ? 'rounded-md ring-2 ring-yellow-300/80 ring-offset-2 ring-offset-[#0e1014]' : ''}`}
      style={{ gridTemplateColumns: `repeat(${w}, ${cell}px)` }}
    >
      {Array.from({ length: w * h }, (_, i) => {
        const lit = mode === 'perimeter' ? edge(i) : true;
        return (
          <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: lit ? 1 : 0.12 }} transition={{ delay: i * 0.04 }}
            className={mode === 'perimeter' && edge(i) ? 'bg-yellow-300/40 border border-yellow-200/50' : 'bg-emerald-400/20 border border-emerald-300/40'}
            style={{ width: cell, height: cell }} />
        );
      })}
    </div>
  );
}

// Perimeter: trace the edge and add up the four sides.
export function PerimeterTrace({ w = 3, h = 2 }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <UnitGrid w={w} h={h} mode="perimeter" />
      <motion.p className="font-mono text-base font-bold text-yellow-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        {w} + {h} + {w} + {h} = {2 * (w + h)}
      </motion.p>
    </div>
  );
}

// Area: fill every square inside; rows × columns.
export function AreaFill({ w = 3, h = 2 }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <UnitGrid w={w} h={h} mode="area" />
      <motion.p className="font-mono text-base font-bold text-emerald-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ textShadow: '0 0 10px #4ADE8088' }}>
        {w} × {h} = {w * h} squares
      </motion.p>
    </div>
  );
}

// Volume: cube layers stack up; (l×w) per layer × height.
export function VolumeLayers({ l = 3, w = 2, h = 2 }) {
  const reduce = useReducedMotion();
  const s = 24;
  return (
    <div className="flex items-center gap-8">
      <div className="relative" style={{ width: l * s + h * 9 + 16, height: w * s + h * 11 + 16 }}>
        {Array.from({ length: h }, (_, layer) => (
          <motion.div key={layer} className="absolute grid"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : layer * 0.6 }}
            style={{ left: layer * 9, bottom: layer * 11, gridTemplateColumns: `repeat(${l}, ${s}px)`, zIndex: layer }}>
            {Array.from({ length: l * w }, (_, i) => (
              <span key={i} className="border border-purple-300/60 bg-purple-400/30" style={{ width: s, height: s, boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.25)' }} />
            ))}
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center">
        <span className="font-mono text-2xl font-bold text-purple-300">{l * w * h}</span>
        <span className="text-xs font-extrabold text-slate-400">{l * w} × {h} cubes</span>
      </div>
    </div>
  );
}

export const INTERACTIVE_HINTS = {
  multable: MulTableHint,
  numberline: NumberLineHint,
};

// Teaching voice line per hint (spoken when the aid opens).
export function hintVoiceKey(hint) {
  if (hint.kind === 'multable') return hint.mode === 'div' ? 'hintdiv-0' : 'hintmul-0';
  if (hint.kind === 'numberline') return 'hintline-0';
  return null;
}
