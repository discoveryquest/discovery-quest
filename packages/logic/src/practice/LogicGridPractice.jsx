// Logic Lagoon — who-owns-what deduction (Logic Quest design spec §3.5):
// icon clues (❤️ = "goes with", 🚫 = "does NOT go with"), owner cards with an
// empty slot each, and a tray of items. Tap an item, tap an owner to place it
// (tap-first, swap-friendly); press Check when every owner has something.
// The solution is authored in the YAML target — keep puzzles small (3×3) and
// verify by hand that the clues force it uniquely.
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function LogicGridPractice({ step, disabled, onCorrect, onHint }) {
  const owners = step?.scene?.owners ?? []; // [{ id, emoji, label }]
  const items = step?.scene?.items ?? []; // [{ id, emoji, label }]
  const clues = step?.scene?.clues ?? []; // [{ a, rel: 'is'|'not', b }]
  const solution = step?.target?.assign ?? {}; // ownerId -> itemId
  const [placed, setPlaced] = useState({}); // ownerId -> itemId
  const [held, setHeld] = useState(null); // itemId
  const [shake, setShake] = useState(0);
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const emojiOf = (list, id) => list.find((x) => x.id === id)?.emoji ?? '❓';
  const trayItems = items.filter((it) => !Object.values(placed).includes(it.id));

  function tapOwner(oid) {
    if (disabled || doneRef.current) return;
    if (held) {
      // place (evicting any occupant back to the tray)
      setPlaced((p) => {
        const next = { ...p };
        for (const k of Object.keys(next)) if (next[k] === held) delete next[k];
        next[oid] = held;
        return next;
      });
      setHeld(null);
    } else if (placed[oid]) {
      // pick the occupant back up
      setHeld(placed[oid]);
      setPlaced((p) => { const n = { ...p }; delete n[oid]; return n; });
    }
  }

  function check() {
    if (disabled || doneRef.current) return;
    const right = owners.every((o) => placed[o.id] === solution[o.id]);
    if (right) {
      doneRef.current = true;
      setTimeout(() => onCorrectRef.current?.(), 600);
    } else {
      setShake((c) => c + 1);
      onHintRef.current?.();
    }
  }

  return (
    <motion.div key={shake} animate={shake ? { x: [0, -9, 9, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.38 }}
      className="flex flex-col items-center gap-3" data-practice="logicGrid">
      {/* icon clues */}
      <div className="flex flex-wrap justify-center gap-2">
        {clues.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xl leading-none">
            {emojiOf(owners, c.a)} <span className="text-base">{c.rel === 'is' ? '❤️' : '🚫'}</span> {emojiOf(items, c.b)}
          </span>
        ))}
      </div>

      {/* owner cards with slots */}
      <div className="flex flex-wrap justify-center gap-3 rounded-3xl border border-white/10 bg-[#141d26]/80 p-4">
        {owners.map((o) => (
          <button key={o.id} type="button" data-owner={o.id} onClick={() => tapOwner(o.id)}
            className="flex touch-manipulation flex-col items-center gap-1.5">
            <span className="text-4xl leading-none">{o.emoji}</span>
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-3xl leading-none
              ${placed[o.id] ? 'border-emerald-300/50 bg-emerald-400/10' : held ? 'border-dashed border-amber-300/70 bg-amber-400/5 animate-pulse' : 'border-dashed border-white/20 bg-white/[0.03]'}`}>
              {placed[o.id] ? emojiOf(items, placed[o.id]) : ''}
            </span>
          </button>
        ))}
      </div>

      {/* item tray */}
      <div className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
        {trayItems.length === 0 && <span className="text-xs font-bold text-slate-600">all placed — Check!</span>}
        {trayItems.map((it) => (
          <motion.button key={it.id} type="button" data-item={it.id}
            onClick={() => !disabled && !doneRef.current && setHeld(held === it.id ? null : it.id)}
            whileTap={{ scale: 0.88 }} animate={{ scale: held === it.id ? 1.15 : 1 }} title={it.label}
            className={`flex h-12 w-12 touch-manipulation items-center justify-center rounded-xl border text-3xl leading-none
              ${held === it.id ? 'border-amber-300 bg-amber-400/15' : 'border-white/10 bg-white/[0.05]'}`}>
            {it.emoji}
          </motion.button>
        ))}
      </div>

      <button type="button" data-check onClick={check} disabled={Object.keys(placed).length < owners.length}
        className="flex h-11 touch-manipulation items-center gap-1.5 rounded-xl border border-emerald-300/40 bg-emerald-400/15 px-5 font-extrabold text-emerald-300 transition-colors hover:bg-emerald-400/25 disabled:opacity-40">
        <Check size={18} /> Check
      </button>
    </motion.div>
  );
}
