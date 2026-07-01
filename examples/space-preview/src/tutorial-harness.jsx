// Dev-only: mount the real PracticeScreen in demo mode so record-tutorial.mjs can
// screencast "Luna solving" a station. Uses the app background so the capture looks
// like the game. Usage: /tutorial-harness.html?station=moon-phases
// Delete before merge.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import PracticeScreen from '../../../packages/space/src/PracticeScreen.jsx';
import { course } from '../../../packages/space/src/course.js';
import './styles.css';

const params = new URLSearchParams(location.search);
const stationId = params.get('station') || 'moon-phases';
const demoMax = Number(params.get('missions') || 1);
// gate=1 → wait for the recorder to call window.__startTutorial() so the capture
// begins with a clean, deterministic narration timeline (no prompt fired before
// the screencast started). Otherwise auto-start (for manual inspection).
const gated = params.get('gate') === '1';
const live = params.get('live') === '1'; // mount the real (non-demo) PracticeScreen to check the tutorial player
const station = course.worlds.flatMap((w) => w.stations).find((s) => s.id === stationId);

const BG = 'radial-gradient(120% 90% at 50% -10%, #1b2550 0%, rgba(27,37,80,0) 55%), linear-gradient(180deg, #0b1026 0%, #05060f 100%)';

function Harness() {
  const [started, setStarted] = useState(!gated);
  useEffect(() => {
    window.__startTutorial = () => setStarted(true);
    window.__tutorialReady = true;
    if (!gated) return;
  }, []);
  if (!station) return <div style={{ color: '#f87171', padding: 40 }}>No station: {stationId}</div>;
  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '32px 16px' }}>
        {started && (
          <PracticeScreen station={station} course={course} demo={!live} demoMax={demoMax} onExit={() => { window.__tutorialExited = true; }} />
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
