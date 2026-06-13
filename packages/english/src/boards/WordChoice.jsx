// Listen + tap the WORD you hear (sight words). No picture — a play button + word-text
// choices. Same generic contract: onPick(word) → quest compares to step.expected.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { speak } from '@discoveryquest/voice-kit/audio';

function tileClasses(state) {
  if (state === 'correct') return 'border-emerald-300 bg-emerald-400/20 text-emerald-200';
  if (state === 'wrong') return 'border-rose-400 bg-rose-500/15 text-rose-200';
  if (state === 'reveal') return 'border-emerald-300/70 bg-emerald-400/10 text-emerald-200';
  return 'border-white/10 bg-white/5 text-white hover:border-cyan-300/60 hover:bg-white/10';
}

export default function WordChoice({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.audioPrompt) return;
    lastKey.current = step.audioPrompt;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.audioPrompt]);

  const answered = picked != null;
  const disp = (s) => (step.lower ? s : s.toUpperCase());

  return (
    <div className="flex flex-col items-center gap-7">
      <button type="button" onClick={() => speak(step.audioPrompt, { important: true })}
        className="flex items-center gap-3 rounded-full bg-cyan-400/15 px-7 py-4 text-lg font-extrabold text-cyan-200 ring-2 ring-cyan-300/40 transition hover:bg-cyan-400/25">
        <Volume2 size={26} /> Play the word
      </button>

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
