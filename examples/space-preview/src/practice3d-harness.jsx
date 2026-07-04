// Dev harness for the full-screen 3D practice mechanics: pick a mechanic +
// mission, play it like a kid, watch onCorrect/onHint fire in the banner.
// ?demo=1 runs MoonPhase3D's auto-solve glide (used by screenshot QA).
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MoonPhase3D, TargetTap3D, OrbitOrder3D } from '../../../packages/space/src/practice3d/index.js';
import './styles.css';

const MISSIONS = {
  'moon: first quarter': { M: MoonPhase3D, step: { target: { phase: 'first-quarter' } } },
  'moon: full': { M: MoonPhase3D, step: { target: { phase: 'full' } } },
  'moon: new': { M: MoonPhase3D, step: { target: { phase: 'new' } } },
  'tap: ringed planet': { M: TargetTap3D, step: { scene: { options: ['mars', 'saturn', 'neptune'] }, target: { id: 'saturn' } } },
  'tap: the red one': { M: TargetTap3D, step: { scene: { options: ['venus', 'mars', 'jupiter', 'uranus'] }, target: { id: 'mars' } } },
  'order: inner 4': { M: OrbitOrder3D, step: { scene: { bodies: ['earth', 'mercury', 'mars', 'venus'] } } },
  'order: gas giants': { M: OrbitOrder3D, step: { scene: { bodies: ['neptune', 'saturn', 'jupiter', 'uranus'] } } },
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
