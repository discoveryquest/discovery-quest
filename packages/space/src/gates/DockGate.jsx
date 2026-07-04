import { useState } from 'react';
import { scoreDock } from './dock.js';
import { useGameActions } from '../store/useGame.js';

// "Docking Maneuver" Cosmic Gate UI (spec §3). Line up the ship with the port
// using the offset + roll controls, then dock. Scoring is in dock.js (tested).
export default function DockGate({ station }) {
  const actions = useGameActions();
  const target = station?.gate?.target ?? 'the station';
  const [x, setX] = useState(30);
  const [y, setY] = useState(-22);
  const [roll, setRoll] = useState(16);
  const [result, setResult] = useState(null);

  const dock = () => {
    const scored = scoreDock({ x, y, roll });
    setResult(scored);
    setTimeout(() => actions.resolveGate({ stars: scored.stars, correct: scored.stars > 0 ? 1 : 0, concept: station?.concept }), 1100);
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <p style={S.prompt}>🛰️ Line up the ship and dock with <b>{target}</b></p>

        <div style={S.bay}>
          <div style={S.port} />
          <div style={{ ...S.ship, transform: `translate(-50%,-50%) translate(${x * 1.3}px, ${-y * 1.3}px) rotate(${roll}deg)` }}>▲</div>
        </div>

        <label style={S.row}><span style={S.lbl}>↔︎</span><input type="range" min="-50" max="50" value={x} onChange={(e) => setX(+e.target.value)} disabled={!!result} style={S.slider} aria-label="horizontal alignment" /></label>
        <label style={S.row}><span style={S.lbl}>↕︎</span><input type="range" min="-50" max="50" value={y} onChange={(e) => setY(+e.target.value)} disabled={!!result} style={S.slider} aria-label="vertical alignment" /></label>
        <label style={S.row}><span style={S.lbl}>⟳</span><input type="range" min="-45" max="45" value={roll} onChange={(e) => setRoll(+e.target.value)} disabled={!!result} style={S.slider} aria-label="roll" /></label>

        {result ? (
          <div style={S.result}>{result.stars > 0 ? `${'★'.repeat(result.stars)} Docked!` : 'Missed the port — try again!'}</div>
        ) : (
          <button style={S.btn} onClick={dock}>🔗 Dock!</button>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.55)' },
  card: { pointerEvents: 'auto', width: 380, maxWidth: '90vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: 24, borderRadius: 20, color: '#e2e8f0', font: '16px/1.4 system-ui, sans-serif', background: 'rgba(8,12,28,0.86)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  prompt: { margin: 0 },
  bay: { position: 'relative', width: 220, height: 180, borderRadius: 14, background: 'radial-gradient(120% 120% at 50% 50%, #0a2230 0%, #05060f 75%)', overflow: 'hidden' },
  port: { position: 'absolute', left: '50%', top: '50%', width: 54, height: 54, marginLeft: -27, marginTop: -27, borderRadius: '50%', border: '3px dashed #22d3ee', boxSizing: 'border-box' },
  ship: { position: 'absolute', left: '50%', top: '50%', fontSize: 30, color: '#e2e8f0', lineHeight: 1 },
  row: { display: 'flex', alignItems: 'center', gap: 10, width: '100%' },
  lbl: { width: 18, textAlign: 'center', opacity: 0.8 },
  slider: { flex: 1 },
  btn: { cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 16, fontWeight: 700, color: '#06121a', background: 'linear-gradient(180deg,#67e8f9,#22d3ee)' },
  result: { fontSize: 19, fontWeight: 700, letterSpacing: 1 },
};
