// Logic Quest map — the shared engine-ui QuestHeader + TrailMap + StationPopover,
// driven by the loaded course. Identical infrastructure to Math/English/Space
// (cross-course consistency directive); only the branding differs. v1 has no
// Learn-it lessons, so the popover shows Play only. Painted per-world
// backgrounds drop in at public/map-art/<id>.webp when they exist.
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import QuestHeader from '@discoveryquest/engine-ui/QuestHeader';
import HeroBadge from '@discoveryquest/engine-ui/HeroBadge';
import StarBreakdownSheet from '@discoveryquest/engine-ui/StarBreakdownSheet';
import TrailMap from '@discoveryquest/engine-ui/TrailMap';
import StationPopover from '@discoveryquest/engine-ui/StationPopover';
import { loadSave } from '@discoveryquest/engine/save';
import { computeXp, heroProgress } from '@discoveryquest/engine/xp';
import { ACCOUNT_DASHBOARD_URL } from '@discoveryquest/engine/links';
import { starsOf, isStationOpen, isWorldUnlocked, startWorldForAge, totalStars, frontierStation, playableStationIds } from './curriculum.js';

export default function MapScreen({ worlds, save, profile, onPlay, onSwitchPlayer }) {
  const mood = useLivelyMood('idle');
  const talking = useSpeaking();
  const [picked, setPicked] = useState(null);
  const [showStars, setShowStars] = useState(false);
  const startWorld = startWorldForAge(profile?.age, worlds.length);
  const hero = heroProgress(computeXp(loadSave()));

  const intro = (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-5">
      <div className="w-full">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Discovery Quest</p>
        <h1 className="text-2xl font-extrabold text-white">Logic Quest</h1>
      </div>
      <div className="mt-3 scale-90"><LunaOwl mood={mood} talking={talking} /></div>
    </div>
  );

  return (
    <div className="font-display relative min-h-full text-slate-200">
      <QuestHeader
        brand={<>Logic <span className="text-amber-300">Quest</span></>}
        heroSlot={<HeroBadge level={hero.level} pct={hero.pct} />}
        accountSlot={
          <a href={ACCOUNT_DASHBOARD_URL}
            className="flex h-9 shrink-0 items-center rounded-xl border border-white/10 bg-white/5 px-2.5 text-sm font-extrabold text-slate-300 transition-colors hover:bg-white/10">
            Parents
          </a>
        }
        onGrownUps={() => window.location.assign(ACCOUNT_DASHBOARD_URL)}
        onSwitchPlayer={onSwitchPlayer}
        statsSlot={
          <button type="button" onClick={() => setShowStars(true)} data-testid="star-chip"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-extrabold text-yellow-300 transition-colors hover:bg-white/10">
            <Star size={15} className="fill-yellow-300/50" />{totalStars(save, worlds)}
          </button>
        }
      />
      <TrailMap
        worlds={worlds}
        stateOf={(w, k, wIdx) => {
          if (w.stations[k].soon) return 'soon';
          if (!isWorldUnlocked(save, worlds, wIdx, startWorld)) return 'locked';
          return isStationOpen(save, w, k) ? 'open' : 'locked';
        }}
        starsOf={(st) => starsOf(save, st.id)}
        heroId={frontierStation(save, worlds, startWorld)}
        heroAvatar={profile?.avatar || '🧩'}
        onPick={setPicked}
        intro={intro}
        collapsedBelow={startWorld}
      />
      <StationPopover
        picked={picked}
        onClose={() => setPicked(null)}
        onPlay={(st) => { setPicked(null); onPlay(st); }}
      />
      <AnimatePresence>
        {showStars && (
          <StarBreakdownSheet
            onClose={() => setShowStars(false)}
            save={save}
            stationIds={playableStationIds(worlds)}
            courseLabel="Logic"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
