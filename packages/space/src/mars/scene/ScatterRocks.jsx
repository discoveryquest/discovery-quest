import { useMemo } from 'react';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { terrainHeight } from './Terrain.jsx';

// Static scenery boulders scattered across the regolith — parallax reference so
// walking reads as motion over otherwise featureless ground. (Throwable rocks are
// a separate physics system, M4.) Deterministic placement (seeded) so the field
// is stable across reloads. Boulders at or above SOLID_R get a FIXED ball collider
// so the player bumps them instead of walking through; smaller pebbles stay purely
// visual (a collider on every tiny stone would snag the player constantly).
const SOLID_R = 0.32; // metres — below this a rock is a pebble, no collider

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

  return rocks.map((rk, i) => {
    const mesh = (
      <mesh rotation={rk.rot} scale={[1, 0.7, 1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[rk.r, 0]} />
        <meshStandardMaterial color={`rgb(${110 * rk.shade | 0}, ${58 * rk.shade | 0}, ${34 * rk.shade | 0})`} roughness={1} flatShading />
      </mesh>
    );
    // Pebble: plain decorative mesh, no physics cost.
    if (rk.r < SOLID_R) {
      return <group key={i} position={rk.pos}>{mesh}</group>;
    }
    // Boulder: fixed body with a ball collider just inside the visible silhouette
    // (r*0.82) so blocking feels honest, not like an invisible wall.
    return (
      <RigidBody key={i} type="fixed" colliders={false} position={rk.pos}>
        <BallCollider args={[rk.r * 0.82]} />
        {mesh}
      </RigidBody>
    );
  });
}
