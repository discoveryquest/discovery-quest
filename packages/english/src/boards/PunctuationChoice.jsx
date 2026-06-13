// Capitals & Periods: pick the correctly-written sentence (capital start + period).
// Choices are full sentences (stacked cards). onPick(sentence) → compares to expected.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { speak } from '@discoveryquest/voice-kit/audio';

function cls(state) {
  if (state === 'correct') return 'border-emerald-300 bg-emerald-400/20 text-emerald-100';
  if (state === 'wrong') return 'border-rose-400 bg-rose-500/15 text-rose-100';
  if (state === 'reveal') return 'border-emerald-300/70 bg-emerald-400/10 text-emerald-100';
  return 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/60 hover:bg-white/10';
}

export default function PunctuationChoice({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.expected) return;
    lastKey.current = step.expected;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.expected]);

  const answered = picked != null;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <button type="button" onClick={() => speak(step.audioPrompt, { important: true })}
        className="text-base font-extrabold text-purple-200">{step.banner}</button>
      <p className="text-xs font-bold text-slate-500">{step.prompt}</p>

      <div className="flex w-full flex-col gap-2.5">
        {step.choices.map((c) => {
          const state = !answered ? 'idle'
            : c === picked && c === step.expected ? 'correct'
              : c === picked ? 'wrong'
                : c === step.expected ? 'reveal' : 'idle';
          return (
            <motion.button key={c} type="button" whileTap={{ scale: 0.98 }} disabled={answered} onClick={() => onPick(c)}
              className={`w-full rounded-2xl border-2 px-4 py-3 text-left text-xl font-extrabold transition-colors ${cls(state)}`}>
              {c}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
