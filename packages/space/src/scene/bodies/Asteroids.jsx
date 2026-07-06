// Asteroids: a single displaced-icosahedron rock (seeded, deterministic) and
// an instanced belt that orbits at Kepler speed (ω ∝ a^-1.5) with per-rock
// spin and C/S/M-type color variation. One draw call for the whole belt.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beltRadPerSec } from './physics.js';
import { useBodyTexture } from './textures.js';

// tiny deterministic PRNG so rocks look the same every visit
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rockGeometry(seed = 7, radius = 1, roughness = 0.34) {
  const rnd = mulberry32(seed);
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const bumps = Array.from({ length: 6 }, () => ({
    dir: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(),
    amp: (rnd() - 0.35) * roughness,
    sharp: 1.5 + rnd() * 3,
  }));
  // Icosahedron geometry is non-indexed (vertices duplicated per face), so
  // displacement MUST be a pure function of position or faces tear apart.
  const posHash = (x, y, z) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let d = 1 + (posHash(v.x, v.y, v.z) - 0.5) * roughness * 0.3;
    for (const b of bumps) d += b.amp * Math.pow(Math.max(0, v.dot(b.dir)), b.sharp);
    pos.setXYZ(i, v.x * radius * d, v.y * radius * d, v.z * radius * d);
  }
  geo.computeVertexNormals();
  return geo;
}

export function Asteroid({ seed = 7, radius = 1, position = [0, 0, 0], spin = 0.25 }) {
  const map = useBodyTexture('ceres.jpg');
  const geo = useMemo(() => rockGeometry(seed, radius), [seed, radius]);
  const ref = useRef();
  const axis = useMemo(() => { const r = mulberry32(seed + 1); return new THREE.Vector3(r() - 0.5, 1, r() - 0.5).normalize(); }, [seed]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotateOnAxis(axis, spin * dt); });
  return (
    <mesh ref={ref} geometry={geo} position={position} castShadow receiveShadow>
      <meshStandardMaterial map={map} roughness={1} metalness={0.05} />
    </mesh>
  );
}

const TYPE_COLORS = [new THREE.Color('#6b4a2c'), new THREE.Color('#9a9a9a'), new THREE.Color('#8a7360')]; // C / S / M

export function AsteroidBelt({ inner = 18, outer = 24, count = 500, thickness = 0.9, timeScale = 4000, rockSize = 0.09, seed = 42 }) {
  const map = useBodyTexture('ceres.jpg');
  const geo = useMemo(() => rockGeometry(seed, 1, 0.5), [seed]);
  const ref = useRef();

  const rocks = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: count }, () => {
      const a = inner + rnd() * (outer - inner);
      // map display radius back to a pseudo-AU for Kepler speed (belt ≈ 2.2-3.2 AU)
      const aAU = 2.2 + ((a - inner) / (outer - inner)) * 1.0;
      return {
        a,
        angle: rnd() * Math.PI * 2,
        omega: beltRadPerSec(aAU, timeScale) * (0.9 + rnd() * 0.2),
        y: (rnd() - 0.5) * thickness,
        scale: rockSize * (0.4 + rnd() * rnd() * 2.2),
        tumble: (rnd() - 0.5) * 2,
        type: Math.floor(rnd() * 3),
      };
    });
  }, [inner, outer, count, thickness, timeScale, rockSize, seed]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  useMemo(() => { // per-instance type tint, set once
    if (!ref.current) return;
  }, []);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    rocks.forEach((rk, i) => {
      const ang = rk.angle + rk.omega * t;
      dummy.position.set(Math.cos(ang) * rk.a, rk.y, Math.sin(ang) * rk.a);
      dummy.rotation.set(rk.tumble * t, ang, rk.tumble * 0.7 * t);
      dummy.scale.setScalar(rk.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (!mesh.instanceColor) mesh.setColorAt(i, TYPE_COLORS[rk.type]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial map={map} roughness={1} metalness={0.05} />
    </instancedMesh>
  );
}
