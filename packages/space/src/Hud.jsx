import { useState } from 'react';
import { useGame, useGameActions } from './store/useGame.js';
import { PHASES } from './store/gameStore.js';
import { findStation, stationTitle, collectedFactCount, getSector, nextSectorId } from './data/sectors.js';
import DiscoveryDeck from './DiscoveryDeck.jsx';
import PhaseLockGate from './gates/PhaseLockGate.jsx';
import OrbitSortGate from './gates/OrbitSortGate.jsx';
import ConnectStarsGate from './gates/ConnectStarsGate.jsx';
import DockGate from './gates/DockGate.jsx';
import EventHorizonGate from './gates/EventHorizonGate.jsx';
import StarChart from './StarChart.jsx';
import StationLesson from './StationLesson.jsx';

// Map a gate kind → its UI. Add gate components here as they're built (spec §3).
const GATES = { phaseLock: PhaseLockGate, orbitSort: OrbitSortGate, connectStars: ConnectStarsGate, dock: DockGate, eventHorizon: EventHorizonGate };

// 2D HUD overlay (DOM, not in the canvas → crisp/accessible/localizable; spec §5.3).
// Lives as a sibling of <Canvas>; shares the module-singleton store.
const LUNA = {
  [PHASES.GALACTIC]: 'Pick a place to explore!',
  [PHASES.FLYING]: 'Hold tight — flying us over now!',
  [PHASES.STATION_IDLE]: "We're here! Ready for the challenge?",
  [PHASES.GATE_ACTIVE]: 'You can do it — line it up!',
  [PHASES.SECTOR_COMPLETE]: 'You explored the whole sector! 🌟',
};

export default function Hud() {
  const actions = useGameActions();
  const [showLog, setShowLog] = useState(false);
  const phase = useGame((s) => s.phase);
  const sectorId = useGame((s) => s.sectorId);
  const learned = useGame((s) => s.learned);
  const stationId = useGame((s) => s.stationId);
  const lockedBeacon = useGame((s) => s.lockedBeacon);
  const stars = useGame((s) => s.stars);

  const objective =
    phase === PHASES.STATION_IDLE || phase === PHASES.GATE_ACTIVE
      ? stationTitle(sectorId, stationId)
      : lockedBeacon
        ? `Flying to ${stationTitle(sectorId, lockedBeacon)}`
        : 'Choose a destination';

  const earned = stationId ? (stars[stationId] || 0) : 0;
  const station = findStation(sectorId, stationId);
  const GateUI = station?.gate?.kind ? GATES[station.gate.kind] : null;
  const hasLesson = !!(station?.facts?.length || station?.questions?.length);

  return (
    <>
      {showLog && <DiscoveryDeck onClose={() => setShowLog(false)} />}
      {phase === PHASES.GALACTIC && <StarChart />}
      {phase === PHASES.STATION_IDLE && hasLesson && <StationLesson station={station} />}
      {phase === PHASES.GATE_ACTIVE && GateUI && <GateUI station={station} />}
      {phase !== PHASES.GALACTIC && (
      <div style={S.panel}>
      {/* Luna co-pilot comms — the helmeted owl (spec §4.3) */}
      <div style={S.comms}>
        <span style={{ fontSize: 28 }} role="img" aria-label="Luna the owl">🦉</span>
        <p style={{ margin: 0 }}>{LUNA[phase]}</p>
      </div>

      <div style={S.chip}>🎯 {objective}</div>

      {phase === PHASES.STATION_IDLE && !hasLesson && (
        <button style={S.btn} onClick={() => actions.startGate()}>Start the challenge</button>
      )}

      {phase === PHASES.GATE_ACTIVE && !GateUI && (
        // Fallback for gates whose UI isn't built yet — phaseLock now has a real
        // gate (rendered above as an overlay); others use this demo until built.
        <button style={S.btn} onClick={() => actions.resolveGate({ stars: 3, correct: 3 })}>
          ✅ Complete gate (demo · 3★)
        </button>
      )}

      {phase === PHASES.SECTOR_COMPLETE && (() => {
        const sector = getSector(sectorId);
        const earnedHere = sector ? sector.stations.reduce((n, st) => n + (stars[st.id] || 0), 0) : 0;
        const maxHere = sector ? sector.stations.length * 3 : 0;
        const nextId = nextSectorId(sectorId);
        const nextSector = nextId ? getSector(nextId) : null;
        const warpNext = () => actions.warpTo({ sectorId: nextId, stationOrder: nextSector.stations.map((s) => s.id) });
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>Sector complete! ⭐ {earnedHere}/{maxHere}</div>
            {nextSector
              ? <button style={S.btn} onClick={warpNext}>Next: {nextSector.emoji} {nextSector.title} →</button>
              : <div style={{ fontWeight: 700 }}>You explored every sector! 🌟</div>}
            <button style={S.ghost} onClick={() => actions.openStarChart()}>🗺 Star Chart</button>
          </div>
        );
      })()}

      {(phase === PHASES.FLYING || phase === PHASES.STATION_IDLE) && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.ghost} onClick={() => actions.openStarChart()}>🗺 Star Chart</button>
          <button style={S.ghost} onClick={() => setShowLog(true)}>📖 Log ({collectedFactCount(learned)})</button>
        </div>
      )}

      {stationId && (
        <div style={{ fontSize: 14, letterSpacing: 2 }} aria-label={`${earned} of 3 stars`}>
          {'★'.repeat(earned)}{'☆'.repeat(3 - earned)}
        </div>
      )}
      </div>
      )}
    </>
  );
}

const S = {
  panel: { position: 'absolute', left: 16, bottom: 'max(16px, env(safe-area-inset-bottom))', width: 'min(340px, calc(100vw - 32px))', display: 'flex', flexDirection: 'column', gap: 10, color: '#e2e8f0', font: '15px/1.4 system-ui, sans-serif' },
  comms: { display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(15,23,42,0.7)', padding: '10px 14px', borderRadius: 14, backdropFilter: 'blur(6px)' },
  chip: { alignSelf: 'flex-start', background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.4)', padding: '4px 12px', borderRadius: 999, fontSize: 13 },
  btn: { alignSelf: 'flex-start', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 16, fontWeight: 700, color: '#06121a', background: 'linear-gradient(180deg,#67e8f9,#22d3ee)' },
  ghost: { alignSelf: 'flex-start', cursor: 'pointer', borderRadius: 12, padding: '8px 14px', fontSize: 14, color: '#e2e8f0', background: 'transparent', border: '1px solid rgba(148,163,184,0.4)' },
};
