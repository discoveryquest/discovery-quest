import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// Bounded, gently undulating regolith patch. The SAME displaced geometry drives
// the visible mesh AND a trimesh collider (RigidBody colliders="trimesh"), so the
// player walks exactly on what they see — no foot sliding/floating (plan M5).
// Deterministic displacement keeps it stable. The regolith texture arrives in T6;
// until then a flat rusty color stands in.
function makeGeometry(size, segments) {
  const g = new THREE.PlaneGeometry(size, size, segments, segments);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.8
            + Math.sin(x * 0.13 + 1.7) * 0.3;
    pos.setY(i, h);
  }
  g.computeVertexNormals();
  return g;
}

export default function Terrain({ size = 200, color = '#8f4a2a' }) {
  // Modest segment count keeps the trimesh collider cheap on mobile.
  const geometry = useMemo(() => makeGeometry(size, 96), [size]);
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </RigidBody>
  );
}
