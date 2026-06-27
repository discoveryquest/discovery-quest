// Space Quest map — the shared engine-ui TrailMap + StationPopover, driven by the loaded
// course. Worlds (the four sectors) stack down a winding trail; tap a station to open the
// popover (Play / Learn it). Star-gating + frontier come from ./curriculum.js. Mirrors
// english/src/MapScreen.jsx. Painted per-world backgrounds drop in at public/map-art/<id>.webp.
import { useState } from 'react';
import { Star } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import TrailMap from '@discoveryquest/engine-ui/TrailMap';
import StationPopover from '@discoveryquest/engine-ui/StationPopover';
import { starsOf, isStationOpen, isWorldUnlocked, startWorldForAge, totalStars, maxStars, frontierStation } from './curriculum.js';

// Per-world station x-positions (%) tuned to the painted stepping-stones in each map-art
// panel. Indexed by station order, BOTTOM→TOP (station 0 sits at the bottom). The engine
// uses these only when a world's art is present; otherwise it falls back to the zigzag.
const TRAIL_X = {
  'backyard-sky': [48, 42, 46, 50, 49],
  'cosmic-neighborhood': [51, 42, 45, 55, 48],
  'deep-space': [54, 46, 42, 48, 45],
  'human-element': [56, 46, 42, 50, 48],
};

export default function MapScreen({ worlds, save, profile, onPlay, onLearn }) {
  const mood = useLivelyMood('idle');
  const talking = useSpeaking();
  const [picked, setPicked] = useState(null);
  const startWorld = startWorldForAge(profile?.age, worlds.length);
  // Attach the tuned station x-positions so nodes land on each painting's path.
  const mapWorlds = worlds.map((w) => (TRAIL_X[w.id] ? { ...w, trailX: TRAIL_X[w.id] } : w));

  const intro = (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-5">
      <div className="flex w-full items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Discovery Quest</p>
          <h1 className="text-2xl font-extrabold text-white">Space Quest</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-extrabold text-yellow-300">
          <Star size={15} className="fill-yellow-300 text-yellow-300" /> {totalStars(save, worlds)}/{maxStars(worlds)}
        </div>
      </div>
      <div className="mt-3 scale-90"><LunaOwl mood={mood} talking={talking} /></div>
    </div>
  );

  return (
    <div className="font-display relative min-h-full text-slate-200">
      <TrailMap
        worlds={mapWorlds}
        stateOf={(w, k, wIdx) => {
          if (w.stations[k].soon) return 'soon';
          if (!isWorldUnlocked(save, worlds, wIdx, startWorld)) return 'locked';
          return isStationOpen(save, w, k) ? 'open' : 'locked';
        }}
        starsOf={(st) => starsOf(save, st.id)}
        heroId={frontierStation(save, worlds, startWorld)}
        heroAvatar={profile?.avatar || '🚀'}
        onPick={setPicked}
        intro={intro}
        collapsedBelow={startWorld}
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
