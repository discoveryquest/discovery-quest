// ── Luna's Number Lab ───────────────────────────────────────────────────────
// An interactive long-arithmetic trainer for kids: addition with carrying,
// subtraction with borrowing, long multiplication and long division (DMSB),
// walked through one digit at a time with Luna, a starry-eyed owl mentor.

import { Fragment, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  Plus, Minus, X, Divide, Star, Flame, Delete, Sparkles,
  ArrowDown, RefreshCw, Lightbulb, Volume2, VolumeX,
  Trophy, Crown, Pencil, Check,
} from 'lucide-react';
import { applyEffects, EMPTY_BOARD, placeOf, PHASES } from './engine.js';
import { getQuestionType } from './questionTypes/index.js';
import { questTotal, starsEarned, adaptBand } from '@discoveryquest/quest-runtime/scoring';
import { VOICE_LINES, voiceKey, numClips } from './voiceLines.js';
import { speak, sfx, hushAll, setSoundEnabled } from '@discoveryquest/voice-kit/audio';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import Emoji from '@discoveryquest/engine-ui/Emoji';
import { playMusic, trackForWorld, setMusicEnabled, isMusicOn } from './music.js';
import { brandOwner } from './brand.js';
import { loadSave, mutateSave } from '@discoveryquest/engine/save';
import { enrollStation, bumpQuestCount, dueReviews, recordReview } from '@discoveryquest/engine/reviewDeck';
import { bump as track } from '@discoveryquest/engine/telemetry';
import { STATION_BY_ID, worldOfStation, WORLDS, heroStation } from './curriculum.js';
import { FACT_BOARDS } from './boardsFacts.jsx';
import { INTERACTIVE_HINTS, hintVoiceKey } from './interactiveHints.jsx';
import { decPlaceOf } from './engine-decimals.js';

// ── Shared bits ─────────────────────────────────────────────────────────────

const MODES = [
  { id: 'long-add', label: 'Addition', icon: Plus, color: '#FFE066' },
  { id: 'long-sub', label: 'Subtraction', icon: Minus, color: '#22D3EE' },
  { id: 'long-mul', label: 'Multiplication', icon: X, color: '#A78BFA' },
  { id: 'long-div', label: 'Division', icon: Divide, color: '#F472B6' },
];
const DIFFS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

const INTRO = VOICE_LINES.greeting[0];
const pickIdx = (arr) => Math.floor(Math.random() * arr.length);

// Luna's voice + chimes now live in the shared module (src/audio.js) so the
// map and onboarding screens can speak too.

// ── Fake leaderboard ────────────────────────────────────────────────────────
// Friendly rivals seeded around the child's score: a couple already behind,
// several ahead — so there's always somebody about to be overtaken.

const RIVAL_POOL = [
  { name: 'Penny Penguin', emoji: '🐧' },
  { name: 'Felix Fox', emoji: '🦊' },
  { name: 'Bella Bunny', emoji: '🐰' },
  { name: 'Daisy Dino', emoji: '🦕' },
  { name: 'Ollie Octopus', emoji: '🐙' },
  { name: 'Ziggy Zebra', emoji: '🦓' },
  { name: 'Toby Turtle', emoji: '🐢' },
  { name: 'Pippa Panda', emoji: '🐼' },
];
const DEFAULT_NAMES = ['Math Star', 'Number Ninja', 'Count Captain', 'Super Solver', 'Digit Hero'];

function makeRivals(s) {
  const pool = [...RIVAL_POOL].sort(() => Math.random() - 0.5).slice(0, 6);
  const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
  if (s >= 200) {
    // Returning strong player: restart at #2 with the crown one short chase
    // away (never more than ~2 problems), everyone else behind.
    const gap = Math.min(Math.max(Math.round(s * 0.12), 30), 120);
    const factors = [0.85, 0.68, 0.5, 0.32, 0.18];
    return pool.map((p, i) => ({
      id: i,
      ...p,
      score: i === 0 ? round5(s + gap) : round5(s * factors[i - 1]),
    }));
  }
  // New player: start near the bottom and rocket up within the first problems.
  const base = Math.max(s, 40);
  const factors = [0.25, 0.6, 1.2, 1.8, 2.8, 4];
  return pool.map((p, i) => ({
    id: i,
    ...p,
    score: round5(base * factors[i]),
  }));
}

const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`);

function LeaderboardPanel({ open, onClose, rows, onRename, gems }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const save = () => {
    const v = draft.trim().slice(0, 18);
    if (v) onRename(v);
    setEditing(false);
  };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="pointer-events-auto flex max-h-[85vh] w-full max-w-[410px] flex-col gap-2 overflow-y-auto rounded-3xl border-2 border-yellow-300/25 bg-[#14171f] p-6 shadow-[0_0_70px_rgba(255,224,102,0.14)]"
              initial={{ scale: 0.65, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.75, y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <div className="relative mb-3 flex items-center justify-center gap-2.5">
                <motion.span
                  initial={{ rotate: -25, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 14 }}
                >
                  <Trophy size={28} className="text-yellow-300" />
                </motion.span>
                <h3 className="text-2xl font-extrabold tracking-wide text-white">Leaderboard</h3>
                <span className="ml-1 rounded-full bg-cyan-400/10 px-2 py-0.5 font-mono text-sm font-bold text-cyan-200">💎 {gems}</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close leaderboard"
                  className="absolute right-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              {rows.map((r, idx) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.06, type: 'spring', stiffness: 350, damping: 26 }}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 ${
                    r.isYou
                      ? 'border-cyan-300/50 bg-cyan-400/10 shadow-[0_0_22px_rgba(34,211,238,0.2)]'
                      : 'border-white/8 bg-white/4'
                  }`}
                >
                <span className="w-8 shrink-0 text-center font-mono text-sm font-bold text-slate-300">
                  {medal(idx + 1)}
                </span>
                <Emoji char={r.isYou && idx === 0 ? '👑' : r.emoji} className="text-2xl" />
                {r.isYou && editing ? (
                  <input
                    autoFocus
                    value={draft}
                    maxLength={18}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') save();
                      if (e.key === 'Escape') setEditing(false);
                    }}
                    onBlur={save}
                    className="w-full min-w-0 rounded-lg border border-cyan-300/40 bg-black/40 px-2 py-0.5 font-bold text-white outline-none"
                  />
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-bold ${r.isYou ? 'text-cyan-200' : 'text-slate-300'}`}>
                      {r.name}
                      {r.isYou && <span className="ml-1.5 rounded bg-cyan-400/20 px-1 text-[10px] font-extrabold text-cyan-300">YOU</span>}
                    </span>
                    <span className="block truncate text-[10px] font-bold text-slate-500">
                      <Emoji char={r.where.emoji} className="text-[10px]" /> {r.where.title}
                    </span>
                  </span>
                )}
                {r.isYou && !editing && (
                  <button
                    type="button"
                    aria-label="Change your name"
                    onClick={() => {
                      setDraft(r.name);
                      setEditing(true);
                    }}
                    className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-cyan-200"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {r.isYou && editing && (
                  <button type="button" aria-label="Save name" onClick={save} className="shrink-0 rounded-lg p-1 text-emerald-300 hover:bg-white/10">
                    <Check size={16} />
                  </button>
                )}
                <span className="ml-auto shrink-0 font-mono text-sm font-bold text-yellow-200">{r.score}</span>
              </motion.div>
            ))}
              <p className="mt-2 text-center text-xs font-semibold text-slate-500">
                Solve problems to climb! Tap the pencil to pick your hero name.
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

const POP = { type: 'spring', stiffness: 340, damping: 22 };

const glow = (color, strong) => ({
  color,
  textShadow: strong
    ? `0 0 14px ${color}cc, 0 0 38px ${color}55`
    : `0 0 9px ${color}44`,
});

// Scales the worksheet down (never up) so it always fits the stage width —
// keeps every pixel-based alignment in the boards intact on small screens.
function FitScale({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [dims, setDims] = useState({ scale: 1, h: null });
  useEffect(() => {
    const measure = () => {
      const o = outerRef.current;
      const i = innerRef.current;
      if (!o || !i || i.offsetWidth === 0) return;
      // Fit by width AND by the viewport space below the stage's top edge, so
      // tall boards (long division) shrink instead of running off-screen.
      // 80 ≈ stage bottom padding + page bottom margin + breathing room
      const availH = window.innerHeight - Math.max(o.getBoundingClientRect().top, 0) - 80;
      const scale = Math.min(
        1,
        o.clientWidth / i.offsetWidth,
        Math.max(availH / i.offsetHeight, 0.45),
      );
      const h = i.offsetHeight * scale;
      setDims((d) =>
        Math.abs(d.scale - scale) < 0.005 && Math.abs((d.h ?? 0) - h) < 1 ? d : { scale, h },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return (
    <div ref={outerRef} className="flex w-full items-start justify-center" style={{ height: dims.h ?? undefined }}>
      <div
        ref={innerRef}
        className="shrink-0"
        style={{
          transform: `scale(${dims.scale})`,
          transformOrigin: 'center top',
          transition: 'transform 0.35s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const FocusRing = () => (
  <motion.div
    className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-white/25"
    animate={{ opacity: [0.35, 0.9, 0.35] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
  />
);

const TargetRing = ({ color = '#ffffff', small }) => (
  <motion.div
    className={`pointer-events-none absolute rounded-lg border-2 border-dashed ${small ? 'inset-0' : 'inset-1'}`}
    style={{ borderColor: color + '77' }}
    animate={{ opacity: [0.3, 0.85, 0.3] }}
    transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
  />
);

// ── Worksheet cells ─────────────────────────────────────────────────────────

// Top operand digit; subtraction can cross it out with an animated slash.
function NumCell({ id, val, place, step, crossed, pl: plOverride }) {
  const pl = plOverride ?? placeOf(place);
  const focused = step?.focus?.includes(id);
  return (
    <div
      data-cell={id}
      className={`relative flex h-14 items-center justify-center rounded-lg transition-colors duration-300 ${focused ? 'bg-white/5' : ''}`}
    >
      {focused && <FocusRing />}
      {val !== undefined && (
        <motion.span
          animate={crossed ? { scale: 0.72, opacity: 0.4 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative font-mono text-4xl font-bold"
          style={glow(pl.color, focused)}
        >
          {val}
          {crossed && (
            <motion.span
              className="absolute left-[-5px] top-1/2 h-[3.5px] w-[calc(100%+10px)] origin-left rounded-full bg-rose-400"
              style={{ rotate: -24 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          )}
        </motion.span>
      )}
    </div>
  );
}

// Small row above the top operand: carries float up, borrow values appear,
// and a tiny "−1" chip slides over from the column that borrowed.
function TopCell({ id, carryVal, adjVal, badge, place, step, pl: plOverride }) {
  const pl = plOverride ?? placeOf(place);
  const focused = step?.focus?.includes(id);
  const targeted = step?.targets?.includes(id);
  return (
    <div data-cell={id} className="relative flex h-8 items-end justify-center gap-0.5 pb-0.5">
      {targeted && carryVal === undefined && <TargetRing color={pl.color} small />}
      <AnimatePresence>
        {carryVal !== undefined && (
          <motion.span
            key={`carry-${carryVal}`}
            initial={{ y: 30, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={POP}
            className={`font-mono text-lg font-bold ${focused ? '' : ''}`}
            style={glow(pl.color, true)}
          >
            +{carryVal}
          </motion.span>
        )}
        {adjVal !== undefined && (
          <motion.span
            key={`adj-${adjVal}`}
            initial={{ y: 14, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={POP}
            className="font-mono text-lg font-bold"
            style={glow(pl.color, true)}
          >
            {adjVal}
          </motion.span>
        )}
        {badge && (
          <motion.span
            key="badge"
            initial={{ x: 50, y: 10, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="rounded-md bg-rose-400/15 px-1 font-mono text-xs font-bold text-rose-300 ring-1 ring-rose-400/40"
          >
            −1
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// A solved digit landing in the answer row: drops down and settles.
function AnsCell({ id, val, place, step, pl: plOverride }) {
  const pl = plOverride ?? placeOf(place);
  const targeted = step?.targets?.includes(id);
  return (
    <div data-cell={id} className="relative flex h-14 items-center justify-center">
      {targeted && val === undefined && <TargetRing color={pl.color} />}
      {val !== undefined && (
        <motion.span
          initial={{ y: -32, scale: 1.5, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={POP}
          className="font-mono text-4xl font-bold"
          style={glow(pl.color, true)}
        >
          {val}
        </motion.span>
      )}
    </div>
  );
}

function PartialCell({ id, cell, place, step }) {
  const pl = placeOf(place);
  const focused = step?.focus?.includes(id);
  const targeted = step?.targets?.includes(id);
  return (
    <div
      data-cell={id}
      className={`relative flex h-14 items-center justify-center rounded-lg ${focused ? 'bg-white/5' : ''}`}
    >
      {focused && <FocusRing />}
      {targeted && !cell && <TargetRing color={pl.color} />}
      {cell &&
        (cell.dim ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-4xl font-bold text-slate-600"
          >
            {cell.val}
          </motion.span>
        ) : (
          <motion.span
            initial={{ y: -32, scale: 1.5, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={POP}
            className="font-mono text-4xl font-bold"
            style={glow(pl.color, true)}
          >
            {cell.val}
          </motion.span>
        ))}
    </div>
  );
}

const RuleLine = ({ span }) => (
  <div className="flex items-center px-0.5" style={{ gridColumn: `span ${span}` }}>
    <motion.div
      className="h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-slate-200/70 via-slate-300/60 to-slate-400/30"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
  </div>
);

const OpSign = ({ children }) => (
  <div className="flex h-14 items-center justify-center font-mono text-3xl font-bold text-slate-500">
    {children}
  </div>
);

// ── Boards ──────────────────────────────────────────────────────────────────

function AddSubBoard({ p, board, step }) {
  const W = p.width;
  const dp = p.dp || 0; // decimal digits — inserts a point column when set
  // left→right items: digit columns, with a point slot between dp and dp-1
  const items = [];
  for (let k = 0; k < W; k++) {
    const c = W - 1 - k;
    items.push({ c });
    if (dp && c === dp) items.push({ point: true });
  }
  const template = `44px ${items.map((it) => (it.point ? '20px' : '52px')).join(' ')}`;
  const plFor = (c) => (dp ? decPlaceOf(c, dp) : undefined);
  const Point = ({ row }) =>
    row === 'top' ? (
      <div />
    ) : (
      <div className="flex h-14 items-end justify-center pb-2 font-mono text-3xl font-bold text-slate-300">.</div>
    );
  return (
    <div className="inline-grid gap-x-1.5" style={{ gridTemplateColumns: template }}>
      <div />
      {items.map((it, i) =>
        it.point ? (
          <Point key={`p${i}`} row="top" />
        ) : (
          <TopCell
            key={it.c}
            id={`carry-${it.c}`}
            carryVal={board.carry[it.c]}
            adjVal={board.adj[it.c]}
            badge={board.badge[it.c]}
            place={it.c}
            pl={plFor(it.c)}
            step={step}
          />
        ),
      )}
      <div />
      {items.map((it, i) =>
        it.point ? (
          <Point key={`p${i}`} />
        ) : (
          <NumCell key={it.c} id={`a-${it.c}`} val={p.aD[it.c]} place={it.c} pl={plFor(it.c)} step={step} crossed={board.cross[it.c]} />
        ),
      )}
      <OpSign>{p.kind === 'sub' ? '−' : '+'}</OpSign>
      {items.map((it, i) =>
        it.point ? <Point key={`p${i}`} /> : <NumCell key={it.c} id={`b-${it.c}`} val={p.bD[it.c]} place={it.c} pl={plFor(it.c)} step={step} />,
      )}
      <div />
      <RuleLine span={items.length} />
      <div />
      {items.map((it, i) =>
        it.point ? <Point key={`p${i}`} /> : <AnsCell key={it.c} id={`ans-${it.c}`} val={board.ans[it.c]} place={it.c} pl={plFor(it.c)} step={step} />,
      )}
    </div>
  );
}

function MulBoard({ p, board, step }) {
  const W = p.width;
  const cols = Array.from({ length: W }, (_, k) => W - 1 - k);
  return (
    <div className="inline-grid gap-x-1.5" style={{ gridTemplateColumns: `44px repeat(${W}, 52px)` }}>
      <div />
      {cols.map((c) => (
        <TopCell key={c} id={`carry-${c}`} carryVal={board.carry[c]} place={c} step={step} />
      ))}
      <div />
      {cols.map((c) => (
        <NumCell key={c} id={`m-${c}`} val={p.mD[c]} place={c} step={step} />
      ))}
      <OpSign>×</OpSign>
      {cols.map((c) => (
        <NumCell key={c} id={`q-${c}`} val={p.qD[c]} place={c} step={step} />
      ))}
      <div />
      <RuleLine span={W} />
      {p.R === 1 ? (
        <>
          <div />
          {cols.map((c) => (
            <AnsCell key={c} id={`ans-${c}`} val={board.ans[c]} place={c} step={step} />
          ))}
        </>
      ) : (
        <>
          {p.qD.map((_, j) => (
            <Fragment key={j}>
              <div />
              {cols.map((c) => (
                <PartialCell key={c} id={`p${j}-${c}`} cell={board.partial[`${j}-${c}`]} place={c} step={step} />
              ))}
            </Fragment>
          ))}
          <div />
          <RuleLine span={W} />
          <div />
          {cols.map((c) => (
            <AnsCell key={c} id={`tot-${c}`} val={board.total[c]} place={c} step={step} />
          ))}
        </>
      )}
    </div>
  );
}

const DIV_CELL = 52;
const DIV_LEFT = 78; // divisor box (64) + bracket border & padding (14)

function DivCell({ id, val, place, step }) {
  const pl = placeOf(place);
  const focused = step?.focus?.includes(id);
  const targeted = step?.targets?.includes(id);
  return (
    <div
      data-cell={id}
      className={`relative flex h-14 items-center justify-center rounded-lg ${focused ? 'bg-white/5' : ''}`}
      style={{ width: DIV_CELL }}
    >
      {focused && <FocusRing />}
      {targeted && val === undefined && <TargetRing color={pl.color} />}
      {val !== undefined && (
        <motion.span
          initial={{ y: -32, scale: 1.5, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={POP}
          className="font-mono text-4xl font-bold"
          style={glow(pl.color, true)}
        >
          {val}
        </motion.span>
      )}
    </div>
  );
}

function WorkCell({ id, cell, place, step, row }) {
  const pl = placeOf(place);
  const focused = step?.focus?.includes(id);
  const targeted = step?.targets?.includes(id);
  return (
    <div
      data-cell={id}
      className={`relative flex h-14 items-center justify-center rounded-lg ${focused ? 'bg-white/5' : ''}`}
      style={{ width: DIV_CELL }}
    >
      {focused && <FocusRing />}
      {targeted && !cell && <TargetRing color={pl.color} />}
      {cell &&
        (cell.bring ? (
          <motion.span
            initial={{ y: -((row + 2) * 56), opacity: 0.25 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 170, damping: 21 }}
            className="relative font-mono text-4xl font-bold"
            style={glow(pl.color, true)}
          >
            {cell.val}
            <motion.span
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-pink-300"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <ArrowDown size={16} strokeWidth={3} />
            </motion.span>
          </motion.span>
        ) : (
          <motion.span
            initial={{ y: -32, scale: 1.5, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={POP}
            className="font-mono text-4xl font-bold"
            style={glow(pl.color, true)}
          >
            {cell.val}
          </motion.span>
        ))}
    </div>
  );
}

function DivBoard({ p, board, step }) {
  const L = p.L;
  // All working rows are reserved upfront so the board height (and therefore
  // the fitted scale) stays constant for the whole problem.
  const maxRow = p.workRows - 1;
  const dsrFocused = step?.focus?.includes('dsr');
  return (
    <div className="inline-block">
      {/* quotient */}
      <div className="flex" style={{ marginLeft: DIV_LEFT }}>
        {Array.from({ length: L }, (_, k) => (
          <DivCell key={k} id={`q-${k}`} val={board.quot[k]} place={L - 1 - k} step={step} />
        ))}
      </div>
      {/* divisor ⟌ dividend */}
      <div className="flex items-stretch">
        <div
          data-cell="dsr"
          className={`relative flex w-16 items-center justify-center rounded-lg pr-2 font-mono text-4xl font-bold text-slate-200 ${dsrFocused ? 'bg-white/5' : ''}`}
        >
          {dsrFocused && <FocusRing />}
          {p.divisor}
        </div>
        <motion.div
          className="flex origin-left rounded-tl-2xl border-l-[3px] border-t-[3px] border-slate-300/60 pl-[11px] pt-1"
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {p.D.map((d, k) => (
            <DivCell key={k} id={`dvd-${k}`} val={d} place={L - 1 - k} step={step} />
          ))}
        </motion.div>
      </div>
      {/* working rows */}
      {Array.from({ length: maxRow + 1 }, (_, r) => {
        const meta = board.workMeta[r];
        return (
          <div key={r} className="relative flex h-14" style={{ marginLeft: DIV_LEFT }}>
            {meta?.neg && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-1/2 -translate-y-1/2 font-mono text-2xl font-bold text-slate-500"
                style={{ left: meta.from * DIV_CELL - 24 }}
              >
                −
              </motion.span>
            )}
            {Array.from({ length: L }, (_, k) => (
              <WorkCell key={k} id={`w${r}-${k}`} cell={board.work[`${r}-${k}`]} place={L - 1 - k} step={step} row={r} />
            ))}
            {meta && (
              <motion.div
                className="absolute bottom-0 h-[3px] origin-left rounded-full bg-slate-300/70"
                style={{ left: meta.from * DIV_CELL, width: (meta.to - meta.from + 1) * DIV_CELL }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// The DMSB cycle indicator for long division.
function DmsbLegend({ step }) {
  const icons = { D: Divide, M: X, S: Minus, B: ArrowDown };
  return (
    <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
      {['D', 'M', 'S', 'B'].map((k) => {
        const ph = PHASES[k];
        const Icon = icons[k];
        const active = step && (step.phase === k || (k === 'B' && step.bring));
        return (
          <motion.div
            key={k}
            animate={active ? { scale: 1.08 } : { scale: 1 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
            style={
              active
                ? { background: ph.color + '22', color: ph.color, boxShadow: `0 0 18px ${ph.color}44` }
                : { color: '#64748b', background: '#ffffff08' }
            }
          >
            <Icon size={14} strokeWidth={3} />
            {ph.label}
          </motion.div>
        );
      })}
    </div>
  );
}

// Luna, the owl companion, now lives in @discoveryquest/engine-ui/LunaOwl (shared UI).

const BUBBLE_STYLES = {
  intro: { borderColor: '#22D3EE66', boxShadow: '0 8px 30px rgba(34,211,238,0.18)' },
  praise: { borderColor: '#4ADE8066', boxShadow: '0 8px 30px rgba(74,222,128,0.18)' },
  hint: { borderColor: '#FFE06666', boxShadow: '0 8px 30px rgba(255,224,102,0.16)' },
  oops: { borderColor: '#F472B666', boxShadow: '0 8px 30px rgba(244,114,182,0.16)' },
};

function Bubble({ bubble }) {
  return (
    <AnimatePresence>
      {bubble && (
        <motion.div
          key={bubble.id}
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          className="absolute left-[72px] top-[-8px] z-30 w-48 rounded-2xl border-2 bg-[#1b2032] px-4 py-3 text-[14px] font-bold leading-snug text-slate-100 sm:left-[100px] sm:w-60 sm:text-[15px]"
          style={BUBBLE_STYLES[bubble.kind] || BUBBLE_STYLES.intro}
        >
          <span
            className="absolute -left-[7px] top-7 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 bg-[#1b2032]"
            style={{ borderColor: (BUBBLE_STYLES[bubble.kind] || BUBBLE_STYLES.intro).borderColor }}
          />
          {bubble.kind === 'hint' && (
            <Lightbulb size={16} className="mb-0.5 mr-1.5 inline text-yellow-300" />
          )}
          {bubble.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Juice: confetti + floating points ───────────────────────────────────────

function ConfettiLayer({ pieces }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{
            left: '50%',
            top: '42%',
            width: p.size,
            height: p.shape === 'dot' ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.shape === 'dot' ? '50%' : 2,
            boxShadow: `0 0 10px ${p.color}88`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: [1, 1, 0], rotate: p.rot, scale: [1, 1, 0.5] }}
          transition={{ duration: p.dur, ease: [0.15, 0.6, 0.45, 1] }}
        />
      ))}
    </div>
  );
}

// ── Right-hand panel ────────────────────────────────────────────────────────

function QuestionCard({ step, buffer, shakeCount, done, equation }) {
  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-[#161a26] p-5 text-center shadow-xl">
        <div className="font-display text-xl font-extrabold text-emerald-300">Solved! ⭐</div>
        <div className="mt-1 font-mono text-lg font-bold text-slate-200">{equation}</div>
      </div>
    );
  }
  if (!step) return null;
  const n = step.expected.length;
  return (
    <motion.div
      key={shakeCount}
      animate={shakeCount ? { x: [0, -11, 11, -8, 8, -4, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-white/10 bg-[#161a26] p-5 shadow-xl"
    >
      <div className="mb-3 flex justify-center">
        <span
          className="rounded-full px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider"
          style={{ background: step.chip.color + '1f', color: step.chip.color }}
        >
          {step.chip.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-2xl font-bold text-slate-100">
        <span className="whitespace-nowrap">{step.prompt}</span>
        <span className="text-slate-500">=</span>
        <div className="flex gap-1.5">
          {Array.from({ length: n }, (_, k) => (
            <div
              key={k}
              className={`flex h-12 w-10 items-center justify-center rounded-lg border-2 bg-black/40 ${
                k === buffer.length ? 'border-cyan-300/70' : 'border-white/15'
              }`}
            >
              {buffer[k] !== undefined ? (
                <motion.span initial={{ scale: 1.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={glow(step.chip.color, true)}>
                  {buffer[k]}
                </motion.span>
              ) : (
                k === buffer.length && (
                  <motion.span
                    className="h-6 w-0.5 rounded bg-cyan-300/80"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      {n > 1 && (
        <div className="mt-3 text-center text-sm font-semibold text-slate-400">
          Two digits — type them both!
        </div>
      )}
    </motion.div>
  );
}

function KeyBtn({ children, onClick, variant }) {
  const base =
    variant === 'hint'
      ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/25 hover:bg-yellow-400/20'
      : variant === 'ghost'
        ? 'bg-white/4 text-slate-400 border-white/10 hover:bg-white/10'
        : 'bg-white/6 text-slate-100 border-white/10 hover:bg-white/12';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className={`flex h-14 touch-manipulation items-center justify-center rounded-xl border font-mono text-2xl font-bold shadow-lg transition-colors ${base}`}
    >
      {children}
    </motion.button>
  );
}

function Keypad({ onDigit, onBack, onHint }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
        <KeyBtn key={k} onClick={() => onDigit(k)}>
          {k}
        </KeyBtn>
      ))}
      <KeyBtn variant="ghost" onClick={onBack}>
        <Delete size={22} />
      </KeyBtn>
      <KeyBtn onClick={() => onDigit('0')}>0</KeyBtn>
      <KeyBtn variant="hint" onClick={onHint}>
        <Lightbulb size={22} />
      </KeyBtn>
    </div>
  );
}

// ── Main game ───────────────────────────────────────────────────────────────

let uid = 1;

const DIFF_TO_BAND = { easy: 0, medium: 1, hard: 2 };
const stationIdOf = (qtId) => `practice-${qtId}`; // until the map (T2.1) assigns real stations

// Builds a quest: `total` main questions plus up to 2 due "Blast from the
// Past" reviews spliced mid-queue (GDD §7). Reviews never affect stars and
// the queue always ends on a main question.
function buildQuest(qtId, floor, cap, sid) {
  const save = loadSave();
  const stars = save.stations[sid]?.stars || 0;
  const total = questTotal(stars);
  const reviews = dueReviews(save, { exclude: sid, max: 2 })
    .map((id) => {
      const st = STATION_BY_ID[id];
      if (!st?.qt) return null;
      const band = Math.min(save.stations[id]?.bestBand ?? st.floor, st.cap);
      return { kind: 'review', stationId: id, qt: st.qt, band, icon: st.icon, title: st.title };
    })
    .filter(Boolean);
  const queue = Array.from({ length: total }, () => ({ kind: 'main' }));
  if (reviews[0]) queue.splice(2, 0, reviews[0]);
  if (reviews[1]) queue.splice(5, 0, reviews[1]);
  return { qtId, floor, cap, band: floor, total, results: [], queue, qPtr: 0 };
}

function fresh(questionTypeId, band, review = null) {
  const problem = getQuestionType(questionTypeId).generate(band);
  return {
    id: uid++,
    problem,
    review, // {stationId, qt, band, icon, title} when this is a Blast-from-the-Past question
    board: applyEffects(EMPTY_BOARD, problem.steps[0].preEffects),
    stepIdx: 0,
    buffer: '',
    attempts: 0,
    done: false,
  };
}

export default function QuestScreen({ station, onExit }) {
  // When launched from the map, `station` fixes the topic + band range and
  // owns the star record; without it (free play) the dev tabs/difficulty show.
  const initQt = station?.qt ?? 'long-add';
  const initFloor = station?.floor ?? 0;
  const sidOf = (qtId) => station?.id ?? stationIdOf(qtId);

  const [mode, setMode] = useState(initQt);
  const [diff, setDiff] = useState('easy');
  const [g, setG] = useState(() => fresh(initQt, initFloor));
  // A quest = a run of N questions (GDD §6). results[i] = solved first-try.
  // band adapts inside [floor..cap]; total is 5 pre-star, 8 after.
  const [quest, setQuest] = useState(() => buildQuest(initQt, initFloor, station?.cap ?? 2, sidOf(initQt)));
  const [ceremony, setCeremony] = useState(null);
  const [gems, setGems] = useState(() => loadSave().gems);
  const lastEq = useRef(g.problem.equation); // avoid back-to-back identical questions
  const [score, setScore] = useState(() => loadSave().score);
  const [streak, setStreak] = useState(0);
  const [perfect, setPerfect] = useState(true);
  const [bubble, setBubble] = useState(null);
  const [owlMood, setOwlMood] = useState('idle');
  // Luna's position is a pair of motion values: dragging, hint flights and
  // returning home all act on the same coordinates without fighting.
  const owlX = useMotionValue(0);
  const owlY = useMotionValue(0);
  const preFlight = useRef(null); // where Luna was before flying to a hint
  const [shakeCount, setShakeCount] = useState(0);
  const [confetti, setConfetti] = useState([]);
  const [floaters, setFloaters] = useState([]);

  // fake leaderboard
  const [playerName, setPlayerName] = useState(
    () => loadSave().profile.name || DEFAULT_NAMES[pickIdx(DEFAULT_NAMES)],
  );
  const [rivals, setRivals] = useState(() => makeRivals(loadSave().score));
  const [boardOpen, setBoardOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const rank = 1 + rivals.filter((r) => r.score > score).length;

  const [soundOn, setSoundOn] = useState(() => loadSave().settings.sound);
  const [musicOn, setMusicOnState] = useState(() => isMusicOn());
  const [audioMenu, setAudioMenu] = useState(false);
  const [hintAid, setHintAid] = useState(null); // active interactive hint descriptor

  const seenIntro = useRef({});
  const bubbleTimer = useRef(null);
  const stageRef = useRef(null);
  const owlBoxRef = useRef(null);
  const owlAreaRef = useRef(null);
  const livelyMood = useLivelyMood(owlMood);
  const lunaSpeaking = useSpeaking();
  const handlers = useRef({});

  const p = g.problem;
  const step = g.done ? null : p.steps[g.stepIdx];

  // dev-only hook so E2E drivers can read the expected answer
  if (import.meta.env.DEV) window.__qa = step?.expected ?? null;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  // persist progress + name
  useEffect(() => {
    mutateSave((s) => {
      s.score = score;
    });
  }, [score]);
  useEffect(() => {
    mutateSave((s) => {
      s.profile.name = playerName;
    });
  }, [playerName]);

  // Overtake detection: celebrate every rival the child just passed.
  const prevScoreRef = useRef(score);
  useEffect(() => {
    const prev = prevScoreRef.current;
    prevScoreRef.current = score;
    if (score <= prev) return;
    const passed = rivals.filter((r) => r.score > prev && r.score <= score);
    if (passed.length === 0) return;
    const newRank = 1 + rivals.filter((r) => r.score > score).length;
    const isFirst = newRank === 1;
    // let the praise line finish before Luna celebrates the climb
    setTimeout(() => {
      const ri = pickIdx(VOICE_LINES.rankup);
      const tid = uid++;
      setToast({
        id: tid,
        crown: isFirst,
        text: isFirst
          ? 'FIRST PLACE! You did it!'
          : `You passed ${passed.length === 1 ? passed[0].name : `${passed.length} friends`} — now ${medal(newRank)}!`,
      });
      showBubble(
        { kind: 'praise', text: isFirst ? VOICE_LINES.first[0] : VOICE_LINES.rankup[ri] },
        3400,
      );
      setOwlMood('cheer');
      sfx('fanfare');
      speak(isFirst ? voiceKey('first', 0) : voiceKey('rankup', ri), { important: true });
      if (isFirst) burstConfetti();
      // Luna flies up to the trophy chip so the cheer has a visible subject
      flyOwlToEl(document.querySelector('button[aria-label="Leaderboard"]'));
      setTimeout(() => {
        owlReturn();
        setToast((t) => (t?.id === tid ? null : t));
      }, 3800);
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  // Rivals below the child slowly creep up (but can never pass them) so the
  // board feels alive without ever denting confidence.
  useEffect(() => {
    const t = setInterval(() => {
      setRivals((rs) => {
        const below = rs.filter((r) => r.score < scoreRef.current - 20);
        if (below.length === 0) return rs;
        const lucky = below[Math.floor(Math.random() * below.length)];
        const bump = 2 + Math.floor(Math.random() * 7);
        return rs.map((r) =>
          r === lucky ? { ...r, score: Math.min(r.score + bump, scoreRef.current - 15) } : r,
        );
      });
    }, 12000);
    return () => clearInterval(t);
  }, []);

  const whereOf = (sc) => {
    const w = WORLDS[Math.min(Math.floor(sc / 350), WORLDS.length - 1)];
    return { emoji: w.emoji, title: w.title };
  };
  const heroAt = heroStation(loadSave());
  const heroW = WORLDS[heroAt?.w ?? 0];
  const heroWhere = { emoji: heroW.emoji, title: heroW.title };
  const boardRows = [
    ...rivals.map((r) => ({ ...r, isYou: false, where: whereOf(r.score) })),
    { id: 'you', name: playerName, emoji: '🦉', score, isYou: true, where: heroWhere },
  ].sort((a, b) => b.score - a.score || (a.isYou ? -1 : 1));

  function toggleMusic() {
    const next = !musicOn;
    setMusicOnState(next);
    setMusicEnabled(next);
    mutateSave((s) => {
      s.settings.music = next;
    });
    if (next && station) playMusic(trackForWorld(worldOfStation(station.id)?.world.id));
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    mutateSave((s) => {
      s.settings.sound = next;
    });
    if (next) speak(voiceKey('praise', 4)); // a quick "Woohoo!" confirms sound is back
  }

  function showBubble(b, ms) {
    clearTimeout(bubbleTimer.current);
    setBubble({ ...b, id: uid++ });
    if (ms) {
      bubbleTimer.current = setTimeout(() => {
        setBubble(null);
        setOwlMood('idle');
      }, ms);
    }
  }

  function spawnFloater(text) {
    // floaters live in the fixed owl layer, so these are viewport coords
    const o = owlBoxRef.current?.getBoundingClientRect();
    const x = o ? o.left + 72 : 90;
    const y = o ? o.top - 4 : 200;
    const id = uid++;
    setFloaters((f) => [...f, { id, x, y, text }]);
    setTimeout(() => setFloaters((f) => f.filter((fl) => fl.id !== id)), 1250);
  }

  const worldTheme = station ? worldOfStation(station.id) : null;
  const fanfarePitch = worldTheme ? 2 ** ((worldTheme.idx % 5) / 12) : 1;
  const confettiPalette = worldTheme
    ? [worldTheme.world.color, '#FFE066', '#ffffff', worldTheme.world.color, '#94a3b8']
    : null;

  function burstConfetti() {
    const pieces = Array.from({ length: 56 }, (_, k) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * 330;
      return {
        id: uid++,
        color: confettiPalette ? confettiPalette[k % confettiPalette.length] : placeOf(k % 5).color,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist * 0.7 + 200,
        rot: (Math.random() - 0.5) * 760,
        size: 7 + Math.random() * 8,
        dur: 1.1 + Math.random() * 0.7,
        shape: k % 3 === 0 ? 'dot' : 'rect',
      };
    });
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 2100);
  }

  const OWL_SPRING = { type: 'spring', stiffness: 110, damping: 16 };

  // Fly Luna next to any element on screen (worksheet cell, trophy chip...).
  // The owl lives in a fixed full-screen layer, so the math is in viewport
  // coordinates: her untransformed "base" = current rect minus motion values.
  function flyOwlToEl(el) {
    if (window.innerWidth < 640) return; // on phones Luna stays home; bubble is enough
    const owl = owlBoxRef.current;
    if (!owl || !el) return;
    const r = el.getBoundingClientRect();
    const ob = owl.getBoundingClientRect();
    const baseLeft = ob.left - owlX.get();
    const baseTop = ob.top - owlY.get();
    if (!preFlight.current) preFlight.current = { x: owlX.get(), y: owlY.get() };
    animate(owlX, Math.max(r.left - 132 - baseLeft, 8 - baseLeft), OWL_SPRING);
    animate(owlY, Math.max(r.top - 36 - baseTop, 8 - baseTop), OWL_SPRING);
  }

  function flyOwlTo(cellId) {
    if (!cellId) return;
    flyOwlToEl(document.querySelector(`[data-cell="${cellId}"]`));
  }

  // After a hint flight, glide back to wherever the child left her.
  function owlReturn() {
    if (!preFlight.current) return;
    animate(owlX, preFlight.current.x, OWL_SPRING);
    animate(owlY, preFlight.current.y, OWL_SPRING);
    preFlight.current = null;
  }

  function newProblem(m, band, review = null) {
    let ng = fresh(m, band, review);
    for (let i = 0; i < 6 && ng.problem.equation === lastEq.current; i++) {
      ng = fresh(m, band, review); // reroll duplicates of the previous question
    }
    lastEq.current = ng.problem.equation;
    setG(ng);
    setHintAid(null); // close any open interactive hint on a new question
    owlReturn();
    setPerfect(true);
    setShakeCount(0);
    setOwlMood('idle');
    if (review) {
      // time-portal moment: Luna announces it, then reads the old question
      clearTimeout(bubbleTimer.current);
      showBubble({ kind: 'hint', text: VOICE_LINES.blast[0] }, 3500);
      speak(voiceKey('blast', 0), { important: true });
      speak(ng.problem.steps[0].sayQ, { important: true });
      return;
    }
    if (!seenIntro.current[m]) {
      seenIntro.current[m] = true;
      showBubble({ kind: 'intro', text: INTRO }, 4500);
      speak(voiceKey('greeting', 0), { important: true });
      // the first question queues politely after the greeting
      speak(ng.problem.steps[0].sayQ, { important: true });
    } else {
      clearTimeout(bubbleTimer.current);
      setBubble(null);
      speak(ng.problem.steps[0].sayQ); // read the fresh problem out loud
    }
  }

  // ── Quest flow (GDD §6) ──
  function startQuest(qtId, diffStr) {
    const floor = station ? station.floor : DIFF_TO_BAND[diffStr];
    const cap = station ? station.cap : 2;
    mutateSave(bumpQuestCount); // review-deck clock (GDD §7)
    setQuest(buildQuest(qtId, floor, cap, sidOf(qtId)));
    setCeremony(null);
    newProblem(qtId, floor);
  }

  function nextQuestion() {
    const np = quest.qPtr + 1;
    const item = quest.queue[np] || { kind: 'main' };
    setQuest((q) => ({ ...q, qPtr: np }));
    if (item.kind === 'review') newProblem(item.qt, item.band, item);
    else newProblem(quest.qtId, quest.band);
  }

  function finishQuest() {
    const perfectCount = quest.results.filter(Boolean).length;
    const earned = starsEarned(perfectCount, quest.total);
    const sid = sidOf(quest.qtId);
    let totalStars = earned;
    mutateSave((s) => {
      const st = s.stations[sid] || { stars: 0, bestBand: 0, attempts: 0 };
      st.attempts += 1;
      st.bestBand = Math.max(st.bestBand, quest.band);
      totalStars = Math.max(st.stars, earned);
      st.stars = totalStars;
      s.stations[sid] = st;
      if (totalStars >= 1) enrollStation(s, sid); // mastered skills feed the review deck
    });
    const bonus = earned * 25;
    if (bonus) {
      setScore((x) => x + bonus);
      spawnFloater(`+${bonus}`);
    }
    track(station?.id, 'quests');
    setCeremony({ earned, totalStars, perfectCount, total: quest.total, bonus });
    burstConfetti();
    sfx('fanfare');
  }

  // background music: the station's world mood. Also clear any voice still
  // draining from the previous screen (the map's welcome / "press play" lines)
  // so the quest starts clean — its own greeting/question follow in the intro
  // effect below. The hush is ref-guarded so StrictMode's double-invoke can't
  // fire a second hush that cuts off the (ref-guarded, non-repeating) greeting.
  const enteredRef = useRef(false);
  useEffect(() => {
    if (!enteredRef.current) {
      enteredRef.current = true;
      hushAll();
    }
    playMusic(station ? trackForWorld(worldOfStation(station.id)?.world.id) : 'mood-sunny');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // telemetry heartbeat: active seconds at this station while the tab is visible
  useEffect(() => {
    if (!station) return undefined;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') track(station.id, 'sec', 5);
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The initial quest is built in state initializers, so tick the review-deck
  // clock here (startQuest handles all later quests). Ref-guarded for
  // StrictMode's double effect invocation.
  const bumpedRef = useRef(false);
  useEffect(() => {
    if (!bumpedRef.current) {
      bumpedRef.current = true;
      mutateSave(bumpQuestCount);
    }
  }, []);

  // First-ever problem: Luna introduces herself.
  useEffect(() => {
    if (!seenIntro.current['long-add']) {
      seenIntro.current['long-add'] = true;
      showBubble({ kind: 'intro', text: INTRO }, 4500);
      speak(voiceKey('greeting', 0), { important: true });
      speak(g.problem.steps[0].sayQ, { important: true });
    }
    return () => clearTimeout(bubbleTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function correct(st) {
    let board = applyEffects(g.board, st.effects);
    const ni = g.stepIdx + 1;
    const finished = ni >= p.steps.length;
    if (!finished) board = applyEffects(board, p.steps[ni].preEffects);
    setG({ ...g, board, stepIdx: finished ? g.stepIdx : ni, buffer: '', attempts: 0, done: finished });
    setScore((s) => s + 10);
    setStreak((s) => s + 1);
    track(station?.id, 'correct');
    owlReturn();
    spawnFloater('+10');
    sfx(finished ? 'fanfare' : 'correct', { pitch: fanfarePitch });
    if (finished && g.review) {
      // Blast-from-the-Past complete: move the Leitner box, award a gem on a
      // first-try solve. Never counts toward stars or band adaptation.
      const wasPerfect = perfect;
      track(station?.id, wasPerfect ? 'reviewsHit' : 'reviewsMissed');
      mutateSave((s) => {
        recordReview(s, g.review.stationId, wasPerfect);
        if (wasPerfect) s.gems += 1;
      });
      setScore((s) => s + 25);
      setTimeout(() => spawnFloater('+25'), 350);
      setOwlMood('cheer');
      if (wasPerfect) {
        setGems((x) => x + 1);
        setTimeout(() => spawnFloater('💎'), 700);
        showBubble({ kind: 'praise', text: `${VOICE_LINES.gem[0]} 💎` }, 4200);
        speak([voiceKey('gem', 0), 'w-answeris', ...numClips(p.result)], { important: true });
        burstConfetti();
      } else {
        showBubble({ kind: 'hint', text: VOICE_LINES.blastmiss[0] }, 4200);
        speak(voiceKey('blastmiss', 0), { important: true });
      }
      return;
    }
    if (finished) {
      // record this question's first-try result + adapt the band (GDD §6)
      const wasPerfect = perfect;
      setQuest((q) => {
        const results = [...q.results, wasPerfect];
        return { ...q, results, band: adaptBand(q.band, results, q.floor, q.cap ?? 2) };
      });
      const bonus = perfect ? 75 : 50;
      setScore((s) => s + bonus);
      setTimeout(() => spawnFloater(`+${bonus}`), 350);
      burstConfetti();
      setOwlMood('cheer');
      const si = perfect ? 1 : 0;
      showBubble({ kind: 'praise', text: `${VOICE_LINES.solved[si]} ⭐` }, 4200);
      // e.g. "Woohoo! You solved the whole thing! The answer is 142!"
      speak([voiceKey('solved', si), 'w-answeris', ...(p.sayResult ?? numClips(p.result))], { important: true });
    } else {
      setOwlMood('cheer');
      const pi = pickIdx(VOICE_LINES.praise);
      showBubble({ kind: 'praise', text: VOICE_LINES.praise[pi] }, 1300);
      // e.g. "Nice! 8 plus 3 is 11, write the 1 and carry the 1.
      //       What is 5 plus 2 plus 1?"
      speak([voiceKey('praise', pi), ...st.sayA, ...(p.steps[ni]?.sayQ ?? [])]);
    }
  }

  function wrong(st) {
    const na = g.attempts + 1;
    setG({ ...g, buffer: '', attempts: na });
    setShakeCount((c) => c + 1);
    setStreak(0);
    setPerfect(false);
    track(station?.id, 'missed');
    sfx('wrong');
    if (na >= 2) {
      setOwlMood('hint');
      flyOwlTo(st.targets?.[0] || st.focus?.[0]);
      showBubble({ kind: 'hint', text: st.hint });
      speak(voiceKey('hint', 0));
    } else {
      const oi = pickIdx(VOICE_LINES.oops);
      showBubble({ kind: 'oops', text: VOICE_LINES.oops[oi] }, 1700);
      speak(voiceKey('oops', oi));
    }
  }

  function onDigit(d) {
    if (g.done) return;
    const st = p.steps[g.stepIdx];
    const nb = g.buffer + d;
    if (!st.expected.startsWith(nb)) {
      wrong(st);
    } else if (nb === st.expected) {
      correct(st);
    } else {
      setG({ ...g, buffer: nb });
    }
  }

  function onBack() {
    if (!g.done && g.buffer) setG({ ...g, buffer: g.buffer.slice(0, -1) });
  }

  function onHint() {
    if (g.done || !step) return;
    setOwlMood('hint');
    flyOwlTo(step.targets?.[0] || step.focus?.[0]);
    showBubble({ kind: 'hint', text: step.hint });
    if (step.interactiveHint) {
      setHintAid(step.interactiveHint); // topic-tailored visual aid
      const vk = hintVoiceKey(step.interactiveHint); // Luna narrates the actual teaching
      speak(vk ? [vk] : voiceKey('hint', 0), { important: true });
    } else {
      speak(voiceKey('hint', 0));
    }
  }

  // Opening the leaderboard: Luna comments on your position to spur you on.
  function openBoard() {
    if (boardOpen) {
      setBoardOpen(false);
      return;
    }
    setBoardOpen(true);
    const cat = rank === 1 ? 'champion' : 'position';
    const li = pickIdx(VOICE_LINES[cat]);
    showBubble({ kind: 'praise', text: VOICE_LINES[cat][li] }, 4000);
    setOwlMood('cheer');
    speak(voiceKey(cat, li), { important: true });
  }

  // Tap/click Luna and she chats back.
  function owlChat() {
    const ci = pickIdx(VOICE_LINES.chat);
    setOwlMood('cheer');
    showBubble({ kind: 'praise', text: VOICE_LINES.chat[ci] }, 2600);
    speak(voiceKey('chat', ci));
  }

  handlers.current = {
    onDigit,
    onBack,
    onEnter: () => {
      if (ceremony) startQuest(mode, diff);
      else if (g.done) (quest.results.length >= quest.total ? finishQuest : nextQuestion)();
    },
    onEsc: () => setBoardOpen(false),
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key >= '0' && e.key <= '9') handlers.current.onDigit(e.key);
      else if (e.key === 'Backspace') {
        e.preventDefault();
        handlers.current.onBack();
      } else if (e.key === 'Enter') handlers.current.onEnter();
      else if (e.key === 'Escape') handlers.current.onEsc();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    startQuest(m, diff);
  };
  const switchDiff = (d) => {
    if (d === diff) return;
    setDiff(d);
    startQuest(mode, d);
  };

  const activeMode = MODES.find((m) => m.id === mode) ?? { id: mode, label: station?.title ?? 'Quest', color: '#22D3EE' };
  const qNum = Math.min(quest.results.length + (g.done ? 0 : 1), quest.total);
  const onLastQuestion = quest.results.length >= quest.total;

  return (
    <div className="relative flex min-h-full select-none flex-col overflow-x-hidden font-display text-slate-200">
      {/* ambient glow */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-purple-500/10 blur-[120px]" />

      {/* header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-cyan-300" size={26} />
          <h1 className="text-2xl font-extrabold tracking-wide text-white">
            {brandOwner()} <span style={glow('#22D3EE', true)}>Math Quest</span>
          </h1>
        </div>
        {station ? (
          <div className="order-last flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 sm:order-none sm:mx-auto sm:w-auto">
            <Emoji char={station.icon} className="text-xl" />
            <span className="text-sm font-extrabold text-slate-100">{station.title}</span>
          </div>
        ) : (
        <nav className="order-last flex w-full justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1.5 sm:order-none sm:mx-auto sm:w-auto">
          {MODES.map((m) => {
            const active = m.id === mode;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => switchMode(m.id)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-extrabold transition-all"
                style={
                  active
                    ? { background: m.color + '22', color: m.color, boxShadow: `0 0 18px ${m.color}33` }
                    : { color: '#94a3b8' }
                }
              >
                <Icon size={16} strokeWidth={3} />
                <span className="hidden md:inline">{m.label}</span>
              </button>
            );
          })}
        </nav>
        )}
        <div className="ml-auto flex items-center gap-3 sm:ml-0 sm:gap-4">
          <motion.button
            type="button"
            onClick={openBoard}
            aria-label="Leaderboard"
            animate={toast ? { rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.7 }}
            className="flex h-9 touch-manipulation items-center gap-1.5 rounded-xl border border-yellow-300/30 bg-yellow-400/10 px-2.5 text-yellow-300 transition-colors hover:bg-yellow-400/20"
          >
            {rank === 1 ? <Crown size={18} /> : <Trophy size={18} />}
            <motion.span key={rank} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="font-mono text-sm font-bold">
              #{rank}
            </motion.span>
          </motion.button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAudioMenu((o) => !o)}
              aria-label="Audio settings"
              className={`flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl border transition-colors ${
                soundOn || musicOn
                  ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20'
                  : 'border-white/10 bg-white/5 text-slate-500 hover:bg-white/10'
              }`}
            >
              {soundOn || musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <AnimatePresence>
              {audioMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.92 }}
                  className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-white/10 bg-[#171b28] p-2 shadow-2xl"
                >
                  {[
                    { label: "🦉 Luna & sounds", on: soundOn, fn: toggleSound },
                    { label: '🎵 Music', on: musicOn, fn: toggleMusic },
                  ].map((row) => (
                    <button
                      key={row.label}
                      type="button"
                      onClick={row.fn}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/5"
                    >
                      {row.label}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${row.on ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-slate-500'}`}>
                        {row.on ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 text-orange-300">
            <Flame size={20} className={streak > 0 ? 'fill-orange-400/40' : 'opacity-40'} />
            <span className="font-mono text-xl font-bold">{streak}</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-300">
            <Star size={20} className="fill-yellow-300/40" />
            <motion.span key={score} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-mono text-xl font-bold">
              {score}
            </motion.span>
          </div>
          <div className="hidden items-center gap-1 text-cyan-200 sm:flex" title="Memory Gems">
            <span className="text-base">💎</span>
            <motion.span key={gems} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-mono text-xl font-bold">
              {gems}
            </motion.span>
          </div>
        </div>
      </header>

      {/* difficulty + new problem */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-2 sm:px-6">
        {station && onExit && (
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-extrabold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            🗺️ Map
          </button>
        )}
        {!station && (
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {DIFFS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => switchDiff(d.id)}
              className={`rounded-lg px-3 py-1 text-sm font-extrabold transition-all ${
                d.id === diff ? 'bg-white/15 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        )}
        <button
          type="button"
          onClick={() => startQuest(mode, diff)}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-extrabold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RefreshCw size={14} strokeWidth={3} />
          New quest
        </button>
        {/* quest progress */}
        <div className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
          <span className={`text-sm font-extrabold ${g.review ? 'text-amber-300' : 'text-slate-300'}`}>
            {g.review ? '🕰️ Bonus review!' : `Question ${qNum} of ${quest.total}`}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: quest.total }, (_, k) => {
              const state =
                k < quest.results.length
                  ? quest.results[k]
                    ? 'bg-emerald-400'
                    : 'bg-rose-400/80'
                  : k === quest.results.length && !g.done
                    ? 'bg-cyan-300 animate-pulse'
                    : 'bg-white/15';
              return <span key={k} className={`h-2 w-2 rounded-full ${state}`} />;
            })}
          </div>
        </div>
      </div>

      {/* guide banner */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-1 sm:px-6">
        <div className="relative min-h-12">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${g.id}-${g.stepIdx}-${g.done}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 py-1"
            >
              {step ? (
                <>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider"
                    style={{ background: step.chip.color + '1f', color: step.chip.color }}
                  >
                    {step.chip.label}
                  </span>
                  <span className="text-[15px] font-bold text-slate-200 sm:text-[17px]">{step.banner}</span>
                </>
              ) : (
                <span className="text-[15px] font-bold text-emerald-300 sm:text-[17px]">
                  Amazing work! Press Enter or tap "Next problem" for another one. 🎉
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* main stage */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 pb-8 pt-2 sm:gap-6 sm:px-6 sm:pb-10 lg:flex-row lg:items-start">
        <div
          ref={stageRef}
          className="relative min-h-[300px] flex-1 overflow-hidden rounded-3xl border border-white/10 bg-[#141822]/70 p-4 shadow-2xl sm:min-h-[440px] sm:p-8"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        >
          {/* Blast-from-the-Past time portal */}
          {g.review && (
            <>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="h-[440px] w-[440px] rounded-full border-4 border-dashed border-amber-300/20"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 26, ease: 'linear' }}
                />
              </div>
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1 text-xs font-extrabold text-amber-300 sm:text-sm"
              >
                🕰️ Blast from the Past · {g.review.title}
              </motion.div>
            </>
          )}
          {/* worksheet */}
          <div
            className="flex items-center justify-center pb-1 pt-20 sm:min-h-[376px] sm:pb-0 sm:pl-32 sm:pt-0"
            style={{ filter: g.review ? 'sepia(0.35) hue-rotate(-12deg)' : undefined, transition: 'filter 0.6s' }}
          >
            <FitScale>
              <motion.div key={g.id} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                {p.kind === 'div' && <DmsbLegend step={step} />}
                {FACT_BOARDS[p.kind] ? (
                  (() => {
                    const FactsBoard = FACT_BOARDS[p.kind];
                    return <FactsBoard p={p} board={g.board} step={step} />;
                  })()
                ) : p.kind === 'add' || p.kind === 'sub' ? (
                  <AddSubBoard p={p} board={g.board} step={step} />
                ) : p.kind === 'mul' ? (
                  <MulBoard p={p} board={g.board} step={step} />
                ) : (
                  <DivBoard p={p} board={g.board} step={step} />
                )}
              </motion.div>
            </FitScale>
          </div>

        </div>

        {/* Luna roams the whole screen in her own fixed layer */}
        <div ref={owlAreaRef} className="pointer-events-none fixed inset-0 z-30">
          <motion.div
            ref={owlBoxRef}
            className="pointer-events-auto absolute left-2 top-20 cursor-grab active:cursor-grabbing sm:left-4 sm:top-[34%]"
            style={{ x: owlX, y: owlY, touchAction: 'none' }}
            drag
            dragConstraints={owlAreaRef}
            dragElastic={0.12}
            dragMomentum={false}
            whileDrag={{ scale: 1.08 }}
            onDragStart={() => {
              preFlight.current = null; // wherever they drop her is the new home
            }}
            onTap={owlChat}
          >
            <motion.div animate={{ y: [0, -9, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>
              <div className="origin-top-left scale-[0.62] sm:scale-100">
                <LunaOwl mood={livelyMood} talking={lunaSpeaking} />
                <AnimatePresence>
                  {owlMood === 'cheer' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.15, opacity: 1, rotate: 18 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -right-3 -top-3 text-yellow-300"
                    >
                      <Sparkles size={26} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            <Bubble bubble={bubble} />
          </motion.div>

          {/* floating points rise from wherever Luna is */}
          {floaters.map((f) => (
            <motion.div
              key={f.id}
              className="absolute z-40 text-xl font-extrabold"
              style={{ left: f.x, top: f.y, ...glow('#FFE066', true) }}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -95, x: 36, scale: 1.15 }}
              transition={{ duration: 1.15, ease: 'easeOut' }}
            >
              {f.text}
            </motion.div>
          ))}
        </div>

        {/* control panel */}
        <div className="flex w-full flex-col gap-4 lg:w-80">
          <QuestionCard step={step} buffer={g.buffer} shakeCount={shakeCount} done={g.done} equation={p.equation} />
          <Keypad onDigit={onDigit} onBack={onBack} onHint={onHint} />
          <p className="text-center text-sm font-semibold text-slate-500">
            Tap the keys or type on your keyboard — Luna the owl is cheering for you!
          </p>
          {/* column color legend — only meaningful on the long-arithmetic boards */}
          {['add', 'sub', 'mul', 'div'].includes(p.kind) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-500">Column colors:</span>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="rounded-full px-2.5 py-0.5 text-xs font-extrabold"
                  style={{ background: placeOf(i).color + '1a', color: placeOf(i).color }}
                >
                  {placeOf(i).name}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* solved overlay */}
      <AnimatePresence>
        {g.done && !ceremony && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              initial={{ scale: 0.6, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 19, delay: 0.75 }}
              className="rounded-3xl border border-white/10 bg-[#171b28] px-6 py-7 text-center shadow-2xl sm:px-10 sm:py-8"
            >
              <div className="mb-2 flex justify-center gap-2">
                {[0, 1, 2].map((k) => (
                  <motion.span
                    key={k}
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.95 + k * 0.13, type: 'spring', stiffness: 300, damping: 14 }}
                  >
                    <Star size={34} className="fill-yellow-300 text-yellow-300" />
                  </motion.span>
                ))}
              </div>
              <h2 className="text-3xl font-extrabold text-white">You solved it!</h2>
              <p className="mt-2 font-mono text-2xl font-bold" style={glow(activeMode.color, true)}>
                {p.equation}
              </p>
              <p className="mt-2 text-lg font-extrabold text-emerald-300">
                {g.review
                  ? `+25 points${perfect ? ' · 💎 Memory Gem!' : ''}`
                  : `+${perfect ? 75 : 50} points${perfect ? ' · PERFECT RUN!' : ''}`}
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => (onLastQuestion ? finishQuest() : nextQuestion())}
                className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 text-lg font-extrabold text-slate-900 shadow-[0_0_28px_rgba(34,211,238,0.45)] transition-colors hover:bg-cyan-300"
              >
                {onLastQuestion ? 'See your stars! ⭐' : 'Next question →'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* quest-complete star ceremony */}
      <AnimatePresence>
        {ceremony && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.55, y: 60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 230, damping: 18 }}
              className="rounded-3xl border-2 border-yellow-300/30 bg-[#171b28] px-7 py-8 text-center shadow-[0_0_70px_rgba(255,224,102,0.18)] sm:px-12"
            >
              <h2 className="text-2xl font-extrabold tracking-wide text-yellow-200">QUEST COMPLETE!</h2>
              <div className="mt-4 flex justify-center gap-3">
                {[0, 1, 2].map((k) => (
                  <motion.span
                    key={k}
                    initial={{ scale: 0, rotate: -50, y: -18 }}
                    animate={{ scale: k < ceremony.earned ? 1.15 : 0.95, rotate: 0, y: 0 }}
                    transition={{ delay: 0.35 + k * 0.22, type: 'spring', stiffness: 260, damping: 12 }}
                  >
                    <Star
                      size={52}
                      className={k < ceremony.earned ? 'fill-yellow-300 text-yellow-300 drop-shadow-[0_0_14px_rgba(255,224,102,0.8)]' : 'text-slate-600'}
                    />
                  </motion.span>
                ))}
              </div>
              <p className="mt-4 text-lg font-extrabold text-slate-200">
                {ceremony.perfectCount} of {ceremony.total} first try!
              </p>
              {ceremony.bonus > 0 && (
                <p className="mt-1 text-lg font-extrabold text-emerald-300">+{ceremony.bonus} bonus points</p>
              )}
              <p className="mt-1 text-sm font-bold text-slate-400">
                {ceremony.earned >= 3
                  ? 'A perfect quest — you mastered it!'
                  : ceremony.earned === 2 && ceremony.total < 8
                    ? 'Perfect! The longer quest holds the third star!'
                    : ceremony.earned >= 1
                      ? 'Play again to earn more stars!'
                      : "So close — let's try that quest again!"}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {onExit && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onExit({ next: true })}
                    className="rounded-xl bg-cyan-400 px-6 py-3 text-lg font-extrabold text-slate-900 shadow-[0_0_28px_rgba(34,211,238,0.45)] transition-colors hover:bg-cyan-300"
                  >
                    Next challenge →
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => startQuest(mode, diff)}
                  className={
                    onExit
                      ? 'rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-lg font-extrabold text-slate-200 transition-colors hover:bg-white/10'
                      : 'rounded-xl bg-cyan-400 px-6 py-3 text-lg font-extrabold text-slate-900 shadow-[0_0_28px_rgba(34,211,238,0.45)] transition-colors hover:bg-cyan-300'
                  }
                >
                  Play again
                </motion.button>
                {onExit && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onExit()}
                    className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-lg font-extrabold text-slate-200 transition-colors hover:bg-white/10"
                  >
                    Map 🗺️
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* interactive hint overlay (topic-tailored, e.g. multiplication table) */}
      <AnimatePresence>
        {hintAid && INTERACTIVE_HINTS[hintAid.kind] && (
          <motion.div
            className="fixed inset-0 z-[55] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHintAid(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-3xl border-2 border-cyan-300/30 bg-[#14171f] p-5 shadow-2xl"
            >
              <button
                type="button"
                aria-label="Close hint"
                onClick={() => setHintAid(null)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
              <h3 className="mb-3 flex items-center justify-center gap-1.5 text-base font-extrabold text-yellow-200">
                <Lightbulb size={16} /> Luna's helper
              </h3>
              {(() => {
                const Aid = INTERACTIVE_HINTS[hintAid.kind];
                return <Aid hint={hintAid} />;
              })()}
              <button
                type="button"
                onClick={() => setHintAid(null)}
                className="mt-4 w-full rounded-xl bg-cyan-400 py-2.5 text-base font-extrabold text-slate-900 hover:bg-cyan-300"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* leaderboard rank-up toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="fixed left-1/2 top-16 z-[60]"
            initial={{ x: '-50%', y: -50, opacity: 0, scale: 0.8 }}
            animate={{ x: '-50%', y: 0, opacity: 1, scale: 1 }}
            exit={{ x: '-50%', y: -36, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className={`flex items-center gap-2.5 rounded-2xl border-2 px-5 py-3 shadow-2xl ${
                toast.crown
                  ? 'border-yellow-300/60 bg-[#221d10] shadow-[0_0_44px_rgba(255,224,102,0.35)]'
                  : 'border-cyan-300/50 bg-[#101d22] shadow-[0_0_34px_rgba(34,211,238,0.3)]'
              }`}
            >
              {toast.crown ? (
                <motion.span animate={{ rotate: [0, -14, 14, 0] }} transition={{ repeat: 2, duration: 0.5 }}>
                  <Crown size={26} className="text-yellow-300" />
                </motion.span>
              ) : (
                <Trophy size={22} className="text-cyan-300" />
              )}
              <span className={`text-lg font-extrabold ${toast.crown ? 'text-yellow-200' : 'text-cyan-100'}`}>
                {toast.text}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LeaderboardPanel
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        rows={boardRows}
        onRename={setPlayerName}
        gems={gems}
      />

      <ConfettiLayer pieces={confetti} />
    </div>
  );
}
