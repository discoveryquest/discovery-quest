// Context clues: read a sentence with a blank, tap the word that fits. Reading-focused
// (a later stage). Same generic contract: onPick(word) → quest compares to step.expected.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { speak } from '@discoveryquest/voice-kit/audio';

function tileClasses(state) {
  if (state === 'correct') return 'border-emerald-300 bg-emerald-400/20 text-emerald-200';
  if (state === 'wrong') return 'border-rose-400 bg-rose-500/15 text-rose-200';
  if (state === 'reveal') return 'border-emerald-300/70 bg-emerald-400/10 text-emerald-200';
  return 'border-white/10 bg-white/5 text-white hover:border-cyan-300/60 hover:bg-white/10';
}

export default function ContextClue({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.sentence) return;
    lastKey.current = step.sentence;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.sentence]);

  const answered = picked != null;
  const disp = (s) => (step.lower ? s : s.toUpperCase());
  const [pre, post] = step.sentence.split('___');

  return (
    <div className="flex flex-col items-center gap-7">
      {/* the sentence with the blank (filled with the answer once solved) */}
      <p className="max-w-[400px] text-center text-2xl font-extrabold leading-relaxed text-slate-100">
        {pre}
        {answered
          ? <span className="text-emerald-300" style={{ textShadow: '0 0 10px #4ADE8088' }}>{disp(step.expected)}</span>
          : <span className="mx-1 inline-block min-w-[64px] border-b-4 border-cyan-300/60 align-middle">&nbsp;</span>}
        {post}
      </p>

      <p className="text-sm font-bold text-slate-400">{step.prompt}</p>

      <div className="grid grid-cols-2 gap-3">
        {step.choices.map((c) => {
          const state = !answered ? 'idle'
            : c === picked && c === step.expected ? 'correct'
              : c === picked ? 'wrong'
                : c === step.expected ? 'reveal' : 'idle';
          return (
            <motion.button key={c} type="button" whileTap={{ scale: 0.94 }} disabled={answered} onClick={() => onPick(c)}
              className={`flex h-14 min-w-[120px] items-center justify-center rounded-2xl border-2 px-5 text-2xl font-extrabold transition-colors ${tileClasses(state)}`}>
              {disp(c)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
