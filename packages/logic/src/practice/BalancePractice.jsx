// Logic Lagoon — balance-scale deduction (Logic Quest design spec §3.5): a
// couple of see-saws show FACTS (the heavy side sits low), and the learner
// deduces across them — tap the heaviest (or lightest) of all the characters.
// Pure tap mechanic; the see-saws tilt with springs so "heavier = lower"
// reads instantly.
import { useRef } from 'react';
import { motion } from 'framer-motion';

function SeeSaw({ left, right, heavier }) {
  // heavier: 'L' | 'R' — that side dips
  const tilt = heavier === 'L' ? -9 : 9;
  return (
    <div className="flex flex-col items-center">
      <motion.div className="flex w-40 items-end justify-between"
        initial={{ rotate: 0 }} animate={{ rotate: tilt }}
        transition={{ type: 'spring', stiffness: 70, damping: 9, delay: 0.3 }}
        style={{ transformOrigin: '50% 100%' }}>
        <div className="flex flex-col items-center">
          <span className="text-3xl leading-none">{left}</span>
          <div className="h-1.5 w-12 rounded bg-slate-500" />
        </div>
        <div className="mx-1 mb-0.5 h-1 flex-1 rounded bg-slate-500" />
        <div className="flex flex-col items-center">
          <span className="text-3xl leading-none">{right}</span>
          <div className="h-1.5 w-12 rounded bg-slate-500" />
        </div>
      </motion.div>
      <div className="h-5 w-2 rounded-b bg-slate-600" />
      <div className="h-1.5 w-10 rounded bg-slate-600" />
    </div>
  );
}

export default function BalancePractice({ step, disabled, onCorrect, onHint }) {
  const scales = step?.scene?.scales ?? []; // [{ left, right, heavier: 'L'|'R' }] — the facts
  const items = step?.scene?.items ?? []; // [{ id, emoji, label }]
  const ask = step?.target?.ask ?? 'heaviest';
  const answer = step?.target?.id;
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  function pick(id) {
    if (disabled || doneRef.current) return;
    if (id === answer) {
      doneRef.current = true;
      setTimeout(() => onCorrectRef.current?.(), 600);
    } else {
      onHintRef.current?.();
    }
  }

  return (
    <div className="flex flex-col items-center gap-4" data-practice="balance">
      <div className="flex flex-wrap items-end justify-center gap-8 rounded-3xl border border-white/10 bg-[#101f24]/80 px-6 pb-4 pt-6">
        {scales.map((sc, i) => <SeeSaw key={i} left={sc.left} right={sc.right} heavier={sc.heavier} />)}
      </div>
      <p className="text-sm font-extrabold text-cyan-200">
        {ask === 'heaviest' ? 'Who is the HEAVIEST of all?' : 'Who is the LIGHTEST of all?'}
      </p>
      <div className="flex items-center gap-3">
        {items.map((it) => (
          <motion.button key={it.id} type="button" data-item={it.id} onClick={() => pick(it.id)}
            whileTap={{ scale: 0.88 }} title={it.label}
            className="flex h-16 w-16 touch-manipulation items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] text-4xl leading-none transition-colors hover:bg-white/10">
            {it.emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
