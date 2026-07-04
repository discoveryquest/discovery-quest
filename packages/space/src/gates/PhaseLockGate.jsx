import { useState } from 'react';
import { phaseByName, phaseForAngle, scorePhase } from './phaseLock.js';
import { useGameActions } from '../store/useGame.js';

// "Phase Lock" Cosmic Gate UI (spec §3). The child rotates the Sun (a slider) to
// make the Moon match a target phase, then locks it in. Scoring is in phaseLock.js
// (tested); resolving awards stars → telemetry → XP via the store's ENGINE SEAM.
// DOM-based for the scaffold; a future pass can make this a 3D sun-rotation scene.
export default function PhaseLockGate({ station }) {
  const actions = useGameActions();
  const target = phaseByName(station?.gate?.target) ?? phaseByName('full');
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState(null);
  const current = phaseForAngle(angle);

  const lock = () => {
    const scored = scorePhase(target.name, angle);
    setResult(scored);
    // brief beat so the child sees their score before the scene advances
    setTimeout(() => actions.resolveGate({ stars: scored.stars, correct: scored.stars > 0 ? 1 : 0, concept: station?.concept }), 900);
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <p style={S.prompt}>Rotate the Sun to make the Moon look like this:</p>
        <div style={S.target}>
          <span style={{ fontSize: 44 }} role="img" aria-label={target.label}>{target.emoji}</span>
          <span style={S.targetLabel}>{target.label}</span>
        </div>

        <div style={{ fontSize: 72, lineHeight: 1 }} role="img" aria-label={current.label}>{current.emoji}</div>
        <div style={S.now}>{current.label}</div>

        <input
          type="range" min="0" max="359" value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
          style={S.slider} aria-label="Sun position"
          disabled={!!result}
        />
        <div style={S.sunRow}><span>🌑 night side</span><span>☀️ Sun</span></div>

        {result ? (
          <div style={S.result}>
            {result.stars > 0 ? `${'★'.repeat(result.stars)} Nice!` : 'Not quite — try again next time!'}
          </div>
        ) : (
          <button style={S.btn} onClick={lock}>🔒 Lock it in</button>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.55)' },
  card: { pointerEvents: 'auto', width: 360, maxWidth: '86vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: 24, borderRadius: 20, color: '#e2e8f0', font: '16px/1.4 system-ui, sans-serif', background: 'rgba(8,12,28,0.86)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  prompt: { margin: 0, opacity: 0.9 },
  target: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 16px', borderRadius: 14, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.35)' },
  targetLabel: { fontSize: 13, fontWeight: 700 },
  now: { fontSize: 14, opacity: 0.85 },
  slider: { width: '100%' },
  sunRow: { display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 12, opacity: 0.7 },
  btn: { cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 16, fontWeight: 700, color: '#06121a', background: 'linear-gradient(180deg,#67e8f9,#22d3ee)' },
  result: { fontSize: 20, fontWeight: 700, letterSpacing: 1 },
};
