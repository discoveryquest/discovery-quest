// Build a word form: tap morpheme tiles into order, then Check. The tray mixes the correct
// parts with distractor tiles, so (unlike SentenceBuilder, which uses every tile) we can't infer
// "done" by count — an explicit Check button fires onPick(joined). Tiles join with '' (no
// spaces): walk + ed → walked. CourseQuest compares the joined string to step.expected.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Check } from 'lucide-react';
import { speak } from '@discoveryquest/voice-kit/audio';

export default function WordBuilder({ step, picked, onPick }) {
  const tokens = step.tokens; // scrambled morpheme tiles (correct parts + distractors)
  const join = step.joinWith ?? '';
  const [placed, setPlaced] = useState([]); // tile indices in placed order
  const answered = picked != null;

  // speak the prompt on mount — keyed on the question (prompt), which changes per item
  useEffect(() => { if (step.audioPrompt) speak(step.audioPrompt); }, [step.prompt]); // eslint-disable-line react-hooks/exhaustive-deps

  function place(i) {
    if (answered || placed.includes(i)) return;
    setPlaced([...placed, i]);
  }
  const reset = () => !answered && setPlaced([]);
  const check = () => { if (!answered && placed.length) onPick(placed.map((k) => tokens[k]).join(join)); };

  const assembled = placed.map((k) => tokens[k]).join(join);
  const correct = answered && assembled === step.expected;

  return (
    <div className="flex flex-col items-center gap-6">
      {step.banner && (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-indigo-400/40 bg-indigo-400/10 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-wide text-indigo-300">{step.chip?.label ?? 'Build'}</span>
          <span className="text-base font-extrabold text-white">{step.banner}</span>
        </div>
      )}
      <p className="text-sm font-bold text-slate-400">{step.prompt}</p>

      {/* the building line */}
      <div className={`flex min-h-[56px] w-full max-w-md flex-wrap items-center justify-center gap-1 rounded-2xl border-2 p-3 ${
        !answered ? 'border-white/15' : correct ? 'border-emerald-300 bg-emerald-400/10' : 'border-rose-400 bg-rose-500/10'
      }`}>
        {placed.length === 0 && <span className="text-slate-600">{step.placeholder ?? 'tap the parts…'}</span>}
        {placed.map((k, slot) => (
          <span key={slot} className="rounded-xl bg-indigo-400/15 px-3 py-1.5 text-xl font-extrabold text-white">{tokens[k]}</span>
        ))}
      </div>

      {/* tray of remaining tiles */}
      <div className="flex min-h-[52px] flex-wrap items-center justify-center gap-2.5">
        {tokens.map((w, i) => placed.includes(i) ? (
          <span key={i} className="h-11" />
        ) : (
          <motion.button key={i} type="button" whileTap={{ scale: 0.92 }} disabled={answered} onClick={() => place(i)}
            className="rounded-xl border-2 border-white/10 bg-white/5 px-4 py-2 text-xl font-extrabold text-white transition-colors hover:border-indigo-300/60 hover:bg-white/10">
            {w}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {!answered && placed.length > 0 && (
          <button type="button" onClick={reset} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200">
            <RotateCcw size={13} /> start over
          </button>
        )}
        {!answered && (
          <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={check} disabled={!placed.length}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-5 py-2 text-base font-extrabold text-white shadow-lg shadow-indigo-500/20 transition-opacity disabled:opacity-40">
            <Check size={16} /> Check
          </motion.button>
        )}
      </div>

      {answered && !correct && <p className="text-sm font-bold text-slate-400">It's: <span className="text-emerald-300">{step.expected}</span></p>}
    </div>
  );
}
