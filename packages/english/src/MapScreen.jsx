// English Quest map — the shared bottom-to-top TrailMap + StationPopover. Driven by the
// LOADED course: `worlds` come from course.worlds (station.{id,icon,title,sub,lessonId,soon}).
// Worlds stack down a winding dashed path; `soon` worlds/stations show "in construction".
// Star-gating + frontier come from ./curriculum.js. The header + Luna intro fill TrailMap's
// `intro` slot; a single tap (onPick) opens the shared StationPopover.
import { useState } from 'react';
import { Star, Hammer } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import TrailMap from '@discoveryquest/engine-ui/TrailMap';
import StationPopover from '@discoveryquest/engine-ui/StationPopover';
import { starsOf, isStationOpen, totalStars, maxStars, frontierStation } from './curriculum.js';

export default function MapScreen({ worlds, save, onPlay, onLearn }) {
  const mood = useLivelyMood('idle');
  const talking = useSpeaking();
  const [picked, setPicked] = useState(null);

  const intro = (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-5">
      <div className="flex w-full items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Discovery Quest</p>
          <h1 className="text-2xl font-extrabold text-white">English Quest</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-extrabold text-yellow-300">
          <Star size={15} className="fill-yellow-300 text-yellow-300" /> {totalStars(save, worlds)}/{maxStars(worlds)}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1.5 text-center text-xs font-extrabold text-amber-200">
        <Hammer size={14} className="shrink-0" /> Under construction — more worlds on the way!
      </div>

      <div className="mt-3 scale-90"><LunaOwl mood={mood} talking={talking} /></div>
    </div>
  );

  return (
    <div className="font-display relative min-h-full text-slate-200">
      <TrailMap
        worlds={worlds}
        stateOf={(w, k) => (w.stations[k].soon ? 'soon' : isStationOpen(save, w, k) ? 'open' : 'locked')}
        starsOf={(st) => starsOf(save, st.id)}
        heroId={frontierStation(save, worlds)}
        heroAvatar={'🦉'}
        onPick={setPicked}
        intro={intro}
      />
      <StationPopover
        picked={picked}
        onClose={() => setPicked(null)}
        onPlay={(st) => { setPicked(null); onPlay(st); }}
        onLearn={onLearn ? (st) => { setPicked(null); onLearn(st); } : undefined}
      />
    </div>
  );
}
