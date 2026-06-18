// "Who's the hero?" — choose an existing profile (shared identity across courses)
// or create a new one. Presentational; host supplies profiles + callbacks.
import Emoji from './Emoji.jsx';
import HeroBadge from './HeroBadge.jsx';
import { totalXp, heroProgress } from '@discoveryquest/engine/xp';

export default function ProfilePicker({ profiles = [], onPick, onNew, onCancel, labels = {} }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
      <h1 className="font-display text-3xl font-extrabold text-white">{labels.title || "Who's the hero?"}</h1>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {profiles.map((p) => {
          // Cross-course hero badge: only profiles that have earned XP carry xpByCourse
          // (mergeRoster drops it at zero), so this surfaces only after a signed-in pull.
          const hero = p.xpByCourse ? heroProgress(totalXp(p.xpByCourse)) : null;
          return (
            <button key={p.id} type="button" data-testid="profile-pick" onClick={() => onPick(p.id)}
              className="flex flex-col items-center gap-2 rounded-3xl border-2 border-white/10 bg-white/5 p-5 hover:bg-white/10">
              <span className="text-5xl"><Emoji char={p.avatar || '🦊'} /></span>
              <span className="font-display font-extrabold text-white">{p.name || labels.unnamed || 'Hero'}</span>
              {hero && <HeroBadge level={hero.level} pct={hero.pct} />}
            </button>
          );
        })}
        <button type="button" data-testid="profile-new" onClick={onNew}
          className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-cyan-300/40 bg-cyan-400/5 p-5 text-cyan-200 hover:bg-cyan-400/10">
          <span className="text-5xl">＋</span>
          <span className="font-display font-extrabold">{labels.newHero || 'New hero'}</span>
        </button>
      </div>
      {onCancel && <button type="button" onClick={onCancel} className="text-sm font-bold text-slate-500 hover:text-slate-300">{labels.cancel || 'Back'}</button>}
    </div>
  );
}
