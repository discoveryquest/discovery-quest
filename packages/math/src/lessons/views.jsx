// Shared rendering for lesson beats. A beat's `view` is { kind, key?, ...props };
// renderLessonView dispatches kind → a visual. Most kinds reuse the existing
// interactive-hint components (prop-driven, already animated & reviewed) so each
// lesson is a UNIQUE warm script over shared building blocks. A few teaching-only
// primitives (CountObjects, CompareMouth, ColumnGrid, StoryWords, TableRow) live here.

import { motion, AnimatePresence } from 'framer-motion';
import {
  MulTableHint, RepeatedAddition, ArrayModel, NumberLineHint,
  TenFrame, CombineBlocks, TakeAwayBlocks, ShareGroups, BaseTenBlocks,
  CompareCards, EvenOddDots, SkipHops,
  FractionPieBar, FractionBar, EquivFractions, CompareFractions, AddFractions,
  RoundingLine, DecimalGrid, CompareDecimals, AddDecimals, DecimalHop,
  CoinTray, ClockRead, ElapsedClocks, UnitLadder,
  ShapeSides, SymmetryFold, AngleSweep, PerimeterTrace, AreaFill, VolumeLayers,
} from '../interactiveHints.jsx';

// ── a row of countable objects; counted-so-far light up one by one ──
export function CountObjects({ emoji = '🍎', n = 5, highlight = -1, numeral = null }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-end justify-center gap-3">
        {Array.from({ length: n }, (_, i) => {
          const counted = highlight >= 0 && i <= highlight;
          const active = i === highlight;
          const dim = highlight >= 0 && i > highlight;
          return (
            <div key={i} className="relative flex flex-col items-center">
              <AnimatePresence>
                {active && numeral == null && (
                  <motion.span
                    key="num"
                    initial={{ opacity: 0, y: 8, scale: 0.4 }}
                    animate={{ opacity: 1, y: -6, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-8 font-mono text-2xl font-extrabold text-cyan-300"
                    style={{ textShadow: '0 0 10px #22d3ee99' }}
                  >
                    {i + 1}
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.span
                className="text-5xl"
                animate={{ scale: active ? [1, 1.35, 1.12] : 1, opacity: dim ? 0.4 : 1, y: active ? -4 : 0 }}
                transition={{ duration: 0.4 }}
                style={{ filter: counted ? 'drop-shadow(0 0 10px rgba(34,211,238,0.55))' : 'none' }}
              >
                {emoji}
              </motion.span>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {numeral != null && (
          <motion.div
            key="total"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="font-mono text-6xl font-extrabold text-yellow-300"
            style={{ textShadow: '0 0 20px #FFE06699' }}
          >
            {numeral}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── compare two amounts; the < > = sign is a "hungry mouth" that eats the bigger ──
export function CompareMouth({ emoji = '🍪', left = 3, right = 5, sign = null }) {
  const Group = ({ n, lit }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: n }, (_, i) => (
          <motion.span
            key={i}
            className="text-3xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            style={{ filter: lit ? 'drop-shadow(0 0 8px rgba(255,224,102,0.7))' : 'none' }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
      <span className="font-mono text-3xl font-extrabold text-white">{n}</span>
    </div>
  );
  const bigger = left > right ? 'L' : right > left ? 'R' : null;
  return (
    <div className="flex items-center justify-center gap-5">
      <Group n={left} lit={bigger === 'L'} />
      <div className="flex h-16 w-12 items-center justify-center">
        <AnimatePresence mode="wait">
          {sign && (
            <motion.span
              key={sign}
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-6xl font-black text-cyan-300"
              style={{ textShadow: '0 0 16px #22d3eecc' }}
            >
              {sign}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <Group n={right} lit={bigger === 'R'} />
    </div>
  );
}

// ── vertical column arithmetic (long add/sub/mul). Author sets each beat's state ──
// top/bottom: numbers; op: '+'|'−'|'×'; result: string of digits with spaces for blanks;
// carry: { colFromRight: 'd' } shown above; active: colFromRight to highlight; note: borrow.
export function ColumnGrid({ top, bottom, op = '+', result = '', carry = {}, active = null }) {
  const width = Math.max(String(top).length, String(bottom).length, result.length) + 1;
  const cols = Array.from({ length: width }, (_, i) => width - 1 - i); // left→right place index
  const digitAt = (numStr, col) => {
    const s = String(numStr);
    const idx = s.length - 1 - col;
    return idx >= 0 ? s[idx] : '';
  };
  const Cell = ({ ch, cls = '', lit = false }) => (
    <div
      className={`flex h-10 w-9 items-center justify-center font-mono text-3xl font-extrabold ${cls}`}
      style={lit ? { background: 'rgba(34,211,238,0.18)', borderRadius: 8 } : undefined}
    >
      {ch}
    </div>
  );
  return (
    <div className="inline-flex flex-col items-end">
      {/* carry row */}
      <div className="flex">
        {cols.map((c) => (
          <Cell key={c} ch={carry[c] || ''} cls="h-6 text-base text-pink-300" />
        ))}
      </div>
      {/* top */}
      <div className="flex">{cols.map((c) => <Cell key={c} ch={digitAt(top, c)} lit={active === c} />)}</div>
      {/* bottom with operator on the far left */}
      <div className="flex items-center">
        <span className="mr-1 font-mono text-3xl font-extrabold text-cyan-300">{op}</span>
        {cols.slice(1).map((c) => <Cell key={c} ch={digitAt(bottom, c)} lit={active === c} />)}
      </div>
      <div className="my-1 h-[3px] w-full rounded bg-white/40" />
      {/* result */}
      <div className="flex">
        {cols.map((c) => {
          const ch = digitAt(result.replace(/ /g, '_'), c);
          return <Cell key={c} ch={ch === '_' ? '' : ch} lit={active === c} cls="text-yellow-300" />;
        })}
      </div>
    </div>
  );
}

// ── a story sentence; words reveal as Luna reads; numbers + action words stay colored ──
export function StoryWords({ words = [], revealed = 0 }) {
  return (
    <p className="max-w-[380px] text-center text-lg font-bold leading-relaxed">
      {words.map((w, i) => {
        const shown = i < revealed;
        const active = i === revealed - 1;
        const color = w.kind === 'num' ? '#22d3ee' : w.kind === 'add' ? '#4ade80' : w.kind === 'sub' ? '#fb923c' : '#cbd5e1';
        return (
          <motion.span
            key={i}
            animate={{ opacity: shown ? 1 : 0.18, scale: active ? 1.12 : 1 }}
            transition={{ duration: 0.25 }}
            className="mx-0.5 inline-block"
            style={{ color, textShadow: w.kind && shown ? `0 0 10px ${color}88` : 'none', fontWeight: w.kind ? 800 : 700 }}
          >
            {w.t}
          </motion.span>
        );
      })}
    </p>
  );
}

// ── the times table for n, revealing one fact at a time (skip-counting) ──
export function TableRow({ n = 2, reveal = 0 }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {Array.from({ length: 10 }, (_, i) => {
        const k = i + 1;
        const shown = k <= reveal;
        const active = k === reveal;
        return (
          <motion.div
            key={k}
            animate={{ opacity: shown ? 1 : 0.15, scale: active ? 1.08 : 1 }}
            className="flex items-center gap-2 font-mono text-lg font-bold"
            style={{ color: active ? '#fde047' : '#cbd5e1' }}
          >
            <span>{n} × {k}</span><span className="text-slate-500">=</span>
            <span className="font-extrabold" style={{ textShadow: active ? '0 0 10px #fde04788' : 'none' }}>{n * k}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── a number split into place-value columns (Hundreds | Tens | Ones) + expanded form ──
export function PlaceDigits({ value = 345 }) {
  const digits = String(value).split('');
  const n = digits.length;
  const labels = ['Ones', 'Tens', 'Hundreds', 'Thousands'];
  const colors = ['#FFE066', '#22D3EE', '#A78BFA', '#F472B6'];
  const parts = digits
    .map((d, i) => Number(d) * 10 ** (n - 1 - i))
    .filter((x) => x > 0);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {digits.map((d, i) => {
          const place = n - 1 - i;
          const c = colors[place] || '#cbd5e1';
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 280, damping: 16 }}
                className="flex h-16 w-12 items-center justify-center rounded-xl border-2 font-mono text-4xl font-black"
                style={{ color: c, borderColor: `${c}66`, background: `${c}1a`, textShadow: `0 0 12px ${c}88` }}
              >
                {d}
              </motion.span>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c }}>{labels[place]}</span>
            </div>
          );
        })}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: n * 0.15 + 0.2 }}
        className="font-mono text-base font-bold text-slate-300">
        {parts.join(' + ')} <span className="text-slate-500">=</span>{' '}
        <span className="text-emerald-300" style={{ textShadow: '0 0 10px #4ADE8088' }}>{value}</span>
      </motion.p>
    </div>
  );
}

// ── long-division bracket, walked step by step (Divide-Multiply-Subtract-Bring down) ──
// divisor ) dividend, quotient above; `step` reveals quotient digits (quoSteps) and the
// working rows (each row appears at its step). Rows are right-aligned to the dividend.
export function LongDivision({ divisor = '4', dividend = '84', quotient = '21', quoSteps = [], rows = [], step = 99 }) {
  const W = dividend.length;
  const Cell = ({ ch, color = '#cbd5e1', dim = false }) => (
    <span className="inline-flex h-8 w-6 items-center justify-center font-mono text-2xl font-extrabold"
      style={{ color, opacity: dim ? 0 : 1 }}>{ch}</span>
  );
  const padRight = (s) => s.padStart(W, ' ').slice(-W).split('');
  return (
    <div className="flex items-start justify-center gap-1 font-mono">
      {/* divisor on the left, vertically centered on the dividend row */}
      <div className="flex flex-col items-end">
        <Cell ch="" />
        <span className="inline-flex h-8 items-center pr-1 text-2xl font-extrabold text-cyan-300">{divisor}</span>
      </div>
      <div className="flex flex-col items-start">
        {/* quotient */}
        <div className="flex border-b-2 border-transparent">
          {quotient.split('').map((d, i) => (
            <Cell key={i} ch={d} color="#22d3ee" dim={step < (quoSteps[i] ?? 0)} />
          ))}
        </div>
        {/* dividend with the division bracket: left border + overline */}
        <div className="flex border-t-2 border-l-2 border-white/50 pl-1">
          {dividend.split('').map((d, i) => <Cell key={i} ch={d} color="#e2e8f0" />)}
        </div>
        {/* working rows */}
        {rows.map((r, i) => (
          <div key={i} className="flex pl-1" style={{ opacity: step < r.step ? 0 : 1, transition: 'opacity .3s' }}>
            {padRight(r.s).map((ch, j) => (
              <Cell key={j} ch={ch === ' ' ? '' : ch} color={r.c === 'rose' ? '#fb7185' : r.c === 'line' ? '#64748b' : '#fde047'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── a single big numeral / label, for emphasis beats ──
export function BigNum({ text = '', color = '#fde047' }) {
  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="text-center font-mono text-6xl font-black"
      style={{ color, textShadow: `0 0 22px ${color}aa` }}
    >
      {text}
    </motion.div>
  );
}

export function renderLessonView(view) {
  if (!view) return null;
  const v = view;
  switch (v.kind) {
    case 'objects': return <CountObjects emoji={v.emoji} n={v.n} highlight={v.highlight ?? -1} numeral={v.numeral ?? null} />;
    case 'compare': return <CompareMouth emoji={v.emoji} left={v.left} right={v.right} sign={v.sign ?? null} />;
    case 'column': return <ColumnGrid top={v.top} bottom={v.bottom} op={v.op} result={v.result} carry={v.carry} active={v.active} />;
    case 'story': return <StoryWords words={v.words} revealed={v.revealed ?? 0} />;
    case 'table': return <TableRow n={v.n} reveal={v.reveal ?? 0} />;
    case 'big': return <BigNum text={v.text} color={v.color} />;
    case 'placedigits': return <PlaceDigits value={v.value} />;
    case 'longdiv': return <LongDivision divisor={v.divisor} dividend={v.dividend} quotient={v.quotient} quoSteps={v.quoSteps} rows={v.rows} step={v.step} />;
    case 'tenframe': return <TenFrame filled={v.filled} showEq={v.showEq ?? true} />;
    case 'combine': return <CombineBlocks a={v.a} b={v.b} />;
    case 'takeaway': return <TakeAwayBlocks a={v.a} b={v.b} />;
    case 'numberline': return <NumberLineHint hint={v.hint} />;
    case 'baseten': return <BaseTenBlocks t={v.t} o={v.o} />;
    case 'comparecards': return <CompareCards a={v.a} b={v.b} />;
    case 'evenodd': return <EvenOddDots n={v.n} />;
    case 'skip': return <SkipHops step={v.step} count={v.count} />;
    case 'array': return <ArrayModel a={v.a} b={v.b} />;
    case 'groups': return <ShareGroups total={v.total} groups={v.groups} />;
    case 'repeatadd': return <RepeatedAddition a={v.a} b={v.b} run={v.run ?? 0} />;
    case 'multable': return <MulTableHint hint={v.hint} />;
    case 'fracpie': return <FractionPieBar k={v.k} n={v.n} />;
    case 'fracbar': return <FractionBar n={v.n} k={v.k} />;
    case 'equiv': return <EquivFractions a={v.a} b={v.b} m={v.m} />;
    case 'compfrac': return <CompareFractions k1={v.k1} n1={v.n1} k2={v.k2} n2={v.n2} />;
    case 'addfrac': return <AddFractions a={v.a} b={v.b} n={v.n} />;
    case 'roundline': return <RoundingLine v={v.v} unit={v.unit} />;
    case 'decgrid': return <DecimalGrid value={v.value} />;
    case 'compdec': return <CompareDecimals a={v.a} b={v.b} />;
    case 'adddec': return <AddDecimals a={v.a} b={v.b} />;
    case 'dechop': return <DecimalHop from={v.from} factor={v.factor} op={v.op} />;
    case 'coins': return <CoinTray coins={v.coins} />;
    case 'clock': return <ClockRead h={v.h} m={v.m} />;
    case 'elapsed': return <ElapsedClocks h1={v.h1} m1={v.m1} dh={v.dh} dm={v.dm} />;
    case 'unitladder': return <UnitLadder big={v.big} small={v.small} per={v.per} n={v.n} />;
    case 'shape': return <ShapeSides sides={v.sides} name={v.name} />;
    case 'symmetry': return <SymmetryFold emoji={v.emoji} />;
    case 'angle': return <AngleSweep deg={v.deg} />;
    case 'perimeter': return <PerimeterTrace w={v.w} h={v.h} />;
    case 'area': return <AreaFill w={v.w} h={v.h} />;
    case 'volume': return <VolumeLayers l={v.l} w={v.w} h={v.h} />;
    default: return null;
  }
}
