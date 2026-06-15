import { AnimatePresence, motion } from 'framer-motion';
import { Star, X } from 'lucide-react';

const DEFAULT_STRINGS = {
  play: 'Play',
  learn: 'Learn it',
  lockedMsg: 'Earn a star at the previous station to unlock this!',
  soonMsg: 'Coming soon!',
};

function StarsRow({ n, size = 22 }) {
  return (
    <div className="flex justify-center gap-0.5">
      {[0, 1, 2].map((k) => (
        <Star key={k} size={size} className={k < n ? 'fill-yellow-300 text-yellow-300' : 'text-slate-600'} />
      ))}
    </div>
  );
}

// Minimal, dismissable station popover shared by english + EFL. Purely presentational:
// the parent owns gating (state) and the play/learn handlers.
//   picked = { world, station, state, stars }  (the TrailMap onPick payload)
export default function StationPopover({ picked, onClose, onPlay, onLearn, strings }) {
  const s = { ...DEFAULT_STRINGS, ...strings };
  const hasLesson = !!(picked && (picked.station.lessonId || picked.station.lesson));
  const showLearn = picked?.state === 'open' && !!onLearn && hasLesson;

  return (
    <AnimatePresence>
      {picked && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="pointer-events-auto relative w-full max-w-[340px] rounded-3xl border-2 bg-[#14171f] p-6 text-center shadow-2xl"
              style={{ borderColor: picked.world.color + '55' }}
              initial={{ scale: 0.6, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
              <div className="text-5xl">{picked.station.icon}</div>
              <h3 className="mt-2 text-xl font-extrabold text-white">{picked.station.title}</h3>
              <div className="mt-2 flex justify-center">
                <StarsRow n={picked.stars} size={22} />
              </div>

              {picked.state === 'open' && (
                <div className="mt-5 flex gap-2.5">
                  {showLearn && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onLearn(picked.station)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-3 text-base font-extrabold text-slate-900 shadow-[0_0_24px_rgba(255,185,83,0.4)] transition-colors hover:bg-amber-300"
                    >
                      📖 {s.learn}
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onPlay(picked.station)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-base font-extrabold text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition-colors hover:bg-cyan-300"
                  >
                    ▶ {s.play}
                  </motion.button>
                </div>
              )}

              {picked.state === 'locked' && (
                <p className="mt-3 text-sm font-bold text-slate-400">🔒 {s.lockedMsg}</p>
              )}
              {picked.state === 'soon' && (
                <p className="mt-3 text-sm font-bold text-slate-400">🚧 {s.soonMsg}</p>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
