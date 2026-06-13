// Parts of speech: tap the word that is a naming/doing/describing word. The question
// plays; choices are words. Same generic contract: onPick(word) → compares to step.expected.
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

export default function GrammarSort({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.audioPrompt + step.banner) return;
    lastKey.current = step.audioPrompt + step.banner;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.audioPrompt, step.banner]);

  const answered = picked != null;
  const disp = (s) => (step.lower ? s : s.toUpperCase());

  return (
    <div className="flex flex-col items-center gap-7">
      <button type="button" onClick={() => speak(step.audioPrompt, { important: true })}
        className="flex items-center gap-2 rounded-2xl border-2 border-purple-300/40 bg-purple-400/10 px-6 py-3 text-xl font-extrabold text-purple-200">
        {step.banner} <Volume2 size={20} className="text-purple-300/70" />
      </button>

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
