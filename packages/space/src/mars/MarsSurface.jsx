import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { marsConfig } from './world/marsConfig.js';
import Terrain from './scene/Terrain.jsx';
import SkyDome from './scene/SkyDome.jsx';
import Player from './player/Player.jsx';

// Root 3D scene for the Mars POC. gl.preserveDrawingBuffer is required for the
// snapshot feature (Task 21), set here so Canvas creation isn't re-touched later.
// Gravity comes from marsConfig (toggled Mars/Earth in T16). Camera sits at a
// standing eye height so the regolith recedes to a horizon.
export default function MarsSurface() {
  return (
    <Canvas
      camera={{ position: [0, 1.7, 9], fov: 70 }}
      gl={{ preserveDrawingBuffer: true }}
      style={{ position: 'fixed', inset: 0 }}
    >
      {/* Scene fog tinted to the sky horizon blends the near terrain into the
          distant panorama; the sky sphere opts out via fog={false}. */}
      <fog attach="fog" args={[marsConfig.sky.horizon, 40, 420]} />
      {/* Warm, low Martian key light + soft fill so the dunes read. */}
      <hemisphereLight args={['#d9a06b', '#3a1e12', 0.5]} />
      <directionalLight position={[8, 10, 4]} intensity={1.5} color="#fff2e0" />
      <SkyDome top={marsConfig.sky.top} horizon={marsConfig.sky.horizon} />
      <Physics gravity={[0, -marsConfig.gravity, 0]}>
        <Terrain />
        <Player />
      </Physics>
    </Canvas>
  );
}
