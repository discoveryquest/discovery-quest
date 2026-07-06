import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

// Root 3D scene for the Mars POC. gl.preserveDrawingBuffer is required for the
// snapshot feature (Task 21), set here so Canvas creation isn't re-touched later.
// Physics gravity is per-world / toggle later; -3.72 m/s^2 = Mars (0.38 g) for now.
export default function MarsSurface() {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 4], fov: 70 }}
      gl={{ preserveDrawingBuffer: true }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} />
      <Physics gravity={[0, -3.72, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#c1440e" />
        </mesh>
      </Physics>
    </Canvas>
  );
}
