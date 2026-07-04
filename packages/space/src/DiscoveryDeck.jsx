import { useGame } from './store/useGame.js';
import { SECTOR_ORDER, getSector } from './data/sectors.js';

// Discovery Deck / Science Log (spec §5.3): the facts you've collected by finishing
// stations' "Learn it", grouped by sector. A review surface for what you've learned.
export default function DiscoveryDeck({ onClose }) {
  const learned = useGame((s) => s.learned);

  const groups = SECTOR_ORDER
    .map((id) => {
      const sector = getSector(id);
      const stations = sector.stations.filter((st) => learned[st.id] && st.facts?.length);
      return { sector, stations };
    })
    .filter((g) => g.stations.length);

  const total = groups.reduce((n, g) => n + g.stations.reduce((m, st) => m + st.facts.length, 0), 0);

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.head}>
          <h2 style={S.title}>📖 Science Log</h2>
          <span style={S.count}>{total} discover{total === 1 ? 'y' : 'ies'}</span>
          <button style={S.x} onClick={onClose} aria-label="Close log">✕</button>
        </div>

        {total === 0 ? (
          <p style={S.empty}>Finish a station's “Learn it” to collect discoveries here! 🚀</p>
        ) : (
          groups.map(({ sector, stations }) => (
            <div key={sector.id} style={S.group}>
              <div style={{ ...S.sectorTitle, color: sector.color }}>{sector.emoji} {sector.title}</div>
              {stations.flatMap((st) =>
                st.facts.map((f, i) => (
                  <div key={`${st.id}-${i}`} style={S.fact}>
                    <span style={{ fontSize: 20 }} role="img" aria-hidden>{f.emoji}</span>
                    <span>{f.text}</span>
                  </div>
                )),
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.6)' },
  card: { pointerEvents: 'auto', width: 480, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 24, borderRadius: 20, color: '#e2e8f0', font: '15px/1.45 system-ui, sans-serif', background: 'rgba(8,12,28,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)' },
  head: { display: 'flex', alignItems: 'center', gap: 10 },
  title: { margin: 0, fontSize: 22 },
  count: { fontSize: 13, opacity: 0.7 },
  x: { marginLeft: 'auto', cursor: 'pointer', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 18 },
  empty: { opacity: 0.8, textAlign: 'center', margin: '12px 0' },
  group: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectorTitle: { fontWeight: 800, fontSize: 15, marginTop: 6 },
  fact: { display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(15,23,42,0.6)', padding: '8px 12px', borderRadius: 12 },
};
