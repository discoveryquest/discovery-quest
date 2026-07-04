// Quiz board: read the question, tap the right answer. The generic board contract —
// { step, picked, onPick } — matches every other board; the host compares the pick to
// step.expected. Modeled on English's RuleQuiz, minus the rule banner.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { speak } from '@discoveryquest/voice-kit/audio';

function tileClasses(state) {
  if (state === 'correct') return 'border-emerald-300 bg-emerald-400/20 text-emerald-100';
  if (state === 'wrong') return 'border-rose-400 bg-rose-500/15 text-rose-200';
  if (state === 'reveal') return 'border-emerald-300/70 bg-emerald-400/10 text-emerald-100';
  return 'border-white/10 bg-white/5 text-white hover:border-cyan-300/60 hover:bg-white/10';
}

export default function Quiz({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.prompt) return;
    lastKey.current = step.prompt;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.prompt]);

  const answered = picked != null;

  return (
    <div className="flex flex-col items-center gap-7">
      <p className="max-w-[460px] text-center text-2xl font-extrabold leading-relaxed text-slate-100">
        {step.prompt}
      </p>

      <div className="grid w-full max-w-[460px] grid-cols-1 gap-3">
        {step.choices.map((c) => {
          const state = !answered ? 'idle'
            : c === picked && c === step.expected ? 'correct'
              : c === picked ? 'wrong'
                : c === step.expected ? 'reveal' : 'idle';
          return (
            <motion.button
              key={c}
              type="button"
              whileTap={{ scale: 0.96 }}
              disabled={answered}
              onClick={() => onPick(c)}
              className={`flex min-h-[56px] items-center justify-center rounded-2xl border-2 px-5 py-3 text-lg font-extrabold transition-colors ${tileClasses(state)}`}
            >
              {c}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
