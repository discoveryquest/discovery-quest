import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A planet/moon. Textures aren't shipped in the open repo, so models map to
// stylized material presets; the app shell can swap in GLTF/texture maps later.
const MODELS = {
  sun: { color: '#fff3c4', emissive: '#ffcf5c', emissiveIntensity: 1.4, roughness: 0.4 },
  mercury: { color: '#b1a296', emissive: '#1a1612', roughness: 1.0 },
  venus: { color: '#e6c27a', emissive: '#2a2110', roughness: 0.9 },
  earth: { color: '#3b82f6', emissive: '#0b1f3a', roughness: 0.85 },
  moon: { color: '#cbd5e1', emissive: '#1c2230', roughness: 1.0 },
  mars: { color: '#c1440e', emissive: '#2a0f06', roughness: 0.9 },
  jupiter: { color: '#d8ca9d', emissive: '#241f12', roughness: 0.8 },
  saturn: { color: '#e3d8b0', emissive: '#2a2415', roughness: 0.8 },
  uranus: { color: '#9fe3e3', emissive: '#0f2a2a', roughness: 0.75 },
  neptune: { color: '#4b6cb7', emissive: '#0b1530', roughness: 0.75 },
  blackhole: { color: '#05050a', emissive: '#241546', emissiveIntensity: 0.3, roughness: 1.0 },
  iss: { color: '#d4d9e0', emissive: '#1c2230', emissiveIntensity: 0.2, roughness: 0.35 },
  satellite: { color: '#aab2bd', emissive: '#15171c', emissiveIntensity: 0.2, roughness: 0.4 },
};
const DEFAULT_MODEL = { color: '#9ca3af', emissive: '#111827', roughness: 0.9 };

export default function Body({ model = 'default', radius = 1, position = [0, 0, 0], spin = 0 }) {
  const ref = useRef();
  if (model !== 'default' && !MODELS[model]) console.warn(`[Body] unknown model "${model}", using default`);
  const m = MODELS[model] ?? DEFAULT_MODEL;

  useFrame((_, dt) => { if (ref.current && spin) ref.current.rotation.y += spin * dt; });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial color={m.color} emissive={m.emissive} emissiveIntensity={m.emissiveIntensity ?? 1} roughness={m.roughness} metalness={0.1} />
      </mesh>
      {/* faint atmosphere rim so a lit sphere doesn't read as a flat disc */}
      <mesh scale={1.07}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={m.color} transparent opacity={0.13} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
