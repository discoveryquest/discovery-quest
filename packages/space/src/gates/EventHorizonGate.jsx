import { useState } from 'react';
import { scoreSlingshot } from './eventHorizon.js';
import { useGameActions } from '../store/useGame.js';

// "Event Horizon" Cosmic Gate UI (spec §3). Slide to set your approach, then
// slingshot. Too far = drift past; too close = pulled in. Scoring in eventHorizon.js.
const MSG = {
  slingshot: '★ Perfect slingshot — you whipped around and flew free!',
  drifted: 'Too far out — no boost. The black hole barely tugged you.',
  'pulled-in': 'Too close! Its gravity nearly pulled you past the horizon.',
};

export default function EventHorizonGate({ station }) {
  const actions = useGameActions();
  const [value, setValue] = useState(15);
  const [result, setResult] = useState(null);

  const go = () => {
    const scored = scoreSlingshot(value);
    setResult(scored);
    setTimeout(() => actions.resolveGate({ stars: scored.stars, correct: scored.stars > 0 ? 1 : 0, concept: station?.concept }), 1200);
  };

  // ship sits along the approach line; closer to the hole as `value` grows
  const shipLeft = 12 + value * 0.72; // %

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <p style={S.prompt}>🕳️ Skim the black hole for a slingshot — close enough for a boost, not so close it pulls you in!</p>

        <div style={S.space}>
          <div style={S.hole} />
          <div style={{ ...S.ship, left: `${shipLeft}%` }}>▲</div>
          <div style={S.zone} />
        </div>

        <input type="range" min="0" max="100" value={value} onChange={(e) => setValue(+e.target.value)} disabled={!!result} style={S.slider} aria-label="approach distance" />
        <div style={S.scale}><span>far</span><span>closer →</span></div>

        {result ? (
          <div style={{ ...S.result, color: result.stars > 0 ? '#67e8f9' : '#fca5a5' }}>
            {result.stars > 0 ? '★'.repeat(result.stars) + ' ' : ''}{MSG[result.outcome]}
          </div>
        ) : (
          <button style={S.btn} onClick={go}>🚀 Slingshot!</button>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.55)' },
  card: { pointerEvents: 'auto', width: 400, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: 24, borderRadius: 20, color: '#e2e8f0', font: '16px/1.4 system-ui, sans-serif', background: 'rgba(8,12,28,0.88)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)' },
  prompt: { margin: 0 },
  space: { position: 'relative', width: '100%', height: 90, borderRadius: 14, background: 'radial-gradient(120% 160% at 92% 50%, #1a1030 0%, #05060f 60%)', overflow: 'hidden' },
  hole: { position: 'absolute', right: 8, top: '50%', width: 46, height: 46, marginTop: -23, borderRadius: '50%', background: '#05050a', boxShadow: '0 0 22px 6px #2a1750, inset 0 0 8px #000' },
  zone: { position: 'absolute', right: 60, top: 0, width: 40, height: '100%', background: 'rgba(103,232,249,0.12)', borderLeft: '1px dashed rgba(103,232,249,0.4)', borderRight: '1px dashed rgba(103,232,249,0.4)' },
  ship: { position: 'absolute', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: 22, color: '#e2e8f0' },
  slider: { width: '100%' },
  scale: { display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 12, opacity: 0.7 },
  btn: { cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 16, fontWeight: 700, color: '#06121a', background: 'linear-gradient(180deg,#67e8f9,#22d3ee)' },
  result: { fontSize: 16, fontWeight: 700 },
};
