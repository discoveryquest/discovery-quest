// "Where did my stars come from?" — the kid-facing breakdown Pavel asked for at
// the founding: tap the star tally and see XP by source, plus the course Hero
// badge (a star on every station) and, when signed in, the cross-course Super
// Hero meta-badge. Presentational + pure: the host passes the local save, the
// course's playable station ids, and (signed-in) a cross-course bundle.
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Trophy, Sparkles } from 'lucide-react';
import { xpBreakdown, computeXp, heroProgress } from '@discoveryquest/engine/xp';
import { courseBadge, superHero } from '@discoveryquest/engine/badges';

const SOURCES = [
  { key: 'stars', icon: '⭐', label: 'Stars earned' },
  { key: 'correct', icon: '✅', label: 'Correct answers' },
  { key: 'concepts', icon: '📖', label: 'New things learned' },
  { key: 'streak', icon: '🔥', label: 'Days you played' },
  { key: 'reviews', icon: '🔁', label: 'Practice reviews' },
];

export default function StarBreakdownSheet({
  onClose,
  save,
  stationIds = [],
  courseLabel = 'this quest',
  crossCourse = null, // signed-in: { xpByCourse:{id:xp}, badgesByCourse:{id:badge}, courseNames:{id:name} }
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const breakdown = xpBreakdown(save);
  const badge = courseBadge(save, stationIds);
  // Level/progress: own-course XP signed-out, cross-course roster sum signed-in.
  const xp = crossCourse
    ? Object.values(crossCourse.xpByCourse || {}).reduce((a, n) => a + (n || 0), 0)
    : computeXp(save);
  const { level, pct } = heroProgress(xp);
  const sup = crossCourse ? superHero(crossCourse.badgesByCourse || {}) : null;
  const rows = SOURCES.filter((s) => breakdown[s.key] > 0);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm font-display"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] rounded-3xl border-2 border-yellow-300/25 bg-[#14171f] p-5 text-slate-200 shadow-2xl"
      >
        <button type="button" aria-label="Close" onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>

        {/* Hero level + total */}
        <div className="mb-4 flex flex-col items-center gap-1 text-center">
          <span className="font-display text-lg font-extrabold text-yellow-200">⭐ Hero Level {level}</span>
          <span className="text-2xl font-black text-white">{xp.toLocaleString()} XP</span>
          <span className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400"
              style={{ width: `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%` }} />
          </span>
          {crossCourse && <span className="text-[11px] font-bold text-slate-400">across all your quests</span>}
        </div>

        {/* XP by source */}
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">Where it came from</p>
        <ul className="mb-4 space-y-1.5" data-testid="xp-sources">
          {rows.length ? rows.map((s) => (
            <li key={s.key} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-200"><span aria-hidden>{s.icon}</span>{s.label}</span>
              <span className="font-black text-yellow-200">+{breakdown[s.key].toLocaleString()}</span>
            </li>
          )) : <li className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-slate-400">Play a quest to earn your first stars!</li>}
        </ul>

        {/* Course Hero badge */}
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${badge.gold ? 'border-yellow-300/50 bg-yellow-400/10' : badge.earned ? 'border-cyan-300/40 bg-cyan-400/10' : 'border-white/10 bg-white/5'}`}>
          <Trophy size={26} className={badge.gold ? 'text-yellow-300' : badge.earned ? 'text-cyan-300' : 'text-slate-500'} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-white">
              {badge.gold ? `${courseLabel} Hero — GOLD!` : badge.earned ? `${courseLabel} Hero!` : `${courseLabel} Hero`}
            </p>
            <p className="text-[11px] font-bold text-slate-400">
              {badge.earned
                ? (badge.gold ? 'Every station at 3 stars — perfect!' : 'A star on every station. Go for all 3★ to make it gold!')
                : `${badge.starred} / ${badge.total} stations starred`}
            </p>
          </div>
          {!badge.earned && badge.total > 0 && (
            <span className="flex items-center gap-1 text-xs font-black text-slate-300"><Star size={12} className="fill-yellow-300/60" />{badge.starred}/{badge.total}</span>
          )}
        </div>

        {/* Super Hero (cross-course, signed-in) */}
        {sup && (
          <div className={`mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3 ${sup.earned ? 'border-fuchsia-300/50 bg-fuchsia-500/10' : 'border-white/10 bg-white/5'}`}>
            <Sparkles size={26} className={sup.earned ? 'text-fuchsia-300' : 'text-slate-500'} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white">{sup.earned ? 'Super Hero! 🦸' : 'Super Hero'}</p>
              <p className="text-[11px] font-bold text-slate-400">
                {sup.earned ? 'Hero on 3 quests — amazing!' : `Hero badges on ${sup.heroCount} / 3 quests`}
              </p>
            </div>
          </div>
        )}
        {!crossCourse && (
          <p className="mt-3 text-center text-[11px] font-bold text-slate-500">Sign in to earn XP across every quest and become a Super Hero!</p>
        )}
      </motion.div>
    </motion.div>
  );
}
