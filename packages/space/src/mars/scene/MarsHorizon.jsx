import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Distant Mars horizon: the sky+hills band of the real NASA Mastcam-Z panorama
// (cropped to a rover-free section, mirror-tiled) wrapped on a big open cylinder
// so the scene is ringed by actual Martian crater-rim hills under a hazy sky,
// instead of a bare gradient. Sits inside the sky sphere (500) and outside the
// terrain (~100), so the near terrain occludes its base and the sky sphere shows
// above it. Unlit backdrop.
export default function MarsHorizon({ radius = 400, height = 150, y = 42, repeat = 3 }) {
  const tex = useTexture('/mars/mars-horizon.png');
  useMemo(() => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.x = repeat;
    tex.anisotropy = 8;
  }, [tex, repeat]);
  return (
    <mesh position={[0, y, 0]}>
      <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
      <meshBasicMaterial
        map={tex}
        side={THREE.BackSide}
        transparent
        fog={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
