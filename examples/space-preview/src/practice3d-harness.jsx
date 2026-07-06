// Dev harness for the full-screen 3D practice mechanics: pick a mechanic +
// mission, play it like a kid, watch onCorrect/onHint fire in the banner.
// ?demo=1 runs MoonPhase3D's auto-solve glide (used by screenshot QA).
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MoonPhase3D, TargetTap3D, OrbitOrder3D, SortZones3D, StateDial3D, ConnectStars3D } from '../../../packages/space/src/practice3d/index.js';
import './styles.css';

// Steps below mirror the real space.course.yml shapes so the harness proves
// the exact data the course will feed these mechanics.
const DAY_STATES = [{ id: 'dawn', label: 'Dawn' }, { id: 'noon', label: 'Noon' }, { id: 'dusk', label: 'Dusk' }, { id: 'night', label: 'Night' }];
const SEASON_STATES = [{ id: 'spring', label: 'Spring' }, { id: 'summer', label: 'Summer' }, { id: 'autumn', label: 'Autumn' }, { id: 'winter', label: 'Winter' }];

const MISSIONS = {
  'moon: first quarter': { M: MoonPhase3D, step: { target: { phase: 'first-quarter' } } },
  'moon: full': { M: MoonPhase3D, step: { target: { phase: 'full' } } },
  'moon: new': { M: MoonPhase3D, step: { target: { phase: 'new' } } },
  'tap: ringed planet': { M: TargetTap3D, step: { scene: { options: ['mars', 'saturn', 'neptune'] }, target: { id: 'saturn' } } },
  'tap: the red one': { M: TargetTap3D, step: { scene: { options: ['venus', 'mars', 'jupiter', 'uranus'] }, target: { id: 'mars' } } },
  'tap: sun core': { M: TargetTap3D, step: { kind: 'tap-hotspot', target: { id: 'core', items: [{ id: 'core', label: 'Core', emoji: '🔥' }, { id: 'surface', label: 'Surface', emoji: '☀️' }, { id: 'rays', label: 'Rays', emoji: '✨' }] } } },
  'tap: gravity': { M: TargetTap3D, step: { kind: 'compare-strength', target: { id: 'jupiter', items: [{ id: 'moon', label: 'Moon', emoji: '🌙', size: 48 }, { id: 'earth', label: 'Earth', emoji: '🌍', size: 66 }, { id: 'jupiter', label: 'Jupiter', emoji: '🪐', size: 96 }] } } },
  'order: inner 4': { M: OrbitOrder3D, step: { scene: { bodies: ['earth', 'mercury', 'mars', 'venus'] } } },
  'order: gas giants': { M: OrbitOrder3D, step: { scene: { bodies: ['neptune', 'saturn', 'jupiter', 'uranus'] } } },
  'order: all 8': { M: OrbitOrder3D, step: { target: { order: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'], items: [{ id: 'mercury', label: 'Mercury' }, { id: 'venus', label: 'Venus' }, { id: 'earth', label: 'Earth' }, { id: 'mars', label: 'Mars' }, { id: 'jupiter', label: 'Jupiter' }, { id: 'saturn', label: 'Saturn' }, { id: 'uranus', label: 'Uranus' }, { id: 'neptune', label: 'Neptune' }] } } },
  'order: star life': { M: OrbitOrder3D, step: { target: { order: ['nebula', 'newstar', 'giant', 'supernova'], items: [{ id: 'nebula', label: 'Nebula', emoji: '☁️' }, { id: 'newstar', label: 'New star', emoji: '⭐' }, { id: 'giant', label: 'Red giant', emoji: '🔴' }, { id: 'supernova', label: 'Supernova', emoji: '💥' }] } } },
  'sort: nebula': { M: SortZones3D, step: { target: { zones: [{ id: 'nebula', label: 'Nebula stuff', emoji: '☁️' }, { id: 'not', label: 'Not nebula stuff', emoji: '🚫' }], tokens: [{ id: 'gas', label: 'Gas', emoji: '💨', zone: 'nebula' }, { id: 'dust', label: 'Dust', emoji: '✨', zone: 'nebula' }, { id: 'baby-star', label: 'Baby star', emoji: '⭐', zone: 'nebula' }, { id: 'rocket', label: 'Rocket', emoji: '🚀', zone: 'not' }] } } },
  'spin: noon': { M: StateDial3D, step: { kind: 'earth-spin', target: { state: 'noon', states: DAY_STATES } } },
  'spin: night': { M: StateDial3D, step: { kind: 'earth-spin', target: { state: 'night', states: DAY_STATES } } },
  'season: summer': { M: StateDial3D, step: { kind: 'orbit-season', target: { state: 'summer', states: SEASON_STATES } } },
  'season: winter': { M: StateDial3D, step: { kind: 'orbit-season', target: { state: 'winter', states: SEASON_STATES } } },
  'stars: connect': { M: ConnectStars3D, step: { target: { order: ['a', 'b', 'c', 'd'], stars: [{ id: 'a', x: 24, y: 68 }, { id: 'b', x: 42, y: 42 }, { id: 'c', x: 62, y: 58 }, { id: 'd', x: 78, y: 30 }] } } },
};

function App() {
  const [key, setKey] = useState(Object.keys(MISSIONS)[0]);
  const [nonce, setNonce] = useState(0); // remount on mission change/retry
  const [won, setWon] = useState(false);
  const [hints, setHints] = useState(0);
  const demo = new URLSearchParams(location.search).has('demo');
  const { M, step } = MISSIONS[key];

  return (
    <>
      <M key={key + nonce} step={step} demo={demo}
        onCorrect={() => setWon(true)}
        onHint={() => setHints((h) => h + 1)} />
      <div className="fixed left-0 right-0 top-0 z-50 flex flex-wrap items-center justify-center gap-2 p-3">
        {Object.keys(MISSIONS).map((k) => (
          <button key={k} type="button" data-mission={k} onClick={() => { setKey(k); setNonce((n) => n + 1); setWon(false); setHints(0); }}
            className={`touch-manipulation rounded-full border px-3 py-1.5 text-xs font-extrabold backdrop-blur-sm
              ${key === k ? 'border-amber-300/70 bg-amber-400/20 text-amber-200' : 'border-white/15 bg-slate-950/60 text-slate-300'}`}>
            {k}
          </button>
        ))}
        <span data-result={won ? 'won' : 'playing'} data-hints={hints}
          className={`rounded-full px-3 py-1.5 text-xs font-black ${won ? 'bg-emerald-400/25 text-emerald-200' : 'bg-white/5 text-slate-500'}`}>
          {won ? '⭐ SOLVED' : hints ? `hints: ${hints}` : 'playing…'}
        </span>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
