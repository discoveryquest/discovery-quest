import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { setSaveKey } from '@discoveryquest/engine/save';
import SectorScene from './scene/SectorScene.jsx';
import GalacticBackdrop from './scene/GalacticBackdrop.jsx';
import Hud from './Hud.jsx';
import { setGatePersister, setLessonPersister, PHASES } from './store/gameStore.js';
import { useGame } from './store/useGame.js';
import { recordGateResult, recordLessonResult } from './progress.js';
import { getSector } from './data/sectors.js';
import { usePrefersReducedMotion } from './util/reducedMotion.js';

// Top-level Space Quest surface (spec §7.1). Store-driven: the Star Chart picks a
// sector (warpTo), then this mounts that sector's scene; GALACTIC shows the chart
// over a star backdrop. Exactly one sector is mounted at a time — `key` swaps the
// subtree on warp so the old one disposes (spec §7.1). dpr capped for low-end (§7.2).
// `effects` is an optional post-processing node (e.g. <EffectComposer><Bloom/></EffectComposer>)
// rendered inside the Canvas. Kept as a prop so the library doesn't depend on
// @react-three/postprocessing — the app shell supplies it (the preview app does).
export default function SpaceQuest({ effects = null }) {
  const reducedMotion = usePrefersReducedMotion();
  const phase = useGame((s) => s.phase);
  const sectorId = useGame((s) => s.sectorId);
  const sector = getSector(sectorId);
  const showScene = phase !== PHASES.GALACTIC && sector;

  // Default engine wiring (save key + gate→XP persister). The app shell can override.
  useEffect(() => {
    setSaveKey('sq-save');
    setGatePersister(recordGateResult);
    setLessonPersister(recordLessonResult);
    return () => { setGatePersister(null); setLessonPersister(null); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#05060f' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 7, 32], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          {showScene
            ? <SectorScene key={sector.id} sector={sector} reducedMotion={reducedMotion} />
            : <GalacticBackdrop />}
        </Suspense>
        {effects}
      </Canvas>
      <Hud />
    </div>
  );
}
