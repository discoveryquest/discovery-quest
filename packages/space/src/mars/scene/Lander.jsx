import { useMemo } from 'react';
import { terrainHeight } from './Terrain.jsx';
import { LANDER_POS } from './landmarks.js';

// The spawn-anchor lander — a small descent-stage prop so the player starts
// "next to the ship" rather than in empty desert. Built from primitives (a real
// Meshy/NASA glb can swap in at M8). Decorative: no collider. Gold foil body,
// splayed legs, a stubby high-gain antenna.
export default function Lander({ position = LANDER_POS }) {
  const [x, , z] = position;
  const groundY = useMemo(() => terrainHeight(x, z), [x, z]);
  const legs = [0, 1, 2, 3].map((i) => (i * Math.PI) / 2 + Math.PI / 4);

  return (
    <group position={[x, groundY, z]}>
      {/* foil-wrapped body */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.05, 0.7, 8]} />
        <meshStandardMaterial color="#c9a54e" metalness={0.85} roughness={0.35} flatShading />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.9, 0.45, 8]} />
        <meshStandardMaterial color="#b7902f" metalness={0.85} roughness={0.4} flatShading />
      </mesh>
      {/* antenna */}
      <mesh position={[0.35, 2.15, 0.35]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
        <meshStandardMaterial color="#ddd" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.35, 2.65, 0.35]} castShadow>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshStandardMaterial color="#eee" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* legs + footpads */}
      {legs.map((a, i) => {
        const lx = Math.cos(a) * 1.15;
        const lz = Math.sin(a) * 1.15;
        return (
          <group key={i}>
            <mesh position={[lx * 0.6, 0.5, lz * 0.6]} rotation={[Math.PI / 2 - 0.5, 0, -a + Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 1.5, 6]} />
              <meshStandardMaterial color="#8a8a92" metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[lx, 0.06, lz]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.12, 10]} />
              <meshStandardMaterial color="#6f6f78" metalness={0.5} roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
