import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { windState } from '../fx/windState.js';
import { terrainHeight } from './Terrain.jsx';

// A small flag planted near the spawn point — the *visible* wind indicator. The
// cloth vertices ride a travelling wave whose amplitude tracks the live gust, so
// when the dust thickens the pennant snaps taut in the same moment. Cheap CPU
// vertex displacement (a few hundred verts); the flag is attached at its left
// edge to a thin pole. Decorative — no collider.
export default function Pennant({ position = [3.4, 0, -2.5], poleHeight = 2.3 }) {
  const [px, , pz] = position;
  const groundY = useMemo(() => terrainHeight(px, pz), [px, pz]);

  const flagW = 1.15;
  const flagH = 0.72;
  const geom = useMemo(() => new THREE.PlaneGeometry(flagW, flagH, 20, 8), []);
  const rest = useMemo(() => Float32Array.from(geom.attributes.position.array), [geom]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geom.attributes.position;
    const amp = 0.045 + windState.gust * 0.24;
    const freq = 4 + windState.speed * 0.35;
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3];
      const y = rest[i * 3 + 1];
      const k = (x + flagW / 2) / flagW; // 0 at the pole, 1 at the free edge
      const z = Math.sin(x * 6 - t * freq) * amp * k;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <group position={[px, groundY, pz]}>
      <mesh position={[0, poleHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.032, poleHeight, 8]} />
        <meshStandardMaterial color="#c9c9d2" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* free edge hangs off to +x; the mesh is shifted so its left edge sits on the pole */}
      <mesh position={[flagW / 2, poleHeight - 0.45, 0]} castShadow>
        <primitive object={geom} attach="geometry" />
        <meshStandardMaterial color="#d1421a" side={THREE.DoubleSide} roughness={0.85} metalness={0} />
      </mesh>
    </group>
  );
}
