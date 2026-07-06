// 8K Milky Way panorama on a giant back-side sphere — the immersive backdrop
// behind every 3D scene. Drifts almost imperceptibly so the sky feels alive.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBodyTexture } from './textures.js';

export default function MilkyWay({ radius = 600, dim = 0.55, drift = 0.0035 }) {
  const map = useBodyTexture('stars_milky_way.jpg');
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += drift * dt; });
  const b = Math.round(dim * 255);
  return (
    <mesh ref={ref} frustumCulled={false}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshBasicMaterial
        map={map}
        side={THREE.BackSide}
        depthWrite={false}
        color={new THREE.Color(`rgb(${b},${b},${b})`)}
        fog={false}
      />
    </mesh>
  );
}
