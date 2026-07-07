import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Break the obvious 512px tile repeat: blend the diffuse with a second, much
// lower-frequency sampling of the same map. The two scales aren't periodic
// together, so the eye stops seeing the grid/mip seams at grazing angles.
function deTile(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D( map, vMapUv );
        vec4 macroDiffuseColor = texture2D( map, vMapUv * 0.137 );
        sampledDiffuseColor = mix( sampledDiffuseColor, macroDiffuseColor, 0.45 );
        diffuseColor *= sampledDiffuseColor;
      #endif`,
    );
  };
}

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
  const gl = useThree((s) => s.gl);
  // Modest segment count keeps the trimesh collider cheap on mobile.
  const geometry = useMemo(() => makeGeometry(size, 96), [size]);
  // Real NASA regolith (cropped from the Mastcam-Z panorama), tiled across the
  // patch and reused as a bump map for grainy relief. Slight warm tint lifts it
  // out of shadow under the low Mars key light. Max anisotropy keeps the tiles
  // crisp at grazing angles (this is what kills the hard mip/seam line running
  // across the mid-field); a slightly coarser repeat spaces the seams out too.
  const ground = useTexture('/mars/mars-ground.jpg');
  useMemo(() => {
    ground.wrapS = ground.wrapT = THREE.RepeatWrapping;
    ground.repeat.set(size / 12, size / 12);
    ground.anisotropy = gl?.capabilities?.getMaxAnisotropy?.() ?? 8;
    ground.needsUpdate = true;
  }, [ground, size, gl]);
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          map={ground}
          bumpMap={ground}
          bumpScale={0.12}
          color="#c9b6a3"
          roughness={1}
          onBeforeCompile={deTile}
        />
      </mesh>
    </RigidBody>
  );
}
