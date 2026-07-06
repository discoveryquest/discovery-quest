// Logic Lagoon — 4×4 emoji sudoku (Logic Quest design spec §3.5): every row,
// every column, and every 2×2 box needs all four symbols exactly once.
// Select a symbol from the palette, tap an empty cell to place it (tap a
// placed cell to clear it). When the grid fills, it self-checks: valid →
// win; clashes flash red and Luna hints. Puzzles are authored as the
// canonical solution + a given-mask, and MUST be verified unique with a
// solution-counting script before shipping (see the world-5 commit).
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const conflicts = (grid) => {
  const bad = new Set();
  const groups = [];
  for (let r = 0; r < 4; r++) groups.push([0, 1, 2, 3].map((c) => r * 4 + c));
  for (let c = 0; c < 4; c++) groups.push([0, 1, 2, 3].map((r) => r * 4 + c));
  for (const br of [0, 2]) for (const bc of [0, 2]) groups.push([br * 4 + bc, br * 4 + bc + 1, (br + 1) * 4 + bc, (br + 1) * 4 + bc + 1]);
  for (const g of groups) {
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      if (grid[g[i]] && grid[g[i]] === grid[g[j]]) { bad.add(g[i]); bad.add(g[j]); }
    }
  }
  return bad;
};

export default function SudokuPractice({ step, disabled, onCorrect, onHint }) {
  const symbols = step?.scene?.symbols ?? ['🐟', '🐸', '🐢', '🦆']; // indices 1..4
  const solution = step?.scene?.solution ?? []; // 16 × (1..4)
  const mask = step?.scene?.given ?? []; // 16 × (0|1)
  const init = () => solution.map((v, i) => (mask[i] ? v : 0));
  const [grid, setGrid] = useState(init);
  const [sel, setSel] = useState(1);
  const [flash, setFlash] = useState(new Set());
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  function tapCell(i) {
    if (disabled || doneRef.current || mask[i]) return;
    const next = [...grid];
    next[i] = next[i] === sel ? 0 : sel; // same symbol taps off; otherwise place/replace
    setGrid(next);
    setFlash(new Set());
    if (next.every(Boolean)) {
      const bad = conflicts(next);
      if (bad.size === 0) {
        doneRef.current = true;
        setTimeout(() => onCorrectRef.current?.(), 600);
      } else {
        setFlash(bad);
        onHintRef.current?.();
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4" data-practice="sudoku">
      <div className="grid grid-cols-4 gap-1 rounded-3xl border border-white/10 bg-[#101d1d]/85 p-3">
        {grid.map((v, i) => {
          const boxTint = (Math.floor(i / 8) + Math.floor((i % 4) / 2)) % 2 === 0;
          return (
            <motion.button key={i} type="button" data-cell={i} data-val={v} onClick={() => tapCell(i)}
              animate={flash.has(i) ? { scale: [1, 1.12, 1] } : {}}
              className={`flex h-14 w-14 touch-manipulation items-center justify-center rounded-xl border text-3xl leading-none sm:h-16 sm:w-16
                ${flash.has(i) ? 'border-rose-400 bg-rose-500/20' : mask[i] ? 'border-white/5 bg-white/[0.09]' : boxTint ? 'border-white/10 bg-white/[0.03]' : 'border-white/10 bg-cyan-400/[0.05]'}`}>
              {v ? symbols[v - 1] : ''}
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center gap-2.5">
        {symbols.map((sy, k) => (
          <button key={sy} type="button" data-symbol={k + 1} onClick={() => setSel(k + 1)}
            className={`flex h-14 w-14 touch-manipulation items-center justify-center rounded-2xl border text-3xl leading-none
              ${sel === k + 1 ? 'border-amber-300 bg-amber-400/15 shadow-[0_0_10px_rgba(252,211,77,0.3)]' : 'border-white/10 bg-white/[0.05]'}`}>
            {sy}
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-slate-500">Every row, column and 2×2 box needs all four — no repeats!</p>
    </div>
  );
}
