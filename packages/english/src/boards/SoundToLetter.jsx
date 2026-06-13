// Audio-first board: play a phoneme, child taps the matching letter.
// Source-agnostic — it just plays step.audioPrompt (the clip key) and renders
// step.choices. Promotes to @discoveryquest/engine-ui's board registry in the later surgery.

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

export default function SoundToLetter({ step, picked, onPick }) {
  const lastKey = useRef(null);

  // Auto-play the sound when a new problem appears (after a beat so it doesn't
  // collide with the previous problem's praise line — voice-kit also queues).
  useEffect(() => {
    if (lastKey.current === step.audioPrompt) return;
    lastKey.current = step.audioPrompt;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.audioPrompt]);

  const answered = picked != null;

  return (
    <div className="flex flex-col items-center gap-7">
      <button
        type="button"
        onClick={() => speak(step.audioPrompt, { important: true })}
        className="flex items-center gap-3 rounded-full bg-cyan-400/15 px-7 py-4 text-lg font-extrabold text-cyan-200 ring-2 ring-cyan-300/40 transition hover:bg-cyan-400/25"
      >
        <Volume2 size={26} />
        Play the sound
      </button>

      <p className="text-sm font-bold text-slate-400">{step.prompt}</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {step.choices.map((c) => {
          const state =
            !answered ? 'idle'
              : c === picked && c === step.expected ? 'correct'
                : c === picked ? 'wrong'
                  : c === step.expected ? 'reveal'
                    : 'idle';
          return (
            <motion.button
              key={c}
              type="button"
              whileTap={{ scale: 0.9 }}
              disabled={answered}
              onClick={() => onPick(c)}
              className={`font-mono flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl font-extrabold transition-colors ${tileClasses(state)}`}
            >
              {step.lower ? c : c.toUpperCase()}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
