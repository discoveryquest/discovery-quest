// Synonyms & antonyms: a target word + "same?" / "opposite?", tap the matching word.
// Same generic contract: onPick(word) → quest compares to step.expected.
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

export default function SameOpposite({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.audioPrompt) return;
    lastKey.current = step.audioPrompt;
    const t = setTimeout(() => speak(step.sayQ || [step.audioPrompt], { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.audioPrompt]);

  const answered = picked != null;
  const disp = (s) => (step.lower ? s : s.toUpperCase());
  const same = step.mode === 'same';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* target word + relation */}
      <div className="flex flex-col items-center gap-2">
        <button type="button" onClick={() => speak(step.sayQ || [step.audioPrompt], { important: true })}
          className="flex items-center gap-2 rounded-2xl border-2 border-cyan-300/40 bg-cyan-400/10 px-6 py-3 font-mono text-3xl font-black text-cyan-200">
          {disp(step.target)} <Volume2 size={20} className="text-cyan-300/70" />
        </button>
        <span className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide"
          style={same ? { color: '#4ade80', background: '#4ade8018' } : { color: '#fb923c', background: '#fb923c18' }}>
          {same ? '= means the same' : '⇄ opposite'}
        </span>
      </div>

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
