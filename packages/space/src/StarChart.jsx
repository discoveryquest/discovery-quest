import { SECTOR_ORDER, getSector } from './data/sectors.js';
import { useGame, useGameActions } from './store/useGame.js';

// The Star Chart: a diegetic warp hub (spec §5.2). Shows every sector as a node
// with its star progress; tapping one warps there. DOM overlay for the scaffold;
// a future pass can make it a 3D holographic chart in the cockpit.
export default function StarChart() {
  const actions = useGameActions();
  const stars = useGame((s) => s.stars);
  const current = useGame((s) => s.sectorId);

  const warp = (sector) =>
    actions.warpTo({ sectorId: sector.id, stationOrder: sector.stations.map((s) => s.id) });

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <h2 style={S.title}>🗺 Star Chart</h2>
        <p style={S.sub}>Choose where to explore!</p>
        <div style={S.nodes}>
          {SECTOR_ORDER.map((id) => {
            const sector = getSector(id);
            if (!sector) return null;
            const earned = sector.stations.reduce((n, st) => n + (stars[st.id] || 0), 0);
            const max = sector.stations.length * 3;
            const done = earned >= max && max > 0;
            return (
              <button key={id} style={{ ...S.node, borderColor: sector.color }} onClick={() => warp(sector)}>
                <span style={{ fontSize: 44 }} role="img" aria-label={sector.title}>{sector.emoji}</span>
                <span style={S.nodeTitle}>{sector.title}</span>
                <span style={S.blurb}>{sector.blurb}</span>
                <span style={S.progress}>
                  {done ? '✅ ' : '⭐ '}{earned}/{max}{id === current ? ' · here' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.6)' },
  card: { pointerEvents: 'auto', width: 720, maxWidth: '94vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', padding: 28, borderRadius: 22, color: '#e2e8f0', font: '16px/1.4 system-ui, sans-serif', background: 'rgba(8,12,28,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)', maxHeight: '92vh', overflowY: 'auto' },
  title: { margin: 0, fontSize: 24 },
  sub: { margin: '0 0 14px', opacity: 0.8 },
  nodes: { display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  node: { cursor: 'pointer', width: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 14px', borderRadius: 18, color: '#e2e8f0', background: 'rgba(15,23,42,0.7)', border: '2px solid', textAlign: 'center' },
  nodeTitle: { fontWeight: 800, fontSize: 16 },
  blurb: { fontSize: 12, opacity: 0.7, minHeight: 32 },
  progress: { fontSize: 13, fontWeight: 700, marginTop: 4 },
};
