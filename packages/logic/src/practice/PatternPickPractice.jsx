// Pattern Peaks — pattern puzzles (Logic Quest design spec §3.3). Three
// layouts on one mechanic:
//   sequence — a row of tiles with a ? hole; pick the tile that continues it.
//   matrix   — a 3×3 grid with one empty cell (mini Raven's matrices).
//   odd      — no choices: tap the tile that doesn't belong.
// Cells are emoji strings (a cell may hold several, e.g. 🔵🔵🔵 for growing
// patterns). The picked tile flies into the hole; wrong picks shake and stay
// available, so the kid can reason again.
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const HOLE = '?';

function Tile({ text, big, hole, lit, onTap, qa, qaName }) {
  const props = qaName ? { [qaName]: qa } : {};
  return (
    <motion.button
      type="button"
      {...props}
      onClick={onTap}
      disabled={!onTap}
      whileTap={onTap ? { scale: 0.92 } : undefined}
      className={`flex items-center justify-center rounded-2xl border font-bold leading-none touch-manipulation
        ${hole ? 'border-2 border-dashed border-cyan-300/60 bg-cyan-400/5' : 'border-white/10 bg-white/[0.06]'}
        ${lit ? 'ring-2 ring-emerald-300/80' : ''}
        ${big ? 'h-20 min-w-20 px-2 text-3xl' : 'h-16 min-w-16 px-1.5 text-2xl'}`}
      style={{ letterSpacing: '-0.05em' }}
    >
      {hole ? <span className="text-2xl font-extrabold text-cyan-300/70">?</span> : text}
    </motion.button>
  );
}

export default function PatternPickPractice({ step, disabled, onCorrect, onHint }) {
  const { layout = 'sequence', cells = [] } = step?.scene ?? {};
  const choices = step?.choices ?? step?.scene?.choices ?? [];
  const answer = step?.target?.answer;
  const oddIndex = step?.target?.index;

  const [placed, setPlaced] = useState(null); // the correct tile once placed
  const [shake, setShake] = useState(0);
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const finish = () => {
    doneRef.current = true;
    setTimeout(() => onCorrectRef.current?.(), 800);
  };

  function pickChoice(c) {
    if (disabled || doneRef.current) return;
    if (c === answer) {
      setPlaced(c);
      finish();
    } else {
      setShake((n) => n + 1);
      onHintRef.current?.();
    }
  }

  function tapCell(i) {
    if (disabled || doneRef.current || layout !== 'odd') return;
    if (i === oddIndex) {
      setPlaced(i);
      finish();
    } else {
      setShake((n) => n + 1);
      onHintRef.current?.();
    }
  }

  const grid = layout === 'matrix';

  return (
    <motion.div
      key={shake}
      animate={shake ? { x: [0, -9, 9, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.38 }}
      className="flex flex-col items-center gap-4"
      data-practice="patternPick"
    >
      <div className={`rounded-3xl border border-white/10 bg-[#1d1a24]/80 p-4 shadow-2xl ${grid ? 'grid grid-cols-3 gap-2.5' : 'flex flex-wrap items-center justify-center gap-2.5'}`}>
        {cells.map((c, i) =>
          c === HOLE ? (
            <Tile key={i} hole={!placed} text={placed} lit={!!placed} big={grid} qaName="data-cell" qa={i} />
          ) : (
            <Tile key={i} text={c} big={grid}
              lit={layout === 'odd' && placed === i}
              onTap={layout === 'odd' ? () => tapCell(i) : undefined}
              qaName="data-cell" qa={i} />
          ),
        )}
      </div>

      {layout !== 'odd' ? (
        <div className="flex items-center gap-3">
          {choices.map((c) => (
            <motion.button key={c} type="button" data-pchoice={c} onClick={() => pickChoice(c)}
              whileTap={{ scale: 0.9 }}
              animate={placed === c ? { opacity: 0.25, scale: 0.85 } : {}}
              className="flex h-16 min-w-16 touch-manipulation items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/10 px-1.5 text-2xl leading-none transition-colors hover:bg-amber-400/20"
              style={{ letterSpacing: '-0.05em' }}>
              {c}
            </motion.button>
          ))}
        </div>
      ) : (
        <p className="text-xs font-bold text-slate-500">Tap the one that doesn't belong!</p>
      )}
    </motion.div>
  );
}
