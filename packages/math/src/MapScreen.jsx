// The world map — home screen of Luna's Math Quest (GDD §8.1).
// Ten themed worlds stacked vertically; stations zigzag along a dashed path.
// The hero token bobs at the furthest unlocked station; tapping a station
// opens a popover with stars + Play. Locked/coming-soon stations explain
// themselves kindly instead of refusing silently.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Star, X, Play, Sparkles, Gem } from 'lucide-react';
import {
  WORLDS, stationState, isWorldUnlocked, worldStars, heroStation, isPlayable,
} from './curriculum.js';
import { loadSave, mutateSave } from '@discoveryquest/engine/save';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import { VOICE_LINES } from './voiceLines.js';
import { speak, hushAll } from '@discoveryquest/voice-kit/audio';
import { playMusic, pauseMusic, resumeMusic } from './music.js';
import ConceptScreen, { CONCEPTS, conceptIdFor } from './concepts.jsx';
import LessonScreen from '@discoveryquest/engine-ui/LessonScreen';
import { LESSONS, renderLessonView } from './lessons.jsx';
import { voiceKey } from './voiceLines.js';
import { brandOwner } from './brand.js';
import SettingsSheet from './SettingsSheet.jsx';
import TUTORIALS from './tutorials.json';

let welcomedThisSession = false;

// Painted world panels (docs/map-art-prompts.md): if public/map-art/<id>.webp
// (or .png) exists it becomes the section background; otherwise the tint stays.
const artCache = {};
function useWorldArt(id) {
  const [url, setUrl] = useState(artCache[id] || null);
  useEffect(() => {
    if (artCache[id] !== undefined) return;
    const tryLoad = (ext, next) => {
      const img = new Image();
      img.onload = () => {
        artCache[id] = img.src;
        setUrl(img.src);
      };
      img.onerror = next || (() => { artCache[id] = null; });
      img.src = `/map-art/${id}.${ext}`;
    };
    tryLoad('webp', () => tryLoad('png', null));
  }, [id]);
  return url;
}

// Ambient motes per world biome: twinkling stars in the sky worlds, drifting
// motes elsewhere. Rendered once per section, between the art and the nodes.
const AMBIENT = {
  'number-meadow': { kind: 'float', color: '#fde68a', n: 9 },
  'place-value-peaks': { kind: 'float', color: '#a5f3fc', n: 8 },
  'carry-canyon': { kind: 'float', color: '#fed7aa', n: 7 },
  'times-table-trail': { kind: 'float', color: '#fdba74', n: 8 },
  'multiplication-mountain': { kind: 'twinkle', color: '#ddd6fe', n: 9 },
  'fraction-forest': { kind: 'float', color: '#bbf7d0', n: 10 },
  'decimal-docks': { kind: 'twinkle', color: '#a5f3fc', n: 10 },
  'measure-marsh': { kind: 'float', color: '#fbcfe8', n: 10 },
  'geometry-galaxy': { kind: 'twinkle', color: '#e9d5ff', n: 16 },
  'word-problem-wilds': { kind: 'float', color: '#fde68a', n: 8 },
};

// Deterministic per-section motes (stable across renders, no layout thrash).
function AmbientLayer({ worldId, height }) {
  const cfg = AMBIENT[worldId];
  const motes = useMemo(() => {
    if (!cfg) return [];
    let seed = worldId.length * 97;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    return Array.from({ length: cfg.n }, () => {
      const size = cfg.kind === 'twinkle' ? 2 + rnd() * 3 : 4 + rnd() * 6;
      const dur = (cfg.kind === 'twinkle' ? 2.5 : 6) + rnd() * 4;
      return {
        left: `${6 + rnd() * 88}%`,
        top: `${rnd() * height}px`,
        size,
        dur,
        delay: rnd() * dur,
        anim: cfg.kind === 'twinkle' ? 'mote-twinkle' : 'mote-float',
      };
    });
  }, [worldId, height, cfg]);
  if (!cfg) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {motes.map((m, i) => (
        <span
          key={i}
          className="lqs-mote"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            background: cfg.color,
            boxShadow: `0 0 ${m.size * 2}px ${cfg.color}`,
            animation: `${m.anim} ${m.dur}s ease-in-out ${m.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

const ROW = 116;
const zigzag = (k) => (k % 2 === 0 ? 34 : 66); // fallback when a world has no art

// Painted-trail x positions (% of width) per station, charted from the art
// panels (index = station k, bottom-up). Background uses 100% 100% mapping so
// these hold at every viewport width.
const TRAIL_X = {
  'number-meadow': [42, 45, 60, 38, 55],
  'place-value-peaks': [50, 44, 58, 40, 52],
  'carry-canyon': [38, 58, 40, 55],
  'times-table-trail': [45, 55, 42, 55, 48],
  'multiplication-mountain': [42, 55, 45, 58],
  'fraction-forest': [48, 58, 42, 55, 45, 52, 48],
  'decimal-docks': [40, 55, 42, 52, 50, 35],
  'measure-marsh': [42, 53, 45, 52, 48],
  'geometry-galaxy': [42, 55, 58, 40, 40, 52],
  'word-problem-wilds': [42, 52, 47],
};

function StarsRow({ n, size = 12 }) {
  return (
    <div className="flex justify-center gap-0.5">
      {[0, 1, 2].map((k) => (
        <Star
          key={k}
          size={size}
          className={k < n ? 'fill-yellow-300 text-yellow-300' : 'text-slate-600'}
        />
      ))}
    </div>
  );
}

function WorldSection({ world, wIdx, save, onPick, heroAt, heroAvatar }) {
  const unlocked = isWorldUnlocked(save, wIdx);
  const art = useWorldArt(world.id);
  const playable = world.stations.filter(isPlayable);
  const H = world.stations.length * ROW;
  const yOf = (k) => (world.stations.length - 1 - k) * ROW + ROW / 2; // bottom-up
  const xOf = (k) => (art && TRAIL_X[world.id]?.[k]) || zigzag(k);
  const pts = world.stations.map((_, k) => [xOf(k), yOf(k)]);
  const path = pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [, py] = pts[i - 1];
      const my = (py + y) / 2;
      return `C ${pts[i - 1][0]} ${my}, ${x} ${my}, ${x} ${y}`;
    })
    .join(' ');

  return (
    <section
      className={`relative mx-auto w-full max-w-md rounded-3xl ${unlocked ? '' : 'opacity-60'}`}
      style={
        art
          ? {
              backgroundImage: `linear-gradient(rgba(10,12,16,0.42), rgba(10,12,16,0.5)), url(${art})`,
              backgroundSize: '100% 100%',
            }
          : { background: `radial-gradient(ellipse 90% 60% at 50% 30%, ${world.color}0e, transparent 75%)` }
      }
    >
      {/* world banner */}
      <div
        className="sticky top-14 z-20 mx-3 flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-md"
        style={{ background: '#141822dd', borderColor: world.color + '44' }}
      >
        <span className="text-2xl">{world.emoji}</span>
        <h2 className="text-lg font-extrabold" style={{ color: world.color }}>
          {world.title}
        </h2>
        <span className="ml-auto flex items-center gap-1 font-mono text-sm font-bold text-slate-300">
          {!unlocked && <Lock size={13} className="text-slate-500" />}
          {playable.length > 0 ? (
            <>
              <Star size={13} className="fill-yellow-300 text-yellow-300" />
              {worldStars(save, world)}/{playable.length * 3}
            </>
          ) : (
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">soon</span>
          )}
        </span>
      </div>

      {/* path + stations */}
      <div className="relative" style={{ height: H }}>
        {art && <AmbientLayer worldId={world.id} height={H} />}
        {!art && (
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
            <path d={path} fill="none" stroke={world.color} strokeOpacity="0.25" strokeWidth="3" strokeDasharray="0.5 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        {world.stations.map((st, k) => {
          const state = stationState(save, wIdx, k);
          const stars = save.stations[st.id]?.stars || 0;
          const isHero = heroAt && heroAt.w === wIdx && heroAt.s === k;
          return (
            <div
              key={st.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${xOf(k)}%`, top: yOf(k) }}
            >
              {isHero && (
                <motion.div
                  className={`absolute -top-7 z-10 ${xOf(k) < 50 ? 'left-12' : 'right-12'}`}
                  animate={{ y: [0, -7, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-300/70 bg-[#101d22] text-xl shadow-[0_0_18px_rgba(34,211,238,0.5)]">
                    {heroAvatar}
                  </div>
                </motion.div>
              )}
              <motion.button
                type="button"
                data-station={st.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPick({ station: st, wIdx, sIdx: k, state, stars, world })}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl transition-all ${
                  state === 'open'
                    ? 'bg-[#171b28]'
                    : state === 'locked'
                      ? 'border-white/10 bg-white/4 grayscale'
                      : 'border-dashed border-white/15 bg-white/4 opacity-70'
                }`}
                style={
                  state === 'open'
                    ? { borderColor: world.color, boxShadow: `0 0 22px ${world.color}55` }
                    : undefined
                }
              >
                {state === 'locked' ? <Lock size={20} className="text-slate-500" /> : st.icon}
                {state === 'open' && stars === 0 && (
                  <motion.span
                    className="absolute inset-[-5px] rounded-full border-2"
                    style={{ borderColor: world.color + '88' }}
                    animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  />
                )}
              </motion.button>
              {/* nameplate — a level marker kept BELOW the node (absolute, so
                  the node itself stays centered on the painted trail) and on a
                  solid plaque so it reads over busy art and never tucks under
                  the world banner. */}
              <div className="absolute left-1/2 top-full z-[2] mt-2 flex w-max -translate-x-1/2 flex-col items-center gap-1">
                <span
                  className="whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold backdrop-blur-sm"
                  style={{
                    background: '#0a0d13e6',
                    borderColor: state === 'open' ? world.color + 'aa' : '#ffffff1f',
                    color: state === 'open' ? '#e8edf7' : '#94a3b8',
                  }}
                >
                  {st.title}
                </span>
                {isPlayable(st) ? (
                  <StarsRow n={stars} />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">coming soon</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function MapScreen({ onPlay, onGrownUps, autoNext = false, accountSlot = null }) {
  const [mapKey, setMapKey] = useState(0);
  const [tutorial, setTutorial] = useState(null); // { station, thenPlay }
  const tutorialVideoRef = useRef(null); // so we can stop its audio on close
  const [concept, setConcept] = useState(null); // { id, then }
  const [lesson, setLesson] = useState(null); // { id, then } — beat-based lesson engine

  // Close the tutorial video: stop its baked-in audio IMMEDIATELY (it lives in
  // a <video>, not the Audio() queue, so hushAll can't reach it; and the modal
  // plays an exit animation that would otherwise keep it audible until unmount).
  const closeTutorial = (thenPlay, station) => {
    const v = tutorialVideoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
    hushAll(); // also stop any voice-kit narration the popup queued
    setTutorial(null);
    if (thenPlay && station) onPlay(station);
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [save, setSave] = useState(() => loadSave());
  const [picked, setPicked] = useState(null);
  const [bubble, setBubble] = useState(true);
  const heroAt = heroStation(save);
  const heroRef = useRef(null);
  const [lunaBase, setLunaBase] = useState('idle');
  const lunaMood = useLivelyMood(lunaBase);
  const lunaSpeaking = useSpeaking();
  const [lunaSays, setLunaSays] = useState('Where shall we explore today? Tap a glowing station!');
  const mapOwlArea = useRef(null);

  function lunaChat() {
    const i = Math.floor(Math.random() * VOICE_LINES.chat.length);
    setLunaSays(VOICE_LINES.chat[i]);
    setBubble(true);
    setLunaBase('cheer');
    speak(`chat-${i}`);
    setTimeout(() => setLunaBase('idle'), 1500);
    setTimeout(() => setBubble(false), 3500);
  }
  const totalStars = Object.values(save.stations).reduce((a, s) => a + (s.stars || 0), 0);

  // The tutorial video has its own baked narration — it must play alone, so
  // silence Luna for it. The concept screen, by contrast, WANTS Luna to
  // narrate (it hushes stale lines + speaks in its own mount effect), so we
  // must NOT hush it here — only pause the music so it doesn't fight her.
  // (Child effects run before parent effects; hushing here would cut off the
  // concept intro the screen just started.) Resume music when both close.
  useEffect(() => {
    if (tutorial) {
      hushAll();
      pauseMusic();
    } else if (concept || lesson) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  }, [tutorial, concept, lesson]);

  // First visit to a station with a tutorial: Luna solves one on video first.
  // Flow on first visit: Learn it (concept) → Watch one (video) → Practice.
  // Each step only appears if relevant/unseen; afterwards, straight to play.
  function afterConcept(station) {
    const seen = loadSave().tutorialSeen?.[station.id];
    if (TUTORIALS.includes(station.id) && !seen) {
      mutateSave((s) => {
        s.tutorialSeen = s.tutorialSeen || {};
        s.tutorialSeen[station.id] = true;
      });
      setPicked(null);
      setTutorial({ station, thenPlay: true });
      return;
    }
    onPlay(station);
  }

  function startStation(station) {
    // A beat-based lesson (when present) is the "Learn it" experience and
    // supersedes the static concept screen. Mark conceptSeen under the lesson
    // id so the legacy concept check below also treats it as taught.
    if (station.lesson && LESSONS[station.lesson] && !loadSave().conceptSeen?.[station.lesson]) {
      mutateSave((s) => {
        s.conceptSeen = s.conceptSeen || {};
        s.conceptSeen[station.lesson] = true;
      });
      setPicked(null);
      setLesson({ id: station.lesson, then: () => afterConcept(station) });
      return;
    }
    const cid = conceptIdFor(station);
    if (cid && CONCEPTS[cid] && !loadSave().conceptSeen?.[cid]) {
      mutateSave((s) => {
        s.conceptSeen = s.conceptSeen || {};
        s.conceptSeen[cid] = true;
      });
      setPicked(null);
      setConcept({ id: cid, then: () => afterConcept(station) });
      return;
    }
    afterConcept(station);
  }

  // Tapping a station: Luna says its name (or explains why it's not playable).
  function pickStation(info) {
    setPicked(info);
    if (info.state === 'open') {
      speak([`st-${info.station.id}`, voiceKey('pressplay', 0)], { important: true });
    } else if (info.state === 'locked') {
      speak(voiceKey('lockedmsg', 0));
    } else {
      speak(voiceKey('soonmsg', 0));
    }
  }

  useEffect(() => {
    playMusic('map');
    const t = setTimeout(() => heroRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
    const b = setTimeout(() => setBubble(false), 6000);
    if (!welcomedThisSession) {
      welcomedThisSession = true;
      speak(voiceKey('mapwelcome', 0), { important: true });
    }
    // "Next challenge" from the ceremony: open the frontier station for them
    let n;
    if (autoNext && heroAt) {
      n = setTimeout(() => {
        const world = WORLDS[heroAt.w];
        const station = world.stations[heroAt.s];
        pickStation({
          station,
          wIdx: heroAt.w,
          sIdx: heroAt.s,
          state: 'open',
          stars: save.stations[station.id]?.stars || 0,
          world,
        });
      }, 900);
    }
    return () => {
      clearTimeout(t);
      clearTimeout(b);
      clearTimeout(n);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-full select-none font-display text-slate-200">
      <div className="pointer-events-none fixed -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-purple-500/10 blur-[120px]" />

      {/* header */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/5 bg-[#0e1014]/90 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-6 sm:py-3">
        <Sparkles className="shrink-0 text-cyan-300" size={20} />
        <h1 className="truncate text-base font-extrabold tracking-wide text-white sm:text-xl">
          {brandOwner()} <span className="text-cyan-300">Math Quest</span>
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 font-mono text-sm font-bold leading-none tabular-nums text-yellow-300 sm:text-base">
            <Star size={15} className="fill-yellow-300/50" />
            {totalStars}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 font-mono text-sm font-bold leading-none tabular-nums text-cyan-200 sm:text-base" title="Memory Gems">
            <Gem size={15} className="fill-cyan-300/30" />
            {save.gems}
          </span>
          <span className="hidden h-9 w-9 items-center justify-center rounded-full border-2 border-cyan-300/40 bg-white/5 text-lg sm:flex">
            {save.profile.avatar}
          </span>
          {/* Account UI (sign-in / user button) is injected by the app shell via accountSlot,
              so the open library stays auth-agnostic (no Clerk dependency). */}
          {accountSlot}
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

      {/* worlds */}
      <main className="relative z-10 flex flex-col gap-8 pb-28 pt-6">
        <p className="text-center text-sm font-bold text-slate-600">☁️ The journey continues above the clouds — more worlds on their way!</p>
        {WORLDS.map((w, i) => ({ w, i })).reverse().map(({ w, i }) => (
          <div key={w.id} ref={heroAt?.w === i ? heroRef : undefined}>
            <WorldSection
              world={w}
              wIdx={i}
              save={save}
              onPick={pickStation}
              heroAt={heroAt}
              heroAvatar={save.profile.avatar}
            />
          </div>
        ))}
      </main>

      {/* Luna roams the map in her own draggable layer */}
      <div ref={mapOwlArea} className="pointer-events-none fixed inset-0 z-30">
        <motion.div
          drag
          dragConstraints={mapOwlArea}
          dragElastic={0.12}
          dragMomentum={false}
          whileDrag={{ scale: 1.08 }}
          onTap={lunaChat}
          className="pointer-events-auto absolute bottom-2 left-2 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>
            <div className="origin-bottom-left scale-[0.55] sm:scale-75">
              <LunaOwl mood={lunaMood} talking={lunaSpeaking} />
            </div>
            <AnimatePresence>
              {bubble && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="absolute bottom-16 left-14 w-52 rounded-2xl border-2 border-cyan-300/40 bg-[#1b2032] px-4 py-3 text-[14px] font-bold leading-snug text-slate-100 sm:w-56"
                >
                  {lunaSays}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsSheet
            onGrownUps={onGrownUps}
            key={mapKey}
            onClose={(changed) => {
              setSettingsOpen(false);
              if (changed) {
                setSave(loadSave());
                setMapKey((k) => k + 1);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* concept "Learn it" screen */}
      {concept && (
        <ConceptScreen
          conceptId={concept.id}
          onDone={() => {
            const then = concept.then;
            hushAll(); // stop Luna's narration the moment the screen closes
            setConcept(null);
            then?.();
          }}
        />
      )}

      {/* beat-based lesson "Learn it" engine */}
      {lesson && LESSONS[lesson.id] && (
        <LessonScreen
          lesson={LESSONS[lesson.id]}
          renderView={renderLessonView}
          onDone={() => {
            const then = lesson.then;
            hushAll();
            setLesson(null);
            then?.();
          }}
        />
      )}

      {/* tutorial player */}
      <AnimatePresence>
        {tutorial && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeTutorial(false)}
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="pointer-events-auto relative w-full max-w-[760px] rounded-3xl border-2 border-cyan-300/30 bg-[#14171f] p-5 shadow-2xl"
                initial={{ scale: 0.7, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.75, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => closeTutorial(false)}
                  className="absolute right-3 top-3 z-10 rounded-lg bg-black/40 p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
                <h3 className="mb-3 text-center text-lg font-extrabold text-white">
                  📺 Watch Luna solve one: {tutorial.station.title}!
                </h3>
                <video
                  ref={tutorialVideoRef}
                  src={`/tutorials/${tutorial.station.id}.webm`}
                  autoPlay
                  controls
                  className="w-full rounded-2xl border border-white/10"
                />
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => closeTutorial(tutorial.thenPlay, tutorial.station)}
                    className="rounded-xl bg-cyan-400 px-6 py-2.5 text-lg font-extrabold text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.4)] hover:bg-cyan-300"
                  >
                    {tutorial.thenPlay ? 'My turn! →' : 'Got it!'}
                  </button>
                  {tutorial.thenPlay && (
                    <button
                      type="button"
                      onClick={() => closeTutorial(false)}
                      className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-lg font-extrabold text-slate-300 hover:bg-white/10"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* station popover */}
      <AnimatePresence>
        {picked && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { hushAll(); setPicked(null); }}
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
                  onClick={() => { hushAll(); setPicked(null); }}
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
                {picked.state === 'open' &&
                  (() => {
                    const cid = conceptIdFor(picked.station);
                    const lid = picked.station.lesson && LESSONS[picked.station.lesson] ? picked.station.lesson : null;
                    const hasConcept = lid || (cid && CONCEPTS[cid]);
                    const hasTutorial = TUTORIALS.includes(picked.station.id);
                    return (
                      <>
                        <p className="mt-3 text-sm font-bold text-slate-400">
                          {picked.stars === 0
                            ? 'A brand new challenge awaits!'
                            : picked.stars < 3
                              ? 'Earn all 3 stars to master it!'
                              : 'Mastered! Play again any time.'}
                        </p>
                        {/* Learn it + Play — co-equal, side by side (distinct colors) */}
                        <div className="mt-5 flex gap-2.5">
                          {hasConcept && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              onClick={() => {
                                setPicked(null);
                                if (lid) setLesson({ id: lid, then: null }); // beat lesson, replay only
                                else setConcept({ id: cid, then: null }); // replay only, no auto-advance
                              }}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-3 text-base font-extrabold text-slate-900 shadow-[0_0_24px_rgba(255,185,83,0.4)] transition-colors hover:bg-amber-300"
                            >
                              📖 Learn it
                            </motion.button>
                          )}
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => startStation(picked.station)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-base font-extrabold text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition-colors hover:bg-cyan-300"
                          >
                            <Play size={18} className="fill-slate-900" /> Play!
                          </motion.button>
                        </div>
                        {hasTutorial && (
                          <button
                            type="button"
                            onClick={() => {
                              const st = picked.station;
                              setPicked(null); // close the popover under the video
                              setTutorial({ station: st, thenPlay: false });
                            }}
                            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10"
                          >
                            📺 Watch Luna solve one
                          </button>
                        )}
                      </>
                    );
                  })()}
                {picked.state === 'locked' && (
                  <p className="mt-3 text-sm font-bold text-slate-400">
                    {isWorldUnlocked(save, picked.wIdx)
                      ? '🔒 Earn a star at the previous station to unlock this one!'
                      : `🔒 Collect more stars in ${WORLDS[picked.wIdx - 1]?.title ?? 'the previous world'} to open this world!`}
                  </p>
                )}
                {picked.state === 'soon' && (
                  <p className="mt-3 text-sm font-bold text-slate-400">
                    🚧 Luna is still building this station — coming soon!
                  </p>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
