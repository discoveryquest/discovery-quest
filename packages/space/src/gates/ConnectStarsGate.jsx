import { useMemo, useState } from 'react';
import { scoreConstellation } from './connectStars.js';
import { useGameActions } from '../store/useGame.js';

// "Connect the Stars" Cosmic Gate UI (spec §3). Tap stars in order to trace the
// constellation; lines draw as you go. Scoring is in connectStars.js (tested).
export default function ConnectStarsGate({ station }) {
  const actions = useGameActions();
  const gate = station?.gate ?? {};
  const stars = gate.stars ?? [];
  const correct = gate.order ?? [];
  const byId = useMemo(() => Object.fromEntries(stars.map((s) => [s.id, s])), [stars]);

  const [taps, setTaps] = useState([]);
  const [result, setResult] = useState(null);

  const tap = (id) => { if (!result) setTaps((t) => (t[t.length - 1] === id ? t : [...t, id])); };
  const undo = () => { if (!result) setTaps((t) => t.slice(0, -1)); };
  const lock = () => {
    const scored = scoreConstellation(correct, taps);
    setResult(scored);
    setTimeout(() => actions.resolveGate({ stars: scored.stars, correct: scored.matched, concept: station?.concept }), 1100);
  };

  const pts = taps.map((id) => byId[id]).filter(Boolean);

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <p style={S.prompt}>✨ Connect the stars to trace <b>{gate.name ?? 'the constellation'}</b></p>

        <div style={S.sky}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={S.svg}>
            {pts.length > 1 && (
              <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#67e8f9" strokeWidth="0.7" strokeLinejoin="round" />
            )}
          </svg>
          {stars.map((s) => {
            const idx = taps.indexOf(s.id);
            return (
              <button
                key={s.id}
                onClick={() => tap(s.id)}
                disabled={!!result}
                aria-label={`star${idx >= 0 ? ` (step ${idx + 1})` : ''}`}
                style={{ ...S.star, left: `${s.x}%`, top: `${s.y}%`, ...(idx >= 0 ? S.starOn : null) }}
              >
                {idx >= 0 ? idx + 1 : ''}
              </button>
            );
          })}
        </div>

        {result ? (
          <div style={S.result}>
            {result.stars > 0 ? `${'★'.repeat(result.stars)} ${result.matched}/${result.total} lines!` : 'Try connecting them in order!'}
          </div>
        ) : (
          <div style={S.actions}>
            <button style={S.ghost} onClick={undo} disabled={!taps.length}>Undo</button>
            <button style={S.btn} onClick={lock} disabled={taps.length < 2}>🔒 Lock it in</button>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.55)' },
  card: { pointerEvents: 'auto', width: 480, maxWidth: '92vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: 24, borderRadius: 20, color: '#e2e8f0', font: '16px/1.4 system-ui, sans-serif', background: 'rgba(8,12,28,0.86)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  prompt: { margin: 0 },
  sky: { position: 'relative', width: '100%', aspectRatio: '16 / 10', borderRadius: 14, background: 'radial-gradient(120% 120% at 50% 20%, #131a3a 0%, #05060f 70%)', overflow: 'hidden' },
  svg: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  star: { position: 'absolute', transform: 'translate(-50%,-50%)', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', border: '1px solid #cbd5e1', background: 'rgba(226,232,240,0.85)', color: '#06121a', fontSize: 15, fontWeight: 800, touchAction: 'manipulation' },
  starOn: { background: '#67e8f9', boxShadow: '0 0 12px #22d3ee', border: '1px solid #67e8f9' },
  actions: { display: 'flex', gap: 10 },
  btn: { cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 16, fontWeight: 700, color: '#06121a', background: 'linear-gradient(180deg,#67e8f9,#22d3ee)' },
  ghost: { cursor: 'pointer', borderRadius: 12, padding: '12px 18px', fontSize: 15, color: '#e2e8f0', background: 'transparent', border: '1px solid rgba(148,163,184,0.4)' },
  result: { fontSize: 19, fontWeight: 700, letterSpacing: 1 },
};
