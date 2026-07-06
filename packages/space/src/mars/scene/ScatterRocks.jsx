import { useMemo } from 'react';
import { terrainHeight } from './Terrain.jsx';

// Static scenery boulders scattered across the regolith. Purely visual — they
// give the eye parallax reference so walking reads as motion over otherwise
// featureless ground. (Throwable rocks are a separate physics system, M4.)
// Deterministic placement (seeded) so the field is stable across reloads.
export default function ScatterRocks({ count = 60, area = 70, seed = 7 }) {
  const rocks = useMemo(() => {
    let s = seed % 2147483647;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: count }, () => {
      const x = (rnd() - 0.5) * area * 2;
      const z = (rnd() - 0.5) * area * 2;
      const r = 0.18 + rnd() * 0.55;
      return {
        pos: [x, terrainHeight(x, z) + r * 0.35, z],
        r,
        rot: [rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI],
        shade: 0.55 + rnd() * 0.35,
      };
    });
  }, [count, area, seed]);

  return rocks.map((rk, i) => (
    <mesh key={i} position={rk.pos} rotation={rk.rot} scale={[1, 0.7, 1]} castShadow receiveShadow>
      <dodecahedronGeometry args={[rk.r, 0]} />
      <meshStandardMaterial color={`rgb(${110 * rk.shade | 0}, ${58 * rk.shade | 0}, ${34 * rk.shade | 0})`} roughness={1} flatShading />
    </mesh>
  ));
}
