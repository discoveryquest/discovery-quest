import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { terrainHeight } from './Terrain.jsx';
import { ROVER_POS } from './landmarks.js';

// The real NASA Perseverance rover (public-domain glb fetched in T6) — the "find
// a real object on Mars" payoff. Loaded via drei useGLTF (suspends inside the
// MarsRoute Suspense boundary). Wrapped in a FIXED rapier body with a boxy
// collider so thrown rocks bounce off it and it never moves (spec §6, R8). The
// glb ships at a large scale, so we scale it down to a ~3 m rover.
const ASSET = '/mars/perseverance.glb';

export default function Rover({ position = ROVER_POS, scale = 0.6 }) {
  const { scene } = useGLTF(ASSET);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    return clone;
  }, [scene]);

  const [x, , z] = position;
  const groundY = useMemo(() => terrainHeight(x, z), [x, z]);

  return (
    <RigidBody type="fixed" colliders={false} position={[x, groundY, z]}>
      <primitive object={model} scale={scale} rotation={[0, -Math.PI / 4, 0]} />
      {/* Approximate body collider so rocks bounce; sized to the scaled rover. */}
      <CuboidCollider args={[1.3, 1.1, 1.5]} position={[0, 1.1, 0]} />
    </RigidBody>
  );
}

useGLTF.preload(ASSET);
