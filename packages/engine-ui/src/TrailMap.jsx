import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Star, ChevronDown } from 'lucide-react';
import { ROW, zigzag, yOf, trailPathD } from './trailPath.js';
import Emoji from './Emoji.jsx';

const artCache = {};
function useWorldArt(id, explicit) {
  const [url, setUrl] = useState(explicit || artCache[id] || null);
  useEffect(() => {
    if (explicit) { setUrl(explicit); return; }
    if (artCache[id] !== undefined) { setUrl(artCache[id]); return; }
    const tryLoad = (ext, next) => {
      const img = new Image();
      img.onload = () => { artCache[id] = img.src; setUrl(img.src); };
      img.onerror = next || (() => { artCache[id] = null; });
      img.src = `/map-art/${id}.${ext}`;
    };
    tryLoad('webp', () => tryLoad('png', null));
  }, [id, explicit]);
  return url;
}

function StarsRow({ n, size = 12 }) {
  return (
    <div className="flex justify-center gap-0.5">
      {[0, 1, 2].map((k) => (
        <Star key={k} size={size} className={k < n ? 'fill-yellow-300 text-yellow-300' : 'text-slate-600'} />
      ))}
    </div>
  );
}

function WorldSection({ world, wIdx, stateOf, starsOf, heroId, heroAvatar, onPick, decorationOf }) {
  const art = useWorldArt(world.id, world.art);
  const n = world.stations.length;
  const H = n * ROW;
  const xOf = (k) => (art && world.trailX?.[k]) || zigzag(k);
  const pts = world.stations.map((_, k) => [xOf(k), yOf(k, n)]);
  const path = trailPathD(pts);
  // Banner tally counts only NON-soon stations (matches math's isPlayable filter; english/EFL
  // have no soon stations so this counts all of them).
  const denomStations = world.stations.filter((_, k) => stateOf(world, k, wIdx) !== 'soon');
  const worldStars = world.stations.reduce((a, st) => a + (starsOf(st) || 0), 0);

  return (
    <section
      className="relative mx-auto w-full max-w-md rounded-3xl"
      style={art
        ? { backgroundImage: `linear-gradient(rgba(10,12,16,0.42), rgba(10,12,16,0.5)), url(${art})`, backgroundSize: '100% 100%' }
        : { background: `radial-gradient(ellipse 90% 60% at 50% 30%, ${world.color}0e, transparent 75%)` }}
    >
      <div className="sticky top-14 z-20 mx-3 flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-md"
           style={{ background: '#141822dd', borderColor: world.color + '44' }}>
        <Emoji char={world.emoji} className="text-2xl" />
        <h2 className="text-lg font-extrabold" style={{ color: world.color }}>{world.title}</h2>
        <span className="ml-auto flex items-center gap-1 font-mono text-sm font-bold text-slate-300">
          <Star size={13} className="fill-yellow-300 text-yellow-300" />
          {worldStars}/{denomStations.length * 3}
        </span>
      </div>

      <div className="relative" style={{ height: H }}>
        {decorationOf?.(world, H)}
        {!art && (
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
            <path d={path} fill="none" stroke={world.color} strokeOpacity="0.25" strokeWidth="3"
                  strokeDasharray="0.5 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        {world.stations.map((st, k) => {
          const state = stateOf(world, k, wIdx);
          const stars = starsOf(st) || 0;
          const isHero = heroId === st.id;
          return (
            <div key={st.id} className="absolute -translate-x-1/2 -translate-y-1/2"
                 style={{ left: `${xOf(k)}%`, top: yOf(k, n) }}>
              {isHero && (
                <motion.div className={`absolute -top-7 z-10 ${xOf(k) < 50 ? 'left-12' : 'right-12'}`}
                  animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-300/70 bg-[#101d22] text-xl shadow-[0_0_18px_rgba(34,211,238,0.5)]">
                    {heroAvatar}
                  </div>
                </motion.div>
              )}
              <motion.button type="button" data-station={st.id} whileTap={{ scale: 0.9 }}
                onClick={() => onPick({ world, wIdx, station: st, sIdx: k, state, stars })}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl transition-all ${
                  state === 'open' ? 'bg-[#171b28]'
                    : state === 'locked' ? 'border-white/10 bg-white/4 grayscale'
                    : 'border-dashed border-white/15 bg-white/4 opacity-70'}`}
                style={state === 'open' ? { borderColor: world.color, boxShadow: `0 0 22px ${world.color}55` } : undefined}>
                {state === 'locked' ? <Lock size={20} className="text-slate-500" /> : <Emoji char={st.icon} />}
                {state === 'open' && stars === 0 && (
                  <motion.span className="absolute inset-[-5px] rounded-full border-2" style={{ borderColor: world.color + '88' }}
                    animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }} transition={{ repeat: Infinity, duration: 1.8 }} />
                )}
              </motion.button>
              <div className="absolute left-1/2 top-full z-[2] mt-2 flex w-max -translate-x-1/2 flex-col items-center gap-1">
                <span className="whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold backdrop-blur-sm"
                  style={{ background: '#0a0d13e6', borderColor: state === 'open' ? world.color + 'aa' : '#ffffff1f', color: state === 'open' ? '#e8edf7' : '#94a3b8' }}>
                  {st.title}
                </span>
                {state === 'soon'
                  ? <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">coming soon</span>
                  : <StarsRow n={stars} />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Collapsed stand-in for an "earlier / younger-kid" world: a compact, tappable chip.
// Tapping expands it back into a full WorldSection. Shows the world's earned-star tally so
// progress isn't hidden.
function WorldChip({ world, starsOf, hint, onExpand }) {
  const worldStars = world.stations.reduce((a, st) => a + (starsOf(st) || 0), 0);
  return (
    <button
      type="button"
      onClick={onExpand}
      className="mx-auto flex w-full max-w-md items-center gap-3 rounded-3xl border px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-white/5"
      style={{ background: '#141822cc', borderColor: world.color + '33' }}
    >
      <Emoji char={world.emoji} className="text-2xl opacity-80" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-extrabold" style={{ color: world.color }}>{world.title}</span>
        <span className="block text-[11px] font-bold text-slate-500">{hint}</span>
      </span>
      {worldStars > 0 && (
        <span className="flex items-center gap-1 font-mono text-xs font-bold text-slate-400">
          <Star size={12} className="fill-yellow-300 text-yellow-300" />{worldStars}
        </span>
      )}
      <ChevronDown size={18} className="text-slate-500" />
    </button>
  );
}

export default function TrailMap({ worlds, stateOf, starsOf, heroId, heroAvatar, onPick, decorationOf, intro, collapsedBelow = 0, collapsedHint = 'For younger explorers' }) {
  const [expanded, setExpanded] = useState(() => new Set()); // world ids manually opened (session-only)
  // Scroll the frontier (hero) station into view on mount — preserves math's heroRef behavior
  // and gives english/EFL the same nicety. data-station is on every node button.
  // If the hero's world is age-collapsed into a chip, expand it first — coming
  // back from a finished mission must always land on the next step, even for
  // older profiles whose early worlds are compacted.
  useEffect(() => {
    if (!heroId) return;
    const heroWorld = worlds.find((w) => (w.stations ?? []).some((st) => st.id === heroId));
    if (heroWorld && worlds.indexOf(heroWorld) < collapsedBelow) {
      setExpanded((s) => (s.has(heroWorld.id) ? s : new Set(s).add(heroWorld.id)));
    }
    const t = setTimeout(() => {
      document.querySelector(`[data-station="${heroId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 350);
    return () => clearTimeout(t);
  }, [heroId, worlds, collapsedBelow]);

  return (
    <main className="relative z-10 flex flex-col gap-8 pb-28 pt-6">
      {intro}
      {worlds.map((w, i) => ({ w, i })).reverse().map(({ w, i }) =>
        i < collapsedBelow && !expanded.has(w.id) ? (
          <WorldChip key={w.id} world={w} starsOf={starsOf} hint={collapsedHint}
            onExpand={() => setExpanded((s) => new Set(s).add(w.id))} />
        ) : (
          <WorldSection key={w.id} world={w} wIdx={i} stateOf={stateOf} starsOf={starsOf}
            heroId={heroId} heroAvatar={heroAvatar} onPick={onPick} decorationOf={decorationOf} />
        ),
      )}
    </main>
  );
}
