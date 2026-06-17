// Compact hero-level chip + progress bar. Presentational: the host computes level/pct
// (own-course XP signed-out, cross-course roster sum signed-in). See engine xp.js heroProgress.
export default function HeroBadge({ level, pct = 0, label = 'Lv' }) {
  return (
    <div data-testid="hero-badge" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
      <span className="font-display text-sm font-extrabold text-yellow-200">⭐ {label} {level}</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full rounded-full bg-yellow-300" style={{ width: `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%` }} />
      </span>
    </div>
  );
}
