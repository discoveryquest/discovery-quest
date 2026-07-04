// Full-screen immersive stage for 3D practice mechanics (space-3d upgrade:
// practice is no longer a small modal — the scene IS the screen). Renders a
// fixed full-bleed Canvas with the Milky Way behind whatever bodies the
// mechanic mounts; `overlay` children render as DOM above the canvas (prompts,
// phase insets, tray chips). Mechanics keep the PracticeScreen contract
// ({ step, onCorrect, onHint, demo }) so they're drop-in MECHANICS entries.
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { MilkyWay } from '../scene/bodies/index.js';

export default function Stage3D({ camera = { position: [0, 4, 12], fov: 46 }, ambient = 0.14, overlay, children }) {
  return (
    <div className="fixed inset-0" data-stage3d>
      <Canvas dpr={[1, 2]} camera={camera} gl={{ antialias: true }}>
        <color attach="background" args={['#01020a']} />
        <ambientLight intensity={ambient} />
        <Suspense fallback={null}>
          <MilkyWay />
          {children}
        </Suspense>
      </Canvas>
      {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
    </div>
  );
}
