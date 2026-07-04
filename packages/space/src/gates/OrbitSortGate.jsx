import { useMemo, useState } from 'react';
import { scoreOrder, scramble } from './orbitSort.js';
import { useGameActions } from '../store/useGame.js';

// "Orbit Sort" Cosmic Gate UI (spec §3). Tap the planets in order, closest to the
// Sun first. Scoring is in orbitSort.js (tested); resolving feeds stars → XP.
export default function OrbitSortGate({ station }) {
  const actions = useGameActions();
  const planets = station?.gate?.planets ?? [];
  const correctIds = useMemo(() => planets.map((p) => p.id), [planets]);
  const byId = useMemo(() => Object.fromEntries(planets.map((p) => [p.id, p])), [planets]);
  const scrambled = useMemo(() => scramble(planets), [planets]);

  const [chosen, setChosen] = useState([]); // ids in tapped order
  const [result, setResult] = useState(null);

  const tap = (id) => { if (!result && !chosen.includes(id)) setChosen((c) => [...c, id]); };
  const reset = () => { if (!result) setChosen([]); };
  const lock = () => {
    const scored = scoreOrder(correctIds, chosen);
    setResult(scored);
    setTimeout(() => actions.resolveGate({ stars: scored.stars, correct: scored.correctCount, concept: station?.concept }), 1100);
  };

  const Chip = ({ p, onClick, dim }) => (
    <button key={p.id} onClick={onClick} disabled={!!result} style={{ ...S.chip, background: p.color, opacity: dim ? 0.35 : 1 }}>
      {p.label}
    </button>
  );

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <p style={S.prompt}>☀️ Tap the planets in order — closest to the Sun first!</p>

        {/* the order the child is building */}
        <div style={S.slots}>
          {chosen.length === 0
            ? <span style={{ opacity: 0.5 }}>your order…</span>
            : chosen.map((id, i) => <span key={id} style={{ ...S.slot, background: byId[id]?.color }}>{i + 1}. {byId[id]?.label}</span>)}
        </div>

        {/* the planets to pick from */}
        <div style={S.tray}>
          {scrambled.map((p) => <Chip key={p.id} p={p} onClick={() => tap(p.id)} dim={chosen.includes(p.id)} />)}
        </div>

        {result ? (
          <div style={S.result}>
            {result.stars > 0
              ? `${'★'.repeat(result.stars)}  ${result.correctCount}/${result.total} in place!`
              : 'Not quite — the order goes Mercury, Venus, Earth, Mars…'}
          </div>
        ) : (
          <div style={S.actions}>
            <button style={S.ghost} onClick={reset} disabled={!chosen.length}>Reset</button>
            <button style={S.btn} onClick={lock} disabled={chosen.length !== correctIds.length}>🔒 Lock it in</button>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.55)' },
  card: { pointerEvents: 'auto', width: 460, maxWidth: '92vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: 24, borderRadius: 20, color: '#e2e8f0', font: '16px/1.4 system-ui, sans-serif', background: 'rgba(8,12,28,0.86)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  prompt: { margin: 0 },
  slots: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', minHeight: 30 },
  slot: { padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, color: '#06121a' },
  tray: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { cursor: 'pointer', border: 'none', borderRadius: 12, padding: '10px 14px', fontSize: 15, fontWeight: 700, color: '#06121a' },
  actions: { display: 'flex', gap: 10 },
  btn: { cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 16, fontWeight: 700, color: '#06121a', background: 'linear-gradient(180deg,#67e8f9,#22d3ee)' },
  ghost: { cursor: 'pointer', borderRadius: 12, padding: '12px 18px', fontSize: 15, color: '#e2e8f0', background: 'transparent', border: '1px solid rgba(148,163,184,0.4)' },
  result: { fontSize: 19, fontWeight: 700, letterSpacing: 1 },
};
