// Rule Quiz: a spelling/grammar rule reminder shown up top (the mnemonic — "i before e,
// except after c", Bossy R, Magic E…), then a question, then word tiles to tap. Same generic
// contract: onPick(word) → quest compares to step.expected. The rule card repeats across
// items, so the voice is keyed on step.prompt (the question), not step.rule.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { speak } from '@discoveryquest/voice-kit/audio';

function tileClasses(state) {
  if (state === 'correct') return 'border-emerald-300 bg-emerald-400/20 text-emerald-200';
  if (state === 'wrong') return 'border-rose-400 bg-rose-500/15 text-rose-200';
  if (state === 'reveal') return 'border-emerald-300/70 bg-emerald-400/10 text-emerald-200';
  return 'border-white/10 bg-white/5 text-white hover:border-cyan-300/60 hover:bg-white/10';
}

export default function RuleQuiz({ step, picked, onPick }) {
  const lastKey = useRef(null);
  useEffect(() => {
    if (lastKey.current === step.prompt) return;
    lastKey.current = step.prompt;
    const t = setTimeout(() => speak(step.audioPrompt, { important: true }), 400);
    return () => clearTimeout(t);
  }, [step.prompt]);

  const answered = picked != null;
  const disp = (s) => (step.lower ? s : s.toUpperCase());

  return (
    <div className="flex flex-col items-center gap-7">
      {/* the rule reminder — a highlighted amber banner, distinct from the choices */}
      <div className="max-w-[440px] rounded-2xl border-2 border-amber-300/70 bg-amber-400/15 px-5 py-3 text-center"
        style={{ boxShadow: '0 0 18px #FBBF2433' }}>
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-300/90">Rule</p>
        <p className="mt-1 text-lg font-extrabold leading-snug text-amber-100">{step.rule}</p>
      </div>

      {/* the question */}
      <p className="max-w-[400px] text-center text-2xl font-extrabold leading-relaxed text-slate-100">
        {step.prompt}
      </p>

      {/* the choices */}
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
