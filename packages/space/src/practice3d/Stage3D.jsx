// Full-screen immersive stage for 3D practice mechanics (space-3d upgrade:
// practice is no longer a small modal — the scene IS the screen). Renders a
// fixed full-bleed Canvas with the Milky Way behind whatever bodies the
// mechanic mounts; `overlay` children render as DOM above the canvas (prompts,
// phase insets, tray chips). Mechanics keep the PracticeScreen contract
// ({ step, onCorrect, onHint, demo }) so they're drop-in MECHANICS entries.
import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MilkyWay } from '../scene/bodies/index.js';

// Portrait phones see a much narrower slice of the scene than landscape, so
// the camera pulls back as the aspect ratio drops (and returns on rotate) —
// the whole orbit/line-up stays in frame in both orientations.
function FitCamera({ position, fov }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / size.height;
    const k = aspect >= 1 ? 1 : Math.min(2.3, 1 / aspect);
    camera.position.set(position[0] * k, position[1] * k, position[2] * k);
    camera.fov = fov;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, position, fov]);
  return null;
}

// Shrinks the whole scene in portrait (and back up in landscape) so wide
// line-ups fit a narrow screen.
function PortraitGroup({ portraitScale, children }) {
  const size = useThree((s) => s.size);
  const s = size.width / size.height >= 1 ? 1 : portraitScale;
  return <group scale={s}>{children}</group>;
}

export default function Stage3D({ camera = { position: [0, 4, 12], fov: 46 }, ambient = 0.14, portraitScale = 1, overlay, children }) {
  return (
    <div className="fixed inset-0" data-stage3d>
      <Canvas dpr={[1, 2]} camera={camera} gl={{ antialias: true }}>
        <FitCamera position={camera.position} fov={camera.fov ?? 46} />
        <color attach="background" args={['#01020a']} />
        <ambientLight intensity={ambient} />
        <Suspense fallback={null}>
          <MilkyWay />
          <PortraitGroup portraitScale={portraitScale}>{children}</PortraitGroup>
        </Suspense>
      </Canvas>
      {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
    </div>
  );
}
