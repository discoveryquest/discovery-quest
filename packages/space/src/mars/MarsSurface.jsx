import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { marsConfig } from './world/marsConfig.js';
import Terrain from './scene/Terrain.jsx';
import ScatterRocks from './scene/ScatterRocks.jsx';
import RockField from './interact/RockField.jsx';
import SkyDome from './scene/SkyDome.jsx';
import MarsHorizon from './scene/MarsHorizon.jsx';
import Pennant from './scene/Pennant.jsx';
import Lander from './scene/Lander.jsx';
import Rover from './scene/Rover.jsx';
import WindProvider from './fx/WindProvider.jsx';
import DustParticles from './fx/DustParticles.jsx';
import Player from './player/Player.jsx';
import { useMarsState } from './store/marsStore.js';

// Root 3D scene for the Mars POC. gl.preserveDrawingBuffer is required for the
// snapshot feature (Task 21), set here so Canvas creation isn't re-touched later.
// Gravity comes from marsConfig (toggled Mars/Earth in T16). Camera sits at a
// standing eye height so the regolith recedes to a horizon.
export default function MarsSurface() {
  const { gravityMode } = useMarsState();
  const gravity = gravityMode === 'earth' ? marsConfig.earthGravity : marsConfig.gravity;
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
      <hemisphereLight args={['#e8d2ba', '#6b4630', 1.15]} />
      {/* Warm ambient floor so near-camera regolith never crushes to black. */}
      <ambientLight intensity={0.45} color="#d8c0aa" />
      <directionalLight position={[8, 10, 4]} intensity={1.5} color="#fff2e0" />
      <SkyDome top={marsConfig.sky.top} horizon={marsConfig.sky.horizon} />
      <MarsHorizon />
      {/* WindProvider runs the single wind clock; dust + pennant read the shared
          windState it writes (also surfaced on the HUD gauge). */}
      <WindProvider>
        <ScatterRocks />
        <DustParticles />
        <Pennant />
        <Lander />
        <Physics gravity={[0, -gravity, 0]}>
          <Terrain />
          <Rover />
          <RockField />
          <Player />
        </Physics>
      </WindProvider>
    </Canvas>
  );
}
