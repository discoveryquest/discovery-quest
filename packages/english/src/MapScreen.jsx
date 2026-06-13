// English Quest map — a small journey/trail (consistent with math's map idea). Worlds are
// regions stacked down a winding path; stations are nodes alternating left/right. Phonics
// Cove is playable; other worlds are "in construction" (dimmed, "Soon"). The `.eq-map-bg`
// layer is an empty backdrop ready for a drawn background later (drop a background-image on
// it). Save-driven: stars + unlock come from @discoveryquest/engine.
import { motion } from 'framer-motion';
import { Star, Lock, BookOpen, Hammer } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import { WORLDS, starsOf, isStationOpen, totalStars, MAX_STARS } from './curriculum.js';

function Stars({ n, size = 13 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((k) => (
        <Star key={k} size={size} className={k < n ? 'fill-yellow-300 text-yellow-300' : 'text-slate-600'} />
      ))}
    </span>
  );
}

function StationNode({ st, open, stars, side, onPlay, onLearn }) {
  const playable = !st.soon;
  return (
    <div className={`flex w-full items-center ${side === 'L' ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className="flex flex-col items-center" style={{ width: 132 }}>
        <button
          type="button"
          disabled={!open}
          onClick={() => open && onPlay(st)}
          className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl shadow-lg transition-transform ${
            open ? 'border-cyan-300/60 bg-[#1b2030] hover:scale-105' : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          {open ? st.icon : <Lock size={20} className="text-slate-500" />}
        </button>
        <span className={`mt-1.5 text-center text-xs font-extrabold ${open ? 'text-white' : 'text-slate-500'}`}>{st.title}</span>
        <span className="text-center text-[10px] font-bold text-slate-500">{st.sub}</span>
        <span className="mt-1 flex items-center gap-1.5">
          {playable ? <Stars n={stars} /> : <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Soon</span>}
          {open && st.lesson && onLearn && (
            <button
              type="button"
              aria-label="Learn it"
              onClick={() => onLearn(st)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-amber-300/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
            >
              <BookOpen size={12} />
            </button>
          )}
        </span>
      </div>
      <div className="h-px flex-1" />
    </div>
  );
}

export default function MapScreen({ save, onPlay, onLearn }) {
  const mood = useLivelyMood('idle');
  const talking = useSpeaking();

  return (
    <div className="font-display relative min-h-full text-slate-200">
      {/* backdrop layer — swap in a drawn map background later via background-image */}
      <div className="eq-map-bg pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[460px] w-[460px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[460px] w-[460px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-md flex-col items-center px-5 py-6">
        {/* header */}
        <div className="flex w-full items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Discovery Quest</p>
            <h1 className="text-2xl font-extrabold text-white">English Quest</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-extrabold text-yellow-300">
            <Star size={15} className="fill-yellow-300 text-yellow-300" /> {totalStars(save)}/{MAX_STARS}
          </div>
        </div>

        {/* work-in-progress badge */}
        <div className="mt-3 flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1.5 text-center text-xs font-extrabold text-amber-200">
          <Hammer size={14} className="shrink-0" /> Under construction — Phonics is open, more worlds on the way!
        </div>

        <div className="mt-3 scale-90"><LunaOwl mood={mood} talking={talking} /></div>

        {/* the trail: each world is a region; stations zig-zag down a dashed path */}
        <div className="mt-2 flex w-full flex-col gap-7">
          {WORLDS.map((world) => (
            <section key={world.id} className={`relative rounded-3xl border p-4 ${world.soon ? 'border-white/5 bg-white/[0.02]' : 'border-white/10 bg-white/[0.04]'}`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl" style={{ filter: world.soon ? 'grayscale(0.7)' : 'none', opacity: world.soon ? 0.6 : 1 }}>{world.emoji}</span>
                <h2 className="text-lg font-extrabold" style={{ color: world.soon ? '#94a3b8' : world.color }}>{world.title}</h2>
                {world.soon && <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Coming soon</span>}
              </div>
              <p className="mb-3 text-xs font-bold text-slate-500">{world.blurb}</p>

              {/* dashed center path */}
              <div className="relative">
                <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2" style={{ background: 'repeating-linear-gradient(#ffffff22 0 6px, transparent 6px 14px)' }} />
                <div className="relative flex flex-col gap-3">
                  {world.stations.map((st, i) => (
                    <motion.div
                      key={st.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (i % 4) * 0.05 }}
                    >
                      <StationNode
                        st={st}
                        open={isStationOpen(save, world, i)}
                        stars={starsOf(save, st.id)}
                        side={i % 2 === 0 ? 'L' : 'R'}
                        onPlay={onPlay}
                        onLearn={onLearn}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
