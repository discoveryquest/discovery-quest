// Boards for the facts wave (Worlds 1–2): dot fields, number cards,
// magic-box equations, base-ten blocks, skip-counting stones.
// Same contract as the long-arithmetic boards: ({ p, board, step }).

import { motion } from 'framer-motion';

const glow = (color, strong) => ({
  color,
  textShadow: strong ? `0 0 14px ${color}cc, 0 0 38px ${color}55` : `0 0 9px ${color}44`,
});

const Pop = ({ children, className, style }) => (
  <motion.span
    initial={{ y: -28, scale: 1.5, opacity: 0 }}
    animate={{ y: 0, scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 340, damping: 22 }}
    className={className}
    style={style}
  >
    {children}
  </motion.span>
);

const AnswerBox = ({ id, val, color, size = 'h-16 w-16 text-4xl', step }) => {
  const targeted = step?.targets?.includes(id);
  return (
    <div data-cell={id} className={`relative flex items-center justify-center rounded-2xl border-2 bg-black/30 font-mono font-bold ${size}`} style={{ borderColor: color + '55' }}>
      {targeted && val === undefined && (
        <motion.div
          className="absolute inset-1 rounded-xl border-2 border-dashed"
          style={{ borderColor: color + '88' }}
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
      )}
      {val !== undefined && <Pop style={glow(color, true)}>{val}</Pop>}
    </div>
  );
};

// ── dots: rows of five, color-banded per row ────────────────────────────────
const DOT_COLORS = ['#FFE066', '#22D3EE', '#A78BFA', '#F472B6', '#4ADE80', '#FB923C'];

function DotsBoard({ p, board, step }) {
  const rows = [];
  for (let i = 0; i < p.n; i += 5) rows.push(Math.min(5, p.n - i));
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col gap-2.5 rounded-3xl border border-white/10 bg-white/4 p-6">
        {rows.map((count, r) => (
          <div key={r} className="flex gap-2.5">
            {Array.from({ length: count }, (_, k) => (
              <motion.span
                key={k}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (r * 5 + k) * 0.04, type: 'spring', stiffness: 300, damping: 15 }}
                className="h-9 w-9 rounded-full"
                style={{ background: DOT_COLORS[r % DOT_COLORS.length], boxShadow: `0 0 10px ${DOT_COLORS[r % DOT_COLORS.length]}66` }}
              />
            ))}
          </div>
        ))}
      </div>
      <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" step={step} />
    </div>
  );
}

// ── pick: two big number cards (compare / even-odd) ─────────────────────────
function PickBoard({ p, board, step }) {
  const answered = board.ans[0];
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-base font-extrabold text-slate-300">{p.pickLabel}</div>
      <div className="flex gap-6">
        {p.vals.map((v, k) => {
          const isAns = answered !== undefined && v === answered;
          return (
            <motion.div
              key={k}
              initial={{ rotate: k ? 4 : -4, y: 16, opacity: 0 }}
              animate={{
                rotate: 0,
                y: 0,
                opacity: answered !== undefined && !isAns ? 0.35 : 1,
                scale: isAns ? 1.12 : 1,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 bg-[#171b28] font-mono text-5xl font-bold"
              style={{
                borderColor: isAns ? '#4ADE80' : '#22D3EE44',
                boxShadow: isAns ? '0 0 30px rgba(74,222,128,0.5)' : '0 0 18px rgba(34,211,238,0.15)',
                ...glow(isAns ? '#4ADE80' : '#22D3EE', true),
              }}
            >
              {v}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── bond / fact: equation with a glowing magic box ──────────────────────────
function EquationBoard({ parts, board, step, color }) {
  const isOp = (part) => /^[+−×÷=]$/.test(part);
  return (
    <div className="flex items-center gap-4 font-mono text-5xl font-bold">
      {parts.map((part, k) =>
        part === '?' ? (
          <AnswerBox key={k} id="ans-0" val={board.ans[0]} color={color} size="h-20 w-20 text-5xl" step={step} />
        ) : (
          <span key={k} className={isOp(part) ? 'text-slate-500' : ''} style={isOp(part) ? undefined : glow(color, true)}>
            {part}
          </span>
        ),
      )}
    </div>
  );
}

const BondBoard = ({ p, board, step }) => (
  <EquationBoard parts={[String(p.a), '+', '?', '=', String(p.target)]} board={board} step={step} color="#FFE066" />
);

const OP_SYM = { add: '+', sub: '−', mul: '×', div: '÷' };
const OP_COLOR = { add: '#4ADE80', sub: '#F472B6', mul: '#A78BFA', div: '#22D3EE' };

const FactBoard = ({ p, board, step }) => (
  <EquationBoard
    parts={[String(p.a), OP_SYM[p.op], String(p.b), '=', '?']}
    board={board}
    step={step}
    color={OP_COLOR[p.op]}
  />
);

// ── multiplication concept: rows × columns dot array ────────────────────────
function ArrayBoard({ p, board, step }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col gap-2.5 rounded-3xl border border-white/10 bg-white/4 p-6">
        {Array.from({ length: p.r }, (_, r) => (
          <div key={r} className="flex gap-2.5">
            {Array.from({ length: p.c }, (_, c) => (
              <motion.span
                key={c}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (r * p.c + c) * 0.03, type: 'spring', stiffness: 300, damping: 15 }}
                className="h-8 w-8 rounded-full"
                style={{ background: '#A78BFA', boxShadow: '0 0 9px #A78BFA66' }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <AnswerBox id="ans-1" val={board.ans[1]} color="#22D3EE" size="h-14 w-14 text-3xl" step={step} />
        <span className="text-sm font-extrabold text-cyan-300">rows</span>
        <span className="font-mono text-2xl text-slate-500">×</span>
        <AnswerBox id="ans-0" val={board.ans[0]} color="#FFE066" size="h-14 w-14 text-3xl" step={step} />
        <span className="text-sm font-extrabold text-yellow-300">each</span>
        <span className="font-mono text-2xl text-slate-500">=</span>
        <AnswerBox id="tot-0" val={board.total[0]} color="#4ADE80" size="h-14 w-20 text-3xl" step={step} />
      </div>
    </div>
  );
}

// ── place value: base-ten blocks ────────────────────────────────────────────
function PVBoard({ p, board, step }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-end gap-6 rounded-3xl border border-white/10 bg-white/4 p-6">
        {p.h > 0 && (
          <div className="flex max-w-[200px] flex-wrap gap-2">
            {Array.from({ length: p.h }, (_, k) => (
              <motion.div
                key={k}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: k * 0.05 }}
                className="grid h-14 w-14 grid-cols-5 gap-px rounded-md border border-purple-300/50 bg-purple-400/20 p-0.5"
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <span key={i} className="rounded-[1px] bg-purple-300/40" />
                ))}
              </motion.div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: p.t }, (_, k) => (
            <motion.div
              key={k}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.2 + k * 0.05 }}
              className="flex h-24 w-5 origin-bottom flex-col gap-px rounded-md border border-cyan-300/50 bg-cyan-400/15 p-0.5"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="flex-1 rounded-[1px] bg-cyan-300/40" />
              ))}
            </motion.div>
          ))}
        </div>
        <div className="flex max-w-[120px] flex-wrap gap-1.5">
          {Array.from({ length: p.o }, (_, k) => (
            <motion.span
              key={k}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + k * 0.05, type: 'spring', stiffness: 300, damping: 14 }}
              className="h-5 w-5 rounded-[3px] border border-yellow-300/60 bg-yellow-300/25"
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {p.h > 0 && (
          <>
            <AnswerBox id="ans-2" val={board.ans[2]} color="#A78BFA" size="h-14 w-14 text-3xl" step={step} />
            <span className="text-sm font-extrabold text-purple-300">hundreds</span>
          </>
        )}
        <AnswerBox id="ans-1" val={board.ans[1]} color="#22D3EE" size="h-14 w-14 text-3xl" step={step} />
        <span className="text-sm font-extrabold text-cyan-300">tens</span>
        <AnswerBox id="ans-0" val={board.ans[0]} color="#FFE066" size="h-14 w-14 text-3xl" step={step} />
        <span className="text-sm font-extrabold text-yellow-300">ones</span>
        <span className="mx-1 font-mono text-2xl text-slate-500">=</span>
        <AnswerBox id="tot-0" val={board.total[0]} color="#4ADE80" size="h-14 w-24 text-3xl" step={step} />
      </div>
    </div>
  );
}

// ── skip counting stones ────────────────────────────────────────────────────
function SkipBoard({ p, board, step }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {p.seq.map((v, k) => (
          <motion.div
            key={k}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: k * 0.12, type: 'spring', stiffness: 260, damping: 16 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-purple-300/40 bg-[#171b28] font-mono text-2xl font-bold"
            style={glow('#A78BFA', true)}
          >
            {v}
          </motion.div>
        ))}
        <span className="font-mono text-2xl text-slate-500">→</span>
        <AnswerBox id="ans-0" val={board.ans[0]} color="#A78BFA" step={step} />
      </div>
      <div className="text-sm font-extrabold text-slate-400">+{p.stepSize} each hop!</div>
    </div>
  );
}

// ── rounding number line ────────────────────────────────────────────────────
function NumberLineBoard({ p, board, step }) {
  const frac = (p.v - p.lo) / p.unit;
  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative w-[420px] max-w-full px-2 pt-12">
        {/* the wandering number, perched where it lives on the line */}
        <motion.div
          className="absolute -top-0 -translate-x-1/2 text-center"
          style={{ left: `calc(${frac * 100}% )` }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          <div className="rounded-xl border-2 border-yellow-300/60 bg-[#171b28] px-3 py-1 font-mono text-2xl font-bold" style={glow('#FFE066', true)}>
            {p.v}
          </div>
          <div className="mx-auto h-3 w-0.5 bg-yellow-300/60" />
        </motion.div>
        <div className="relative mt-10 h-1.5 rounded-full bg-slate-600">
          {Array.from({ length: 11 }, (_, k) => (
            <span
              key={k}
              className={`absolute top-1/2 w-0.5 -translate-y-1/2 rounded ${k === 0 || k === 10 ? 'h-5 bg-cyan-300' : k === 5 ? 'h-4 bg-slate-400' : 'h-2.5 bg-slate-500'}`}
              style={{ left: `${k * 10}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between font-mono text-2xl font-bold">
          <span style={glow('#22D3EE', true)}>{p.lo}</span>
          <span style={glow('#22D3EE', true)}>{p.hi}</span>
        </div>
      </div>
      <AnswerBox id="ans-0" val={board.ans[0]} color="#22D3EE" size="h-16 w-32 text-3xl" step={step} />
    </div>
  );
}

// ── story problem card ──────────────────────────────────────────────────────
function StoryBoard({ p, board, step }) {
  return (
    <div className="flex max-w-[440px] flex-col items-center gap-6">
      <motion.div
        initial={{ rotate: -1.5, y: 14, opacity: 0 }}
        animate={{ rotate: 0, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="rounded-3xl border-2 border-emerald-300/30 bg-[#171b28] p-6 text-center shadow-[0_0_30px_rgba(74,222,128,0.12)]"
      >
        <div className="mb-3 text-4xl tracking-widest">{p.emoji} {p.emoji} {p.emoji}</div>
        <p className="text-xl font-bold leading-relaxed text-slate-100">{p.text}</p>
      </motion.div>
      <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-16 w-24 text-3xl" step={step} />
    </div>
  );
}

// ── fraction pies ───────────────────────────────────────────────────────────
// SVG pie cut into n equal sectors, the first k shaded.
export function Pie({ n, k, size = 130, color = '#4ADE80', delay = 0 }) {
  const R = 48;
  const cx = 50;
  const cy = 50;
  const sectors = Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const large = 1 / n > 0.5 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} A ${R} ${R} 0 ${large} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`;
    return { d, shaded: i < k };
  });
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ delay, type: 'spring', stiffness: 240, damping: 18 }}
    >
      {n === 1 ? (
        <circle cx={cx} cy={cy} r={R} fill={k >= 1 ? color + '66' : 'transparent'} stroke="#94a3b8" strokeWidth="2.5" />
      ) : (
        sectors.map((s, i) => (
          <motion.path
            key={i}
            d={s.d}
            fill={s.shaded ? color + '66' : 'transparent'}
            stroke="#94a3b8"
            strokeWidth="2"
            initial={s.shaded ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.25 + i * 0.06 }}
          />
        ))
      )}
    </motion.svg>
  );
}

export const FracLabel = ({ top, bottom, color = '#4ADE80' }) => (
  <div className="flex flex-col items-center font-mono text-2xl font-bold" style={glow(color, true)}>
    <span>{top}</span>
    <span className="my-0.5 h-[3px] w-9 rounded-full bg-slate-400" />
    <span>{bottom}</span>
  </div>
);

// concept: one pie, then numerator/denominator slots fill in
function PieBoard({ p, board, step }) {
  return (
    <div className="flex items-center gap-10">
      <Pie n={p.n} k={p.k} size={170} />
      <div className="flex flex-col items-center gap-1.5">
        <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-14 w-14 text-3xl" step={step} />
        <span className="h-[4px] w-16 rounded-full bg-slate-400" />
        <AnswerBox id="ans-1" val={board.ans[1]} color="#22D3EE" size="h-14 w-14 text-3xl" step={step} />
      </div>
    </div>
  );
}

// equivalent: known pie = finer pie whose shading appears on solve
function FracEquivBoard({ p, board, step }) {
  const solved = board.ans[0] !== undefined;
  return (
    <div className="flex items-center gap-7">
      <div className="flex flex-col items-center gap-2">
        <Pie n={p.b} k={p.a} color="#A78BFA" />
        <FracLabel top={p.a} bottom={p.b} color="#A78BFA" />
      </div>
      <span className="font-mono text-4xl text-slate-500">=</span>
      <div className="flex flex-col items-center gap-2">
        <Pie n={p.B} k={solved ? p.A : 0} delay={0.2} />
        <div className="flex flex-col items-center gap-1">
          <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-12 w-12 text-2xl" step={step} />
          <span className="h-[3px] w-12 rounded-full bg-slate-400" />
          <span className="font-mono text-2xl font-bold" style={glow('#22D3EE', true)}>{p.B}</span>
        </div>
      </div>
    </div>
  );
}

// compare: two numbered pie cards, answer is 1 or 2
function FracPickBoard({ p, board, step }) {
  const answered = board.ans[0];
  return (
    <div className="flex gap-8">
      {p.fracs.map((f, i) => {
        const idx = i + 1;
        const isAns = answered !== undefined && idx === p.winner;
        const dimmed = answered !== undefined && idx !== p.winner;
        return (
          <motion.div
            key={idx}
            animate={{ opacity: dimmed ? 0.35 : 1, scale: isAns ? 1.08 : 1 }}
            className="flex flex-col items-center gap-2 rounded-3xl border-2 p-5"
            style={{
              borderColor: isAns ? '#4ADE80' : '#22D3EE44',
              boxShadow: isAns ? '0 0 30px rgba(74,222,128,0.4)' : undefined,
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 font-mono text-xl font-bold text-slate-200">
              {idx}
            </span>
            <Pie n={f.n} k={f.k} size={120} color={idx === 1 ? '#FFE066' : '#F472B6'} delay={i * 0.15} />
            <FracLabel top={f.k} bottom={f.n} color={idx === 1 ? '#FFE066' : '#F472B6'} />
          </motion.div>
        );
      })}
    </div>
  );
}

// add/sub like denominators: pie + pie = pie with the result shading in
function FracAddBoard({ p, board, step }) {
  const solved = board.ans[0] !== undefined;
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1.5">
        <Pie n={p.n} k={p.a} size={110} color="#4ADE80" />
        <FracLabel top={p.a} bottom={p.n} />
      </div>
      <span className="font-mono text-4xl text-slate-500">{p.sub ? '−' : '+'}</span>
      <div className="flex flex-col items-center gap-1.5">
        <Pie n={p.n} k={p.b} size={110} color="#22D3EE" delay={0.15} />
        <FracLabel top={p.b} bottom={p.n} color="#22D3EE" />
      </div>
      <span className="font-mono text-4xl text-slate-500">=</span>
      <div className="flex flex-col items-center gap-1.5">
        <Pie n={p.n} k={solved ? p.res : 0} size={110} color="#FFE066" delay={0.3} />
        <div className="flex flex-col items-center gap-1">
          <AnswerBox id="ans-0" val={board.ans[0]} color="#FFE066" size="h-11 w-11 text-2xl" step={step} />
          <span className="h-[3px] w-11 rounded-full bg-slate-400" />
          <span className="font-mono text-2xl font-bold" style={glow('#FFE066', true)}>{p.n}</span>
        </div>
      </div>
    </div>
  );
}

// unlike denominators: convert first, then add — two slots tell the story
function FracUnlikeBoard({ p, board, step }) {
  const converted = board.ans[1] !== undefined;
  const solved = board.ans[0] !== undefined;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <Pie n={p.b} k={p.a} size={104} color="#A78BFA" />
          <FracLabel top={p.a} bottom={p.b} color="#A78BFA" />
        </div>
        <span className="font-mono text-3xl text-slate-500">+</span>
        <div className="flex flex-col items-center gap-1.5">
          <Pie n={p.d} k={p.c} size={104} color="#22D3EE" delay={0.15} />
          <FracLabel top={p.c} bottom={p.d} color="#22D3EE" />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-5 py-3">
        <FracLabel top={p.a} bottom={p.b} color="#A78BFA" />
        <span className="font-mono text-2xl text-slate-500">=</span>
        <div className="flex flex-col items-center gap-1">
          <AnswerBox id="ans-1" val={board.ans[1]} color="#A78BFA" size="h-10 w-10 text-xl" step={step} />
          <span className="h-[3px] w-10 rounded-full bg-slate-400" />
          <span className="font-mono text-xl font-bold" style={glow('#22D3EE', true)}>{p.d}</span>
        </div>
        {converted && (
          <>
            <span className="font-mono text-2xl text-slate-500">+</span>
            <FracLabel top={p.c} bottom={p.d} color="#22D3EE" />
            <span className="font-mono text-2xl text-slate-500">=</span>
            <div className="flex flex-col items-center gap-1">
              <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-10 w-10 text-xl" step={step} />
              <span className="h-[3px] w-10 rounded-full bg-slate-400" />
              <span className="font-mono text-xl font-bold" style={glow('#4ADE80', true)}>{p.d}</span>
            </div>
          </>
        )}
      </div>
      {solved && <Pie n={p.d} k={p.sum} size={104} color="#4ADE80" />}
    </div>
  );
}

// mixed numbers: slices snap into whole pies + a leftover pie
function FracMixedBoard({ p, board, step }) {
  const wholes = board.ans[1];
  const left = board.ans[0];
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3 font-mono text-3xl font-bold">
        <FracLabel top={p.p} bottom={p.n} color="#FFE066" />
        <span className="text-slate-500">=</span>
        <AnswerBox id="ans-1" val={wholes} color="#FFE066" size="h-14 w-14 text-3xl" step={step} />
        <span className="text-base font-extrabold text-yellow-200">whole pies</span>
        <span className="text-slate-500">+</span>
        <div className="flex flex-col items-center gap-1">
          <AnswerBox id="ans-0" val={left} color="#F472B6" size="h-11 w-11 text-2xl" step={step} />
          <span className="h-[3px] w-11 rounded-full bg-slate-400" />
          <span className="font-mono text-2xl font-bold" style={glow('#F472B6', true)}>{p.n}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {wholes !== undefined &&
          Array.from({ length: p.w }, (_, i) => <Pie key={i} n={p.n} k={p.n} size={92} color="#FFE066" delay={i * 0.15} />)}
        {left !== undefined && <Pie n={p.n} k={p.r} size={92} color="#F472B6" delay={0.2} />}
      </div>
    </div>
  );
}

// fraction × whole: m copies of the same pie, result fills (maybe past a whole)
function FracMulBoard({ p, board, step }) {
  const solved = board.ans[0] !== undefined;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <span className="font-mono text-4xl font-bold" style={glow('#22D3EE', true)}>{p.m} ×</span>
        <div className="flex gap-2">
          {Array.from({ length: p.m }, (_, i) => (
            <Pie key={i} n={p.n} k={p.k} size={76} color="#22D3EE" delay={i * 0.12} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-3xl text-slate-500">=</span>
        <div className="flex flex-col items-center gap-1">
          <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-12 w-12 text-2xl" step={step} />
          <span className="h-[3px] w-12 rounded-full bg-slate-400" />
          <span className="font-mono text-2xl font-bold" style={glow('#4ADE80', true)}>{p.n}</span>
        </div>
        {solved && (
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(p.res / p.n) }, (_, i) => (
              <Pie key={i} n={p.n} k={Math.min(p.n, p.res - i * p.n)} size={88} color="#4ADE80" delay={i * 0.15} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── decimal boards ──────────────────────────────────────────────────────────
const DEC_COLORS = { tens: '#22D3EE', ones: '#FFE066', tenths: '#FB923C', hundredths: '#F472B6' };

// big decimal with color-coded digits; slots fill as places are named
function DecPlaceBoard({ p, board, step }) {
  const digitSpan = (d, color, key) => (
    <span key={key} className="font-mono text-6xl font-bold" style={glow(color, true)}>{d}</span>
  );
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end gap-1 rounded-3xl border border-white/10 bg-white/4 px-7 py-5">
        {p.tens ? digitSpan(p.tens, DEC_COLORS.tens, 't') : null}
        {digitSpan(p.ones, DEC_COLORS.ones, 'o')}
        <span className="font-mono text-6xl font-bold text-slate-300">.</span>
        {digitSpan(p.tenths, DEC_COLORS.tenths, 'd')}
        {p.hundredths !== null && digitSpan(p.hundredths, DEC_COLORS.hundredths, 'h')}
      </div>
      <div className="flex items-center gap-4">
        {p.tens || step?.targets?.includes('ans-2') || board.ans[2] !== undefined ? (
          <>
            <AnswerBox id="ans-2" val={board.ans[2]} color={DEC_COLORS.ones} size="h-13 w-13 text-2xl h-12 w-12" step={step} />
            <span className="text-xs font-extrabold" style={{ color: DEC_COLORS.ones }}>ones</span>
          </>
        ) : null}
        <AnswerBox id="ans-1" val={board.ans[1]} color={DEC_COLORS.tenths} size="h-12 w-12 text-2xl" step={step} />
        <span className="text-xs font-extrabold" style={{ color: DEC_COLORS.tenths }}>tenths</span>
        {p.hundredths !== null && (
          <>
            <AnswerBox id="ans-0" val={board.ans[0]} color={DEC_COLORS.hundredths} size="h-12 w-12 text-2xl" step={step} />
            <span className="text-xs font-extrabold" style={{ color: DEC_COLORS.hundredths }}>hundredths</span>
          </>
        )}
      </div>
    </div>
  );
}

// two decimal cards, type 1 or 2
function DecPickBoard({ p, board }) {
  const answered = board.ans[0];
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-base font-extrabold text-slate-300">{p.pickLabel}</div>
      <div className="flex gap-7">
        {p.vals.map((v, i) => {
          const idx = i + 1;
          const isAns = answered !== undefined && idx === p.winner;
          const dim = answered !== undefined && !isAns;
          return (
            <motion.div
              key={idx}
              initial={{ y: 16, opacity: 0, rotate: i ? 3 : -3 }}
              animate={{ y: 0, opacity: dim ? 0.35 : 1, rotate: 0, scale: isAns ? 1.1 : 1 }}
              className="flex flex-col items-center gap-2 rounded-3xl border-2 px-8 py-6"
              style={{
                borderColor: isAns ? '#4ADE80' : '#22D3EE44',
                boxShadow: isAns ? '0 0 30px rgba(74,222,128,0.4)' : undefined,
              }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-mono text-lg font-bold text-slate-200">
                {idx}
              </span>
              <span className="font-mono text-5xl font-bold" style={glow(isAns ? '#4ADE80' : '#22D3EE', true)}>{v}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// the point hops: before number, animated arrow hops, answer box
function DecHopBoard({ p, board, step }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4 font-mono text-5xl font-bold">
        <span style={glow('#FB923C', true)}>{p.from}</span>
        <span className="text-slate-500">{p.dir}</span>
        <span style={glow('#22D3EE', true)}>{p.factor}</span>
      </div>
      <motion.div
        className="flex items-center gap-1 text-cyan-300"
        animate={{ x: p.dir === '×' ? [0, 14, 0] : [0, -14, 0] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      >
        <span className="text-3xl">.</span>
        {Array.from({ length: p.hops }, (_, i) => (
          <span key={i} className="text-2xl">{p.dir === '×' ? '↷' : '↶'}</span>
        ))}
        <span className="text-sm font-extrabold">{p.hops} hop{p.hops > 1 ? 's' : ''} {p.dir === '×' ? 'right!' : 'left!'}</span>
      </motion.div>
      <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-16 w-32 text-3xl" step={step} />
    </div>
  );
}

// fraction card = 0.[slot][slot]
function DecConvBoard({ p, board, step }) {
  const L = p.digits.length;
  return (
    <div className="flex items-center gap-5">
      <FracLabel top={p.a} bottom={p.b} color="#A78BFA" />
      <span className="font-mono text-4xl text-slate-500">=</span>
      <div className="flex items-end gap-1.5">
        <span className="font-mono text-5xl font-bold text-slate-200">0.</span>
        {Array.from({ length: L }, (_, i) => {
          const col = L - 1 - i;
          return <AnswerBox key={col} id={`ans-${col}`} val={board.ans[col]} color={i === 0 ? '#FB923C' : '#F472B6'} size="h-14 w-12 text-3xl" step={step} />;
        })}
      </div>
    </div>
  );
}

// ── measure boards ──────────────────────────────────────────────────────────
const COIN_STYLE = {
  1: { size: 44, bg: '#8d8d96', label: '1¢' },
  5: { size: 52, bg: '#b08d57', label: '5¢' },
  10: { size: 48, bg: '#9fb4c7', label: '10¢' },
  25: { size: 58, bg: '#d4af37', label: '25¢' },
  100: { size: 64, bg: '#e7cf6b', label: '100¢' },
};

export function Coin({ v, delay = 0 }) {
  const c = COIN_STYLE[v];
  return (
    <motion.div
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 15 }}
      className="flex items-center justify-center rounded-full border-4 font-mono font-bold text-slate-900"
      style={{
        width: c.size,
        height: c.size,
        background: `radial-gradient(circle at 35% 30%, ${c.bg}, ${c.bg}88)`,
        borderColor: c.bg,
        boxShadow: `0 0 12px ${c.bg}66`,
        fontSize: c.size / 3.6,
      }}
    >
      {c.label}
    </motion.div>
  );
}

function CoinsBoard({ p, board, step }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {p.mode === 'change' ? (
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-6 py-4">
            <span className="text-4xl">🧸</span>
            <span className="font-mono text-2xl font-bold" style={glow('#F472B6', true)}>{p.price}¢</span>
          </div>
          <span className="text-2xl text-slate-500">you pay</span>
          <Coin v={100} />
        </div>
      ) : (
        <div className="flex max-w-[420px] flex-wrap items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/4 p-6">
          {p.coins.map((v, i) => (
            <Coin key={i} v={v} delay={i * 0.08} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <AnswerBox id="ans-0" val={board.ans[0]} color="#FFE066" size="h-14 w-24 text-3xl" step={step} />
        <span className="font-mono text-2xl font-bold text-yellow-200">¢</span>
      </div>
    </div>
  );
}

export function ClockFace({ h, m, size = 180, ghost = false }) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = m * 6;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: ghost ? 0.45 : 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
    >
      <circle cx="50" cy="50" r="46" fill="#171b28" stroke="#22D3EE" strokeWidth="2.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 - 90) * (Math.PI / 180);
        return (
          <text key={i} x={50 + 38 * Math.cos(a)} y={50 + 38 * Math.sin(a) + 3.2} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#cbd5e1" fontFamily="JetBrains Mono">
            {i + 1}
          </text>
        );
      })}
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 - 90) * (Math.PI / 180);
        const r1 = i % 5 === 0 ? 43 : 45;
        return <line key={i} x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)} x2={50 + 46 * Math.cos(a)} y2={50 + 46 * Math.sin(a)} stroke="#475569" strokeWidth={i % 5 === 0 ? 1.4 : 0.6} />;
      })}
      <motion.line x1="50" y1="50" x2={50 + 20 * Math.cos((hourAngle - 90) * (Math.PI / 180))} y2={50 + 20 * Math.sin((hourAngle - 90) * (Math.PI / 180))} stroke="#FFE066" strokeWidth="4.5" strokeLinecap="round" />
      <motion.line x1="50" y1="50" x2={50 + 31 * Math.cos((minAngle - 90) * (Math.PI / 180))} y2={50 + 31 * Math.sin((minAngle - 90) * (Math.PI / 180))} stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="50" r="2.6" fill="#e2e8f0" />
    </motion.svg>
  );
}

const TimeSlots = ({ board, step }) => (
  <div className="flex items-center gap-1.5 font-mono text-3xl font-bold text-slate-400">
    <AnswerBox id="ans-1" val={board.ans[1]} color="#FFE066" size="h-14 w-16 text-3xl" step={step} />
    <span>:</span>
    <AnswerBox id="ans-0" val={board.ans[0] !== undefined ? String(board.ans[0]).padStart(2, '0') : undefined} color="#F472B6" size="h-14 w-16 text-3xl" step={step} />
  </div>
);

function ClockBoard({ p, board, step }) {
  return (
    <div className="flex items-center gap-10">
      <ClockFace h={p.h} m={p.m} />
      <TimeSlots board={board} step={step} />
    </div>
  );
}

function ElapsedBoard({ p, board, step }) {
  const done = board.ans[0] !== undefined && board.ans[1] !== undefined;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-5">
        <ClockFace h={p.h1} m={p.m1} size={140} />
        <motion.div animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} className="flex flex-col items-center text-cyan-300">
          <span className="text-2xl">⏳ →</span>
          <span className="text-sm font-extrabold">{p.durText}</span>
        </motion.div>
        <ClockFace h={p.h2} m={p.m2} size={140} ghost={!done} />
      </div>
      <TimeSlots board={board} step={step} />
    </div>
  );
}

function ConvertBoard({ p, board, step }) {
  return (
    <div className="flex items-center gap-4 font-mono text-4xl font-bold">
      <span style={glow('#A78BFA', true)}>{p.n}</span>
      <span className="text-2xl text-slate-400">{p.from}</span>
      <span className="text-slate-500">=</span>
      <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-16 w-28 text-3xl" step={step} />
      <span className="text-2xl text-slate-400">{p.to}</span>
    </div>
  );
}

// ── geometry boards ─────────────────────────────────────────────────────────
const polyPoints = (n, stretch = false) => {
  const rx = stretch ? 42 : 36;
  const ry = stretch ? 26 : 36;
  const rot = n === 4 ? Math.PI / 4 : -Math.PI / 2;
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * 2 * Math.PI;
    return `${50 + rx * Math.cos(a)},${50 + ry * Math.sin(a)}`;
  }).join(' ');
};

function ShapeBoard({ p, board, step }) {
  return (
    <div className="flex items-center gap-10">
      <motion.svg width={190} height={190} viewBox="0 0 100 100" initial={{ scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
        <polygon points={polyPoints(p.sides, p.stretch)} fill="#A78BFA33" stroke="#A78BFA" strokeWidth="2.5" strokeLinejoin="round" />
      </motion.svg>
      <div className="flex flex-col items-center gap-2">
        <AnswerBox id="ans-0" val={board.ans[0]} color="#A78BFA" size="h-16 w-16 text-4xl" step={step} />
        <span className="text-sm font-extrabold text-slate-400">sides</span>
      </div>
    </div>
  );
}

function SymPickBoard({ p, board }) {
  const answered = board.ans[0];
  return (
    <div className="flex gap-8">
      {p.shapes.map((sh, i) => {
        const idx = i + 1;
        const isAns = answered !== undefined && idx === p.winner;
        return (
          <motion.div
            key={idx}
            initial={{ y: 16, opacity: 0, rotate: i ? 3 : -3 }}
            animate={{ y: 0, opacity: answered !== undefined && !isAns ? 0.35 : 1, rotate: 0, scale: isAns ? 1.08 : 1 }}
            className="flex flex-col items-center gap-1 rounded-3xl border-2 p-4"
            style={{ borderColor: isAns ? '#4ADE80' : '#F472B644', boxShadow: isAns ? '0 0 28px rgba(74,222,128,0.4)' : undefined }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-mono text-lg font-bold text-slate-200">{idx}</span>
            <svg width={130} height={130} viewBox="0 0 100 100">
              <path d={sh.d} fill="#F472B633" stroke="#F472B6" strokeWidth="2.5" strokeLinejoin="round" />
              {isAns && <line x1="50" y1="4" x2="50" y2="96" stroke="#4ADE80" strokeWidth="2" strokeDasharray="4 4" />}
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}

function AngleBoard({ p, board, step }) {
  const sweep = p.mode === 'right' ? 90 : p.mode === 'straight' ? 180 : p.mode === 'full' ? 359.9 : p.shown;
  const a1 = (-sweep * Math.PI) / 180;
  const largeArc = sweep > 180 ? 1 : 0;
  return (
    <div className="flex items-center gap-10">
      <motion.svg width={190} height={170} viewBox="0 0 100 90" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <line x1="20" y1="70" x2="90" y2="70" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="70" x2={20 + 60 * Math.cos(a1)} y2={70 + 60 * Math.sin(a1)} stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${20 + 22 * 1} 70 A 22 22 0 ${largeArc} 0 ${20 + 22 * Math.cos(a1)} ${70 + 22 * Math.sin(a1)}`} fill="none" stroke="#FFE066" strokeWidth="2.5" />
        {p.mode === 'line' && (
          <text x={20 + 34 * Math.cos(a1 / 2)} y={70 + 30 * Math.sin(a1 / 2)} fontSize="9" fontWeight="bold" fill="#FFE066" fontFamily="JetBrains Mono" textAnchor="middle">
            {p.shown}°
          </text>
        )}
      </motion.svg>
      <div className="flex items-center gap-2">
        <AnswerBox id="ans-0" val={board.ans[0]} color="#22D3EE" size="h-16 w-24 text-3xl" step={step} />
        <span className="font-mono text-2xl font-bold text-cyan-200">°</span>
      </div>
    </div>
  );
}

function RectGridBoard({ p, board, step }) {
  const cell = Math.min(34, 230 / Math.max(p.w, p.h));
  return (
    <div className="flex items-center gap-9">
      <div className="flex flex-col items-center gap-1.5">
        <span className="font-mono text-lg font-bold text-cyan-300">{p.w}</span>
        <div className="flex items-center gap-1.5">
          <div
            className={`grid ${p.mode === 'perimeter' ? 'rounded-md ring-2 ring-yellow-300/80 ring-offset-2 ring-offset-[#0e1014]' : ''}`}
            style={{ gridTemplateColumns: `repeat(${p.w}, ${cell}px)` }}
          >
            {Array.from({ length: p.w * p.h }, (_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                className="border border-emerald-300/40 bg-emerald-400/15"
                style={{ width: cell, height: cell }}
              />
            ))}
          </div>
          <span className="font-mono text-lg font-bold text-pink-300">{p.h}</span>
        </div>
      </div>
      <AnswerBox id="ans-0" val={board.ans[0]} color={p.mode === 'perimeter' ? '#FFE066' : '#4ADE80'} size="h-16 w-24 text-3xl" step={step} />
    </div>
  );
}

function CubesBoard({ p, board, step }) {
  const s = 26;
  return (
    <div className="flex items-center gap-10">
      <div className="relative" style={{ width: p.l * s + p.h * 10 + 20, height: p.w * s + p.h * 12 + 20 }}>
        {Array.from({ length: p.h }, (_, layer) => (
          <motion.div
            key={layer}
            className="absolute grid"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: layer * 0.25 }}
            style={{
              left: layer * 9,
              bottom: layer * 11,
              gridTemplateColumns: `repeat(${p.l}, ${s}px)`,
              zIndex: layer,
            }}
          >
            {Array.from({ length: p.l * p.w }, (_, i) => (
              <span key={i} className="border border-purple-300/60 bg-purple-400/30" style={{ width: s, height: s, boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.25)' }} />
            ))}
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        {p.h > 1 && (
          <div className="flex items-center gap-2">
            <AnswerBox id="ans-1" val={board.ans[1]} color="#FFE066" size="h-12 w-16 text-2xl" step={step} />
            <span className="text-xs font-extrabold text-yellow-200">per layer</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <AnswerBox id="ans-0" val={board.ans[0]} color="#A78BFA" size="h-14 w-20 text-3xl" step={step} />
          <span className="text-xs font-extrabold text-purple-300">cubes</span>
        </div>
      </div>
    </div>
  );
}

// two-step story: card + labeled intermediate and final slots
function Story2Board({ p, board, step }) {
  return (
    <div className="flex max-w-[460px] flex-col items-center gap-5">
      <motion.div
        initial={{ rotate: -1.5, y: 14, opacity: 0 }}
        animate={{ rotate: 0, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="rounded-3xl border-2 border-orange-300/30 bg-[#171b28] p-6 text-center shadow-[0_0_30px_rgba(251,146,60,0.12)]"
      >
        <div className="mb-3 text-4xl tracking-widest">{p.emoji} {p.emoji} {p.emoji}</div>
        <p className="text-xl font-bold leading-relaxed text-slate-100">{p.text}</p>
      </motion.div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <AnswerBox id="ans-1" val={board.ans[1]} color="#FB923C" size="h-14 w-20 text-2xl" step={step} />
          <span className="text-xs font-extrabold text-orange-300">{p.slotLabels[0]}</span>
        </div>
        <span className="font-mono text-2xl text-slate-500">→</span>
        <div className="flex flex-col items-center gap-1">
          <AnswerBox id="ans-0" val={board.ans[0]} color="#4ADE80" size="h-14 w-20 text-2xl" step={step} />
          <span className="text-xs font-extrabold text-emerald-300">{p.slotLabels[1]}</span>
        </div>
      </div>
    </div>
  );
}

export const FACT_BOARDS = {
  dots: DotsBoard,
  pick: PickBoard,
  bond: BondBoard,
  fact: FactBoard,
  pv: PVBoard,
  skip: SkipBoard,
  array: ArrayBoard,
  numberline: NumberLineBoard,
  story: StoryBoard,
  pie: PieBoard,
  fracequiv: FracEquivBoard,
  fracpick: FracPickBoard,
  fracadd: FracAddBoard,
  fracunlike: FracUnlikeBoard,
  fracmixed: FracMixedBoard,
  fracmul: FracMulBoard,
  decplace: DecPlaceBoard,
  decpick: DecPickBoard,
  dechop: DecHopBoard,
  decconv: DecConvBoard,
  coins: CoinsBoard,
  clock: ClockBoard,
  elapsed: ElapsedBoard,
  convert: ConvertBoard,
  shape: ShapeBoard,
  sympick: SymPickBoard,
  angle: AngleBoard,
  rectgrid: RectGridBoard,
  cubes: CubesBoard,
  story2: Story2Board,
};
