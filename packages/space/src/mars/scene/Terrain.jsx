import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Bounded, gently undulating regolith patch. The SAME displaced geometry drives
// the visible mesh AND a trimesh collider (RigidBody colliders="trimesh"), so the
// player walks exactly on what they see — no foot sliding/floating (plan M5).
// Deterministic displacement keeps it stable. The regolith texture arrives in T6;
// until then a flat rusty color stands in.
// Shared surface height so anything placed on the ground (boulders, spawns)
// matches the mesh exactly. DRY: the mesh displacement uses this too.
export function terrainHeight(x, z) {
  return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.8
       + Math.sin(x * 0.13 + 1.7) * 0.3;
}

function makeGeometry(size, segments) {
  const g = new THREE.PlaneGeometry(size, size, segments, segments);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  }
  g.computeVertexNormals();
  return g;
}

export default function Terrain({ size = 200 }) {
  // Modest segment count keeps the trimesh collider cheap on mobile.
  const geometry = useMemo(() => makeGeometry(size, 96), [size]);
  // Real NASA regolith (cropped from the Mastcam-Z panorama), tiled across the
  // patch and reused as a bump map for grainy relief. Slight warm tint lifts it
  // out of shadow under the low Mars key light.
  const ground = useTexture('/mars/mars-ground.jpg');
  useMemo(() => {
    ground.wrapS = ground.wrapT = THREE.RepeatWrapping;
    ground.repeat.set(size / 9, size / 9);
    ground.anisotropy = 8;
  }, [ground, size]);
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          map={ground}
          bumpMap={ground}
          bumpScale={0.12}
          color="#e6a877"
          roughness={1}
        />
      </mesh>
    </RigidBody>
  );
}
