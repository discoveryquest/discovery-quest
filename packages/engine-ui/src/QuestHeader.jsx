// The one consistent quest-map header shared by every course. Course-specific bits
// are slots; the actions (More quests + settings) are baked in so they behave
// identically everywhere.
//   brand      — title node (course name/accent)
//   heroSlot   — <HeroBadge> (account-gated XP), injected by the app
//   statsSlot  — course stats chips (math ⭐+💎, English ⭐, EFL none)
//   accountSlot— sign-in / user button, injected by the app shell
//   extras     — extra settings rows (math injects its music toggle)
//   soundLabel — overrides the settings sound-toggle label (default keeps "Luna…")
// Actions: onMoreQuests (runs on confirm; when given, catalogUrl is ignored — defaults
//   to navigating to the catalog otherwise, always behind the confirm),
//   onGrownUps / onSwitchPlayer (passed to the settings sheet), onSettingsClosed,
//   catalogUrl (optional override of the default catalog target).
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Home } from 'lucide-react';
import { resolveCatalogUrl } from '@discoveryquest/engine/links';
import QuestSettingsSheet from './QuestSettingsSheet.jsx';

export default function QuestHeader({
  brand,
  heroSlot = null,
  statsSlot = null,
  accountSlot = null,
  extras = null,
  soundLabel,
  onMoreQuests,
  onGrownUps,
  onSwitchPlayer,
  onSettingsClosed,
  catalogUrl,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (!confirmLeave) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setConfirmLeave(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmLeave]);

  function leave() {
    setConfirmLeave(false);
    if (onMoreQuests) onMoreQuests();
    else window.location.assign(resolveCatalogUrl(catalogUrl));
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/5 bg-[#0e1014]/90 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-6 sm:py-3">
        <Sparkles className="shrink-0 text-cyan-300" size={20} />
        <h1 className="truncate text-base font-extrabold tracking-wide text-white sm:text-xl">{brand}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {heroSlot}
          {statsSlot}
          {accountSlot}
          <button
            type="button"
            aria-label="More quests"
            onClick={() => setConfirmLeave(true)}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 text-sm font-extrabold text-slate-300 transition-colors hover:bg-white/10"
          >
            <Home size={16} />
            <span className="hidden sm:inline">More quests</span>
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-slate-300 transition-colors hover:bg-white/10"
          >
            ⚙️
          </button>
        </div>
      </header>

      <AnimatePresence>
        {confirmLeave && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmLeave(false)} />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="pointer-events-auto w-full max-w-[340px] rounded-3xl border border-white/10 bg-[#14171f] p-6 text-center shadow-2xl"
                role="dialog" aria-modal="true" aria-labelledby="quest-header-leave-title"
                initial={{ scale: 0.7, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.75, y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <p id="quest-header-leave-title" className="text-lg font-extrabold text-white">Leave to pick another quest?</p>
                <p className="mt-1 text-sm font-bold text-slate-400">Your progress is saved.</p>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setConfirmLeave(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-extrabold text-slate-200 hover:bg-white/10">
                    Cancel
                  </button>
                  <button type="button" onClick={leave} className="flex-1 rounded-xl bg-cyan-400 px-4 py-2.5 font-extrabold text-slate-900 hover:bg-cyan-300">
                    Yes, let's go!
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <QuestSettingsSheet
            extras={extras}
            soundLabel={soundLabel}
            onGrownUps={onGrownUps}
            onSwitchPlayer={onSwitchPlayer}
            onClose={(changed) => {
              setSettingsOpen(false);
              onSettingsClosed?.(changed);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
