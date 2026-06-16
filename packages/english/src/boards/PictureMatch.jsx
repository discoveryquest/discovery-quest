// Picture-match board: show a picture, child taps the WORD that names it. The word also
// plays (audio + picture). Same generic contract: onPick(word) → quest compares to expected.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { speak } from '@discoveryquest/voice-kit/audio';
import Emoji from '@discoveryquest/engine-ui/Emoji';

function tileClasses(state) {
  if (state === 'correct') return 'border-emerald-300 bg-emerald-400/20 text-emerald-200';
  if (state === 'wrong') return 'border-rose-400 bg-rose-500/15 text-rose-200';
  if (state === 'reveal') return 'border-emerald-300/70 bg-emerald-400/10 text-emerald-200';
  return 'border-white/10 bg-white/5 text-white hover:border-cyan-300/60 hover:bg-white/10';
}

export default function PictureMatch({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.audioPrompt) return;
    lastKey.current = step.audioPrompt;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.audioPrompt]);

  const answered = picked != null;
  const disp = (s) => (step.lower ? s : s.toUpperCase()); // case matches the stage

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.button
        type="button"
        onClick={() => speak(step.audioPrompt, { important: true })}
        whileTap={{ scale: 0.95 }}
        className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-cyan-300/30 bg-white/5"
        style={{ boxShadow: '0 0 28px rgba(34,211,238,0.2)' }}
        aria-label="Play the word"
      >
        <Emoji char={step.emoji} className="text-7xl" />
      </motion.button>
      <button type="button" onClick={() => speak(step.audioPrompt, { important: true })}
        className="-mt-2 flex items-center gap-1.5 text-xs font-bold text-cyan-300">
        <Volume2 size={14} /> hear it
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
