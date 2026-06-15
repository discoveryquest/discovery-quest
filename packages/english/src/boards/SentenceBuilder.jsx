// Build a sentence: tap scrambled word tiles into order. Calls onPick(joined) when all
// words are placed → quest compares to step.expected. Tokens carry their own case.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { speak } from '@discoveryquest/voice-kit/audio';

const clean = (w) => w.toLowerCase().replace(/[^a-z]/g, '');

export default function SentenceBuilder({ step, picked, onPick }) {
  const tokens = step.tokens; // scrambled words; track by index (handles repeats like "the")
  const n = tokens.length;
  const [placed, setPlaced] = useState([]); // tile indices in placed order
  const answered = picked != null;

  function place(i) {
    if (answered || placed.includes(i)) return;
    if (step.tokenAudio) speak('word-' + clean(tokens[i])); // opt-in: tap a tile, hear its word
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === n) onPick(next.map((k) => tokens[k]).join(' '));
  }
  const reset = () => !answered && setPlaced([]);

  const assembled = placed.map((k) => tokens[k]).join(' ');
  const correct = answered && assembled === step.expected;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-bold text-slate-400">{step.prompt}</p>

      {/* the building line */}
      <div className={`flex min-h-[56px] w-full max-w-md flex-wrap items-center justify-center gap-2 rounded-2xl border-2 p-3 ${
        !answered ? 'border-white/15' : correct ? 'border-emerald-300 bg-emerald-400/10' : 'border-rose-400 bg-rose-500/10'
      }`}>
        {placed.length === 0 && <span className="text-slate-600">{step.placeholder ?? 'tap the words…'}</span>}
        {placed.map((k, slot) => (
          <span key={slot} className="rounded-xl bg-cyan-400/15 px-3 py-1.5 text-xl font-extrabold text-white">{tokens[k]}</span>
        ))}
      </div>

      {/* tray of remaining words */}
      <div className="flex min-h-[52px] flex-wrap items-center justify-center gap-2.5">
        {tokens.map((w, i) => placed.includes(i) ? (
          <span key={i} className="h-11" />
        ) : (
          <motion.button key={i} type="button" whileTap={{ scale: 0.92 }} disabled={answered} onClick={() => place(i)}
            className="rounded-xl border-2 border-white/10 bg-white/5 px-4 py-2 text-xl font-extrabold text-white transition-colors hover:border-cyan-300/60 hover:bg-white/10">
            {w}
          </motion.button>
        ))}
      </div>

      {!answered && placed.length > 0 && (
        <button type="button" onClick={reset} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200">
          <RotateCcw size={13} /> start over
        </button>
      )}
      {answered && !correct && <p className="text-sm font-bold text-slate-400">{step.readsLabel ?? 'It reads:'} <span className="text-emerald-300">{step.expected}</span></p>}
    </div>
  );
}
