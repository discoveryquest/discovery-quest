// Word-family board: play a word in a rime family (e.g. -at), child taps the first
// letter (onset). Shows the word shape "[ ? ] a t" so the shared rime is visible.
// Same generic contract as SoundToLetter: onPick(onset) → quest compares to step.expected.
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

export default function WordFamily({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.audioPrompt) return;
    lastKey.current = step.audioPrompt;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.audioPrompt]);

  const answered = picked != null;
  const correct = answered && picked === step.expected;
  const onsetState = !answered ? 'empty' : correct ? 'correct' : 'wrong';
  const disp = (s) => (step.lower ? s : s.toUpperCase()); // case matches the stage

  return (
    <div className="flex flex-col items-center gap-7">
      <button type="button" onClick={() => speak(step.audioPrompt, { important: true })}
        className="flex items-center gap-3 rounded-full bg-amber-400/15 px-7 py-4 text-lg font-extrabold text-amber-200 ring-2 ring-amber-300/40 transition hover:bg-amber-400/25">
        <Volume2 size={26} /> Play the word
      </button>

      {/* word shape: onset slot + the shared rime */}
      <div className="font-mono flex items-center gap-1.5 text-5xl font-black">
        <span className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${tileClasses(onsetState)}`}>
          {answered ? disp(correct ? picked : step.expected) : '?'}
        </span>
        {step.rime.split('').map((c, i) => (
          <span key={i} className="flex h-16 w-12 items-center justify-center text-slate-300">{disp(c)}</span>
        ))}
      </div>

      <p className="text-sm font-bold text-slate-400">{step.prompt}</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {step.choices.map((c) => {
          const state = !answered ? 'idle'
            : c === picked && c === step.expected ? 'correct'
              : c === picked ? 'wrong'
                : c === step.expected ? 'reveal' : 'idle';
          return (
            <motion.button key={c} type="button" whileTap={{ scale: 0.9 }} disabled={answered} onClick={() => onPick(c)}
              className={`font-mono flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl font-extrabold transition-colors ${tileClasses(state)}`}>
              {disp(c)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
