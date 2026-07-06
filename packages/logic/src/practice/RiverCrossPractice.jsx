// Riddle Rapids — the river-crossing riddle (Logic Quest design spec §3.4):
// ferry every character across, but the boat holds the farmer plus ONE
// passenger, and certain pairs can't be left alone on a bank without you.
// Tap a character to load/unload the boat, tap GO to row across. Leaving a
// forbidden pair alone plays the fail (chase wobble + Luna's hint) and resets
// the trip — the fail IS the feedback. All tap-first; works phone + desktop.
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FARMER = '🧑‍🌾';

export default function RiverCrossPractice({ step, disabled, onCorrect, onHint }) {
  const cast = step?.scene?.cast ?? []; // [{ id, emoji, label }]
  const forbidden = step?.scene?.forbidden ?? []; // [[idA, idB], ...]
  const init = () => ({ sides: Object.fromEntries(cast.map((c) => [c.id, 'L'])), boat: 'L', passenger: null, rowing: false });
  const [s, setS] = useState(init);
  const [fail, setFail] = useState(null); // [idA, idB] being naughty
  const doneRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const bank = (side) => cast.filter((c) => s.sides[c.id] === side && s.passenger !== c.id);

  function tapActor(id) {
    if (disabled || doneRef.current || s.rowing || fail) return;
    if (s.passenger === id) return setS({ ...s, passenger: null }); // step off
    if (s.sides[id] !== s.boat || s.passenger) return; // wrong bank or boat full
    setS({ ...s, passenger: id });
  }

  function row() {
    if (disabled || doneRef.current || s.rowing || fail) return;
    const dest = s.boat === 'L' ? 'R' : 'L';
    const departed = s.boat;
    // Compute the outcome HERE, not inside a setState updater — updaters are
    // double-invoked under StrictMode, and side effects there (onCorrect
    // timers) fire twice and skip missions. Bitten before; stays a comment.
    const sides = { ...s.sides };
    if (s.passenger) sides[s.passenger] = dest;
    setS({ ...s, rowing: true });
    setTimeout(() => {
      setS({ sides, boat: dest, passenger: null, rowing: false });
      // anyone misbehaving on the bank we just LEFT (no farmer there now)?
      const alone = cast.filter((c) => sides[c.id] === departed).map((c) => c.id);
      const bad = forbidden.find(([a, b]) => alone.includes(a) && alone.includes(b));
      if (bad) {
        setFail(bad);
        onHintRef.current?.();
        setTimeout(() => { setFail(null); setS(init()); }, 2300);
      } else if (cast.every((c) => sides[c.id] === 'R') && !doneRef.current) {
        doneRef.current = true;
        setTimeout(() => onCorrectRef.current?.(), 700);
      }
    }, 900);
  }

  const Actor = ({ c, naughty }) => (
    <motion.button
      type="button"
      data-actor={c.id}
      onClick={() => tapActor(c.id)}
      whileTap={{ scale: 0.88 }}
      animate={naughty ? { x: [0, 10, -10, 14, -14, 0], rotate: [0, 8, -8, 10, 0] } : {}}
      transition={naughty ? { duration: 0.7, repeat: 2 } : {}}
      className="flex h-14 w-14 touch-manipulation items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-3xl leading-none"
      title={c.label}
    >
      {c.emoji}
    </motion.button>
  );

  return (
    <div className="flex w-full flex-col items-center gap-3" data-practice="riverCross">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#12241e] p-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* left bank */}
          <div className="flex min-h-[132px] flex-wrap content-start justify-center gap-2 rounded-2xl bg-[#1d3327] p-2" data-bank="L">
            {bank('L').map((c) => <Actor key={c.id} c={c} naughty={fail?.includes(c.id) && s.sides[c.id] !== 'R' && s.boat === 'R'} />)}
          </div>
          {/* river + boat */}
          <div className="relative flex h-[150px] w-24 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#1c4966] to-[#123245] sm:w-32">
            <motion.div aria-hidden className="absolute inset-x-0 top-2 text-center text-xs text-cyan-200/40"
              animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2.6 }}>〜 〜 〜</motion.div>
            <motion.div
              className="flex flex-col items-center"
              animate={{ x: (s.boat === 'L') !== s.rowing ? -18 : 18 }}
              transition={{ type: 'spring', stiffness: 60, damping: 14 }}
            >
              <div className="flex items-end gap-0.5 text-2xl leading-none">
                <span>{FARMER}</span>
                {s.passenger && <span data-boat-passenger>{cast.find((c) => c.id === s.passenger)?.emoji}</span>}
              </div>
              <div className="text-3xl leading-none">🛶</div>
            </motion.div>
          </div>
          {/* right bank */}
          <div className="flex min-h-[132px] flex-wrap content-start justify-center gap-2 rounded-2xl bg-[#1d3327] p-2" data-bank="R">
            {bank('R').map((c) => <Actor key={c.id} c={c} naughty={fail?.includes(c.id) && s.boat === 'L'} />)}
          </div>
        </div>

        <AnimatePresence>
          {fail && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute inset-x-4 bottom-3 rounded-xl border border-rose-300/30 bg-rose-500/15 px-3 py-1.5 text-center text-sm font-extrabold text-rose-200">
              Uh oh — {cast.find((c) => c.id === fail[0])?.emoji} and {cast.find((c) => c.id === fail[1])?.emoji} can't be left alone! Starting over…
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" data-row-btn onClick={row} disabled={s.rowing || !!fail}
          className="flex h-12 touch-manipulation items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-6 font-extrabold text-cyan-200 transition-colors hover:bg-cyan-400/25 disabled:opacity-40">
          🛶 Row across!
        </button>
        <p className="max-w-[190px] text-xs font-bold text-slate-500">
          {s.passenger ? 'Passenger aboard — row!' : 'Tap a friend on your bank to load the boat (or row alone).'}
        </p>
      </div>
    </div>
  );
}
