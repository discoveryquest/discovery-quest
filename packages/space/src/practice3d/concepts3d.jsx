// Procedural 3D models for every CONCEPT item in space.course.yml practice
// steps — no emojis anywhere in the scenes (Pavel 2026-07-04). Each entry is
// a tiny primitive build (spheres, cones, sprites, particle systems), sized
// to a unit radius and scaled by the caller. Real bodies never come through
// here (renderPiece routes planet ids to the bodies kit first).
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- shared sprite textures (canvas, cached at module level) ----------------
const texCache = {};
function radialSprite(key, stops) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache[key] = t;
  return t;
}
function burstSprite(key, color, rays = 10) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.translate(128, 128);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const g = ctx.createLinearGradient(0, 0, Math.cos(a) * 120, Math.sin(a) * 120);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = i % 2 ? 3 : 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 120, Math.sin(a) * 120);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache[key] = t;
  return t;
}
const puffTex = () => radialSprite('puff', [[0, 'rgba(255,255,255,0.85)'], [0.5, 'rgba(255,255,255,0.28)'], [1, 'rgba(255,255,255,0)']]);
const glowTex = () => radialSprite('glow', [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]);

// --- building blocks ---------------------------------------------------------
function GlowStar({ color = '#f8fafc', r = 0.5, flare = false }) {
  return (
    <group>
      <mesh><sphereGeometry args={[r * 0.42, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <sprite scale={[r * 3.2, r * 3.2, 1]}>
        <spriteMaterial map={flare ? burstSprite('flare' + color, color, 4) : glowTex()} color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

function CloudPuff({ color = '#cbd5e1', r = 1, n = 6, seed = 1, opacity = 0.55, flat = false }) {
  const puffs = useMemo(() => {
    let s = seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s % 1000) / 1000; };
    return Array.from({ length: n }, () => [
      (rnd() - 0.5) * r * 1.5, (rnd() - 0.5) * r * (flat ? 0.5 : 1), (rnd() - 0.5) * r * 0.5,
      r * (0.7 + rnd() * 0.9),
    ]);
  }, [r, n, seed, flat]);
  return (
    <group>
      {puffs.map(([x, y, z, s], i) => (
        <sprite key={i} position={[x, y, z]} scale={[s, s * 0.8, 1]}>
          <spriteMaterial map={puffTex()} color={color} transparent opacity={opacity} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

function Galaxy({ hue = '#a5b4fc', core = '#fde68a', tilt = -0.9, seed = 3 }) {
  const geo = useMemo(() => {
    let s = seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s % 1000) / 1000; };
    const N = 700;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const cA = new THREE.Color(hue), cB = new THREE.Color(core);
    for (let i = 0; i < N; i++) {
      const arm = i % 2 ? 0 : Math.PI;
      const d = Math.pow(rnd(), 0.6);
      const ang = arm + d * 4.4 + (rnd() - 0.5) * 0.55;
      pos[i * 3] = Math.cos(ang) * d * 1.15;
      pos[i * 3 + 1] = (rnd() - 0.5) * 0.09 * (1.1 - d);
      pos[i * 3 + 2] = Math.sin(ang) * d * 1.15;
      const c = cB.clone().lerp(cA, Math.min(1, d * 1.4));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [hue, core, seed]);
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.22; });
  return (
    <group rotation-x={tilt}>
      <points ref={ref} geometry={geo}>
        <pointsMaterial size={0.05} vertexColors transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      <sprite scale={[0.8, 0.8, 1]}><spriteMaterial map={glowTex()} color={core} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  );
}

function Rocket({ flame = false, tilt = 0.35 }) {
  return (
    <group rotation-z={-tilt} scale={0.92}>
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.3, 0.34, 1.1, 20]} /><meshStandardMaterial color="#e2e8f0" roughness={0.35} /></mesh>
      <mesh position={[0, 0.82, 0]}><coneGeometry args={[0.3, 0.55, 20]} /><meshStandardMaterial color="#f87171" roughness={0.4} /></mesh>
      <mesh position={[0, 0.28, 0.31]}><sphereGeometry args={[0.11, 12, 12]} /><meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.5} /></mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.32, -0.5, Math.sin(a) * 0.32]} rotation-y={-a}>
            <boxGeometry args={[0.09, 0.42, 0.3]} /><meshStandardMaterial color="#f87171" roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, -0.62, 0]}><coneGeometry args={[0.2, 0.25, 16]} /><meshStandardMaterial color="#64748b" roughness={0.6} /></mesh>
      {flame && (
        <group position={[0, -1.05, 0]}>
          <mesh rotation-x={Math.PI}><coneGeometry args={[0.17, 0.7, 14]} /><meshBasicMaterial color="#fbbf24" transparent opacity={0.9} /></mesh>
          <sprite scale={[1.1, 1.4, 1]} position={[0, -0.2, 0]}><spriteMaterial map={glowTex()} color="#fb923c" transparent depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        </group>
      )}
    </group>
  );
}

function MiniEarth({ r = 0.42 }) {
  // texture-free mini earth: blue sphere + white cloud dabs — cheap everywhere
  return (
    <group>
      <mesh><sphereGeometry args={[r, 24, 24]} /><meshStandardMaterial color="#2563eb" roughness={0.6} /></mesh>
      <mesh position={[r * 0.35, r * 0.3, r * 0.62]}><sphereGeometry args={[r * 0.42, 10, 10]} /><meshStandardMaterial color="#34d399" roughness={0.9} /></mesh>
      <mesh position={[-r * 0.5, -r * 0.15, r * 0.55]}><sphereGeometry args={[r * 0.3, 10, 10]} /><meshStandardMaterial color="#34d399" roughness={0.9} /></mesh>
      <mesh scale={1.06}><sphereGeometry args={[r, 16, 16]} /><meshBasicMaterial color="#93c5fd" transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  );
}

function Satellite() {
  return (
    <group rotation-z={0.3}>
      <mesh><boxGeometry args={[0.5, 0.42, 0.42]} /><meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.35} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.85, 0, 0]}><boxGeometry args={[0.9, 0.04, 0.5]} /><meshStandardMaterial color="#1d4ed8" emissive="#1e3a8a" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} /></mesh>
      ))}
      <mesh position={[0, 0.36, 0]} rotation-x={-0.4}><coneGeometry args={[0.16, 0.25, 12, 1, true]} /><meshStandardMaterial color="#e2e8f0" side={THREE.DoubleSide} roughness={0.4} /></mesh>
    </group>
  );
}

function OrbitAroundEarth({ trail = false }) {
  const sat = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime * 1.4;
    sat.current?.position.set(Math.cos(t) * 0.95, Math.sin(t) * 0.28, Math.sin(t) * 0.55);
  });
  return (
    <group>
      <MiniEarth r={0.45} />
      <mesh rotation-x={-1.25}><torusGeometry args={[0.98, 0.012, 8, 48]} /><meshBasicMaterial color="#67e8f9" transparent opacity={trail ? 0.75 : 0.4} /></mesh>
      <group ref={sat} scale={0.28}><Satellite /></group>
    </group>
  );
}

function ProhibitionEarth() {
  return (
    <group>
      <MiniEarth r={0.5} />
      <group rotation-z={0.5}>
        <mesh><torusGeometry args={[0.85, 0.09, 12, 48]} /><meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.5} roughness={0.4} /></mesh>
        <mesh><boxGeometry args={[1.7, 0.18, 0.1]} /><meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.5} roughness={0.4} /></mesh>
      </group>
    </group>
  );
}

function Flask() {
  return (
    <group position={[0, -0.15, 0]}>
      <mesh position={[0, 0.28, 0]}><coneGeometry args={[0.5, 0.85, 20, 1, true]} /><meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.02, 0]}><coneGeometry args={[0.38, 0.34, 20]} /><meshStandardMaterial color="#4ade80" emissive="#16a34a" emissiveIntensity={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.12, 0.12, 0.42, 12, 1, true]} /><meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#86efac" transparent opacity={0.8} /></mesh>
    </group>
  );
}

const CONE = Math.PI / 2;
function ArcTube({ radius = 0.8, tube = 0.045, arc = Math.PI * 0.8, color = '#e2e8f0', rot = [0, 0, 0], opacity = 1 }) {
  return (
    <mesh rotation={rot}>
      <torusGeometry args={[radius, tube, 10, 40, arc]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

// --- the registry ------------------------------------------------------------
// Each: (props) => JSX at ~unit size. Missing ids fall back to a plain glow
// orb (still emoji-free) + a console.warn nudging authors to add a model.
export const CONCEPTS = {
  // Sun parts
  core: () => <GlowStar color="#fde68a" r={0.85} />,
  surface: () => (
    <group>
      <mesh><sphereGeometry args={[0.72, 32, 32]} /><meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.9} roughness={0.7} /></mesh>
      <mesh scale={1.12}><sphereGeometry args={[0.72, 20, 20]} /><meshBasicMaterial color="#fb923c" transparent opacity={0.2} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  ),
  rays: () => (
    <sprite scale={[2.4, 2.4, 1]}><spriteMaterial map={burstSprite('rays', 'rgba(253,224,71,0.95)', 12)} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
  ),
  // stars & star life
  star: () => <GlowStar r={0.6} />,
  newstar: () => <GlowStar r={0.6} color="#bfdbfe" />,
  'baby-star': () => <GlowStar r={0.5} color="#fbcfe8" />,
  sirius: () => <GlowStar r={0.62} color="#bfdbfe" flare />,
  guide: () => <GlowStar r={0.7} color="#fef9c3" flare />,
  tug: () => (
    <group>
      <GlowStar r={0.55} />
      <ArcTube radius={0.75} arc={1.1} color="#67e8f9" rot={[0.4, 0, 0.4]} opacity={0.8} />
      <ArcTube radius={0.75} arc={1.1} color="#67e8f9" rot={[0.4, 0, 0.4 + Math.PI]} opacity={0.8} />
    </group>
  ),
  giant: () => (
    <group>
      <mesh><sphereGeometry args={[0.95, 32, 32]} /><meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={1.1} roughness={0.8} /></mesh>
      <sprite scale={[3, 3, 1]}><spriteMaterial map={glowTex()} color="#f87171" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  ),
  supernova: () => (
    <group>
      <GlowStar r={0.7} color="#fef08a" />
      <sprite scale={[3.4, 3.4, 1]}><spriteMaterial map={burstSprite('nova', 'rgba(254,240,138,0.95)', 14)} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  ),
  nebula: () => <CloudPuff color="#c4b5fd" r={0.85} seed={5} opacity={0.6} />,
  // nebula ingredients
  gas: () => <CloudPuff color="#5eead4" r={0.75} seed={9} opacity={0.5} />,
  dust: () => (
    <group>
      <CloudPuff color="#fcd34d" r={0.5} n={4} seed={11} opacity={0.35} />
      {[[-0.4, 0.3, 0], [0.35, -0.2, 0.2], [0.1, 0.45, -0.1], [-0.15, -0.4, 0.1], [0.5, 0.25, 0]].map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.055, 8, 8]} /><meshBasicMaterial color="#fde68a" /></mesh>
      ))}
    </group>
  ),
  stars: () => (
    <group>
      <GlowStar r={0.4} color="#bfdbfe" />
      <group position={[0.55, 0.35, -0.2]}><GlowStar r={0.28} /></group>
      <group position={[-0.5, -0.3, 0.1]}><GlowStar r={0.24} color="#fde68a" /></group>
    </group>
  ),
  // galaxies
  milky: () => <Galaxy />,
  andromeda: () => <Galaxy hue="#93c5fd" core="#fbcfe8" tilt={-0.6} seed={17} />,
  // constellations
  picture: () => {
    const pts = [[-0.7, -0.35, 0], [-0.25, 0.4, 0], [0.2, -0.15, 0], [0.7, 0.45, 0]];
    return (
      <group>
        {pts.map((p, i) => <group key={i} position={p}><GlowStar r={0.2} /></group>)}
        {pts.slice(1).map((p, i) => {
          const a = pts[i];
          const mid = [(a[0] + p[0]) / 2, (a[1] + p[1]) / 2, 0];
          const len = Math.hypot(p[0] - a[0], p[1] - a[1]);
          const ang = Math.atan2(p[1] - a[1], p[0] - a[0]);
          return (
            <mesh key={'l' + i} position={mid} rotation-z={ang}>
              <boxGeometry args={[len, 0.035, 0.035]} /><meshBasicMaterial color="#67e8f9" transparent opacity={0.85} />
            </mesh>
          );
        })}
      </group>
    );
  },
  season: () => (
    <group>
      <group position={[-0.55, 0, 0]}><GlowStar r={0.3} color="#fde68a" /></group>
      <group position={[0.45, 0, 0]} rotation-z={0.41}>
        <MiniEarth r={0.34} />
        <mesh><cylinderGeometry args={[0.02, 0.02, 1.05, 6]} /><meshBasicMaterial color="#e2e8f0" transparent opacity={0.8} /></mesh>
      </group>
    </group>
  ),
  // black holes
  blackhole: () => (
    <group rotation-x={0.35}>
      <mesh><sphereGeometry args={[0.42, 32, 32]} /><meshBasicMaterial color="#000000" /></mesh>
      <mesh rotation-x={CONE}><torusGeometry args={[0.72, 0.09, 12, 48]} /><meshBasicMaterial color="#fbbf24" /></mesh>
      <mesh rotation-x={CONE}><torusGeometry args={[0.72, 0.16, 12, 48]} /><meshBasicMaterial color="#f97316" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  ),
  light: () => (
    <group>
      <mesh><sphereGeometry args={[0.3, 24, 24]} /><meshBasicMaterial color="#000000" /></mesh>
      <ArcTube radius={0.62} arc={Math.PI * 0.95} color="#fef9c3" rot={[0, 0, Math.PI * 0.05]} />
      <ArcTube radius={0.62} arc={Math.PI * 0.95} color="#fef9c3" rot={[0, 0, Math.PI * 1.05]} />
      <mesh position={[-1.15, 0.62, 0]} rotation-z={-0.12}><boxGeometry args={[0.85, 0.045, 0.045]} /><meshBasicMaterial color="#fef9c3" /></mesh>
      <mesh position={[1.15, 0.62, 0]} rotation-z={0.12}><boxGeometry args={[0.85, 0.045, 0.045]} /><meshBasicMaterial color="#fef9c3" /></mesh>
    </group>
  ),
  sound: () => (
    <group>
      <mesh><sphereGeometry args={[0.16, 12, 12]} /><meshBasicMaterial color="#e2e8f0" /></mesh>
      {[0.42, 0.68, 0.95].map((r, i) => (
        <ArcTube key={r} radius={r} arc={Math.PI * 0.7} color="#a5b4fc" rot={[0, 0, -Math.PI * 0.35]} opacity={0.75 - i * 0.2} />
      ))}
    </group>
  ),
  ice: () => (
    <mesh rotation={[0.4, 0.6, 0]}>
      <icosahedronGeometry args={[0.72, 0]} />
      <meshPhysicalMaterial color="#bae6fd" roughness={0.05} transmission={0.7} thickness={1} transparent opacity={0.9} />
    </mesh>
  ),
  cloud: () => <CloudPuff color="#e2e8f0" r={0.7} seed={7} flat />,
  clouds: () => <CloudPuff color="#e2e8f0" r={0.7} seed={7} flat />,
  storms: () => (
    <group>
      <CloudPuff color="#475569" r={0.7} seed={13} flat opacity={0.85} />
      <mesh position={[0.05, -0.55, 0.3]} rotation-z={0.35}><boxGeometry args={[0.09, 0.55, 0.06]} /><meshBasicMaterial color="#fde047" /></mesh>
      <mesh position={[-0.12, -0.95, 0.3]} rotation-z={-0.4}><boxGeometry args={[0.08, 0.45, 0.06]} /><meshBasicMaterial color="#fde047" /></mesh>
    </group>
  ),
  wind: () => (
    <group>
      {[0.3, 0, -0.3].map((y, i) => (
        <ArcTube key={i} radius={0.7 + i * 0.12} tube={0.035} arc={Math.PI * 0.85} color="#cbd5e1" rot={[CONE, 0, 0.4 + i * 0.25]} opacity={0.6} />
      ))}
    </group>
  ),
  ocean: () => (
    <group rotation-x={-0.9}>
      <mesh><circleGeometry args={[0.95, 40]} /><meshStandardMaterial color="#0ea5e9" roughness={0.25} metalness={0.1} /></mesh>
      {[0.3, 0.55, 0.8].map((r) => (
        <mesh key={r} position={[0, 0, 0.01]}><ringGeometry args={[r, r + 0.03, 40]} /><meshBasicMaterial color="#7dd3fc" transparent opacity={0.5} /></mesh>
      ))}
    </group>
  ),
  // rockets & ISS life
  rocket: () => <Rocket />,
  thrust: () => <Rocket flame tilt={0} />,
  stage: () => (
    <group rotation-z={-0.3} scale={0.9}>
      <group position={[0, 0.4, 0]}><Rocket tilt={0} /></group>
      <mesh position={[0, -0.95, 0]}><cylinderGeometry args={[0.3, 0.32, 0.6, 20]} /><meshStandardMaterial color="#94a3b8" roughness={0.5} /></mesh>
    </group>
  ),
  reuse: () => (
    <group scale={0.9}>
      <mesh position={[0, -0.95, 0]}><cylinderGeometry args={[0.75, 0.85, 0.14, 28]} /><meshStandardMaterial color="#475569" roughness={0.7} /></mesh>
      <group position={[0, -0.2, 0]}><Rocket tilt={0} /></group>
    </group>
  ),
  orbit: () => <OrbitAroundEarth trail />,
  freefall: () => <OrbitAroundEarth />,
  'no-gravity': () => <ProhibitionEarth />,
  magnets: () => (
    <group rotation-z={Math.PI}>
      <mesh><torusGeometry args={[0.5, 0.16, 14, 40, Math.PI]} /><meshStandardMaterial color="#dc2626" roughness={0.35} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.5, -0.22, 0]}><boxGeometry args={[0.32, 0.28, 0.32]} /><meshStandardMaterial color="#e2e8f0" roughness={0.3} /></mesh>
      ))}
    </group>
  ),
  exercise: () => (
    <group rotation-z={0.35}>
      <mesh><cylinderGeometry args={[0.06, 0.06, 1.15, 10]} /><meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0, s * 0.48, 0]}><cylinderGeometry args={[0.3, 0.3, 0.16, 20]} /><meshStandardMaterial color="#1e293b" roughness={0.6} /></mesh>
          <mesh position={[0, s * 0.64, 0]}><cylinderGeometry args={[0.22, 0.22, 0.14, 20]} /><meshStandardMaterial color="#334155" roughness={0.6} /></mesh>
        </group>
      ))}
    </group>
  ),
  sleep: () => (
    <group rotation-z={0.08}>
      <mesh position={[0, -0.18, 0]}><boxGeometry args={[1.5, 0.28, 0.85]} /><meshStandardMaterial color="#e2e8f0" roughness={0.8} /></mesh>
      <mesh position={[0.15, 0.04, 0]}><boxGeometry args={[1.1, 0.2, 0.8]} /><meshStandardMaterial color="#3b82f6" roughness={0.7} /></mesh>
      <mesh position={[-0.55, 0.06, 0]}><sphereGeometry args={[0.2, 14, 14]} /><meshStandardMaterial color="#f8fafc" roughness={0.9} /></mesh>
    </group>
  ),
  experiment: () => <Flask />,
  plants: () => (
    <group position={[0, -0.25, 0]}>
      <mesh><cylinderGeometry args={[0.3, 0.22, 0.4, 16]} /><meshStandardMaterial color="#b45309" roughness={0.8} /></mesh>
      <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.04, 0.05, 0.35, 8]} /><meshStandardMaterial color="#365314" roughness={0.9} /></mesh>
      <mesh position={[0, 0.62, 0]}><sphereGeometry args={[0.32, 14, 14]} /><meshStandardMaterial color="#22c55e" roughness={0.8} /></mesh>
      <mesh position={[0.25, 0.45, 0.1]}><sphereGeometry args={[0.18, 10, 10]} /><meshStandardMaterial color="#4ade80" roughness={0.8} /></mesh>
    </group>
  ),
  // satellites & navigation
  satellite: () => <Satellite />,
  gps: () => (
    <group>
      <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.42, 20, 20]} /><meshStandardMaterial color="#ef4444" roughness={0.35} /></mesh>
      <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#fecaca" roughness={0.3} /></mesh>
      <mesh position={[0, -0.4, 0]} rotation-x={Math.PI}><coneGeometry args={[0.3, 0.85, 20]} /><meshStandardMaterial color="#ef4444" roughness={0.35} /></mesh>
    </group>
  ),
  maps: () => {
    return (
      <group rotation-x={-0.7}>
        <mesh><planeGeometry args={[1.6, 1.1]} /><meshStandardMaterial color="#fef3c7" roughness={0.9} side={THREE.DoubleSide} /></mesh>
        {[-0.45, 0, 0.45].map((x) => (
          <mesh key={'v' + x} position={[x, 0, 0.01]}><boxGeometry args={[0.02, 1.1, 0.005]} /><meshBasicMaterial color="#b45309" /></mesh>
        ))}
        {[-0.3, 0.15].map((y) => (
          <mesh key={'h' + y} position={[0, y, 0.01]}><boxGeometry args={[1.6, 0.02, 0.005]} /><meshBasicMaterial color="#b45309" /></mesh>
        ))}
        <mesh position={[0.3, 0.18, 0.03]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color="#ef4444" /></mesh>
      </group>
    );
  },
  rope: () => (
    <group rotation-x={0.5}>
      {[0.22, 0, -0.22].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}><torusGeometry args={[0.5 - i * 0.04, 0.11, 12, 32]} /><meshStandardMaterial color="#d6a35c" roughness={0.85} /></mesh>
      ))}
    </group>
  ),
  planet: () => <MiniEarth r={0.6} />,
  // cosmic neighborhood (bands 5-8)
  snowball: () => (
    <group>
      <mesh rotation={[0.5, 0.3, 0]}><icosahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color="#e0f2fe" roughness={0.55} flatShading /></mesh>
      <sprite scale={[1.6, 1.6, 1]}><spriteMaterial map={glowTex()} color="#bae6fd" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  ),
  tail: () => (
    <group rotation-z={-0.5}>
      {[0, 1, 2, 3].map((i) => (
        <sprite key={i} position={[i * 0.42, 0, 0]} scale={[0.9 - i * 0.15, 0.55 - i * 0.08, 1]}>
          <spriteMaterial map={puffTex()} color={i < 2 ? '#bae6fd' : '#67e8f9'} transparent opacity={0.55 - i * 0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  ),
  comet: () => (
    <group rotation-z={-0.4}>
      <mesh rotation={[0.5, 0.3, 0]} position={[-0.5, 0, 0]}><icosahedronGeometry args={[0.4, 1]} /><meshStandardMaterial color="#e0f2fe" roughness={0.5} flatShading /></mesh>
      {[0, 1, 2].map((i) => (
        <sprite key={i} position={[i * 0.5, 0.08 * i, 0]} scale={[1 - i * 0.2, 0.6 - i * 0.12, 1]}>
          <spriteMaterial map={puffTex()} color="#93c5fd" transparent opacity={0.5 - i * 0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  ),
  fire: () => (
    <group>
      <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.4, 1.1, 14]} /><meshBasicMaterial color="#f97316" transparent opacity={0.9} /></mesh>
      <mesh position={[0, 0.02, 0]}><coneGeometry args={[0.22, 0.7, 12]} /><meshBasicMaterial color="#fde047" /></mesh>
      <sprite scale={[1.8, 1.8, 1]}><spriteMaterial map={glowTex()} color="#fb923c" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  ),
  belt: () => (
    <group rotation-x={-0.5}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = -0.9 + i * 0.24;
        return (
          <mesh key={i} position={[Math.sin(a) * 1.05, 0, -Math.cos(a) * 0.35]} rotation={[i, i * 0.7, 0]}>
            <icosahedronGeometry args={[0.09 + (i % 3) * 0.045, 0]} />
            <meshStandardMaterial color={i % 2 ? '#8a7360' : '#6b5b4a'} roughness={1} flatShading />
          </mesh>
        );
      })}
    </group>
  ),
  gravity: () => (
    <group>
      <MiniEarth r={0.5} />
      {[[-0.85, 0.75], [0.85, 0.75]].map(([x, y], i) => (
        <group key={i} position={[x, y, 0]}>
          <mesh position={[0, -0.1, 0]} rotation-x={Math.PI}><coneGeometry args={[0.14, 0.3, 10]} /><meshBasicMaterial color="#67e8f9" /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.05, 0.05, 0.4, 8]} /><meshBasicMaterial color="#67e8f9" /></mesh>
        </group>
      ))}
    </group>
  ),
  storm: () => (
    <group rotation-x={-0.65}>
      <mesh><circleGeometry args={[0.75, 40]} /><meshStandardMaterial color="#b45309" roughness={0.7} /></mesh>
      {[0.22, 0.42, 0.62].map((r, i) => (
        <mesh key={r} position={[0, 0, 0.02]} rotation-z={i * 1.6}>
          <ringGeometry args={[r, r + 0.09, 32, 1, 0, Math.PI * 1.4]} />
          <meshBasicMaterial color={i % 2 ? '#fdba74' : '#fca5a5'} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  ),
  ring: () => (
    <group rotation-x={-0.8}>
      <mesh><ringGeometry args={[0.55, 0.95, 48]} /><meshBasicMaterial color="#e3d8b4" transparent opacity={0.9} side={THREE.DoubleSide} /></mesh>
      <mesh><ringGeometry args={[0.42, 0.5, 48]} /><meshBasicMaterial color="#c9b98c" transparent opacity={0.7} side={THREE.DoubleSide} /></mesh>
    </group>
  ),
  rings: () => (
    <group rotation-x={-0.8}>
      <mesh><sphereGeometry args={[0.42, 24, 24]} /><meshStandardMaterial color="#e3d8b0" roughness={0.7} /></mesh>
      <mesh><ringGeometry args={[0.6, 1, 48]} /><meshBasicMaterial color="#e3d8b4" transparent opacity={0.85} side={THREE.DoubleSide} /></mesh>
    </group>
  ),
  titan: () => (
    <group>
      <mesh><sphereGeometry args={[0.55, 24, 24]} /><meshStandardMaterial color="#d97706" roughness={0.8} /></mesh>
      <mesh scale={1.16}><sphereGeometry args={[0.55, 16, 16]} /><meshBasicMaterial color="#fbbf24" transparent opacity={0.22} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  ),
  rocky: () => (
    <group>
      <mesh><sphereGeometry args={[0.6, 24, 24]} /><meshStandardMaterial color="#9a8a7a" roughness={1} /></mesh>
      {[[0.25, 0.3, 0.48], [-0.3, 0.05, 0.5], [0.05, -0.35, 0.47]].map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.1 - i * 0.02, 10, 10]} /><meshStandardMaterial color="#6b5b4a" roughness={1} /></mesh>
      ))}
    </group>
  ),
  // life support & exploration (later bands)
  air: () => (
    <group>
      {[[0, 0, 0, 0.34], [0.42, 0.3, 0.1, 0.22], [-0.38, 0.22, -0.1, 0.18], [0.12, -0.42, 0.05, 0.24], [-0.3, -0.3, 0.1, 0.14]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshPhysicalMaterial color="#bfdbfe" transparent opacity={0.4} roughness={0.05} transmission={0.6} thickness={0.4} />
        </mesh>
      ))}
    </group>
  ),
  water: () => (
    <group>
      <mesh position={[0, -0.15, 0]}><sphereGeometry args={[0.5, 24, 24]} /><meshPhysicalMaterial color="#38bdf8" roughness={0.05} transmission={0.45} thickness={0.8} /></mesh>
      <mesh position={[0, 0.42, 0]}><coneGeometry args={[0.28, 0.6, 20]} /><meshPhysicalMaterial color="#38bdf8" roughness={0.05} transmission={0.45} thickness={0.8} /></mesh>
      <mesh position={[-0.14, 0, 0.38]}><sphereGeometry args={[0.09, 10, 10]} /><meshBasicMaterial color="#e0f2fe" transparent opacity={0.8} /></mesh>
    </group>
  ),
  food: () => (
    <group>
      <mesh><sphereGeometry args={[0.52, 24, 24]} /><meshStandardMaterial color="#dc2626" roughness={0.35} /></mesh>
      <mesh position={[0, 0.55, 0]} rotation-z={0.3}><cylinderGeometry args={[0.035, 0.05, 0.25, 8]} /><meshStandardMaterial color="#78350f" roughness={0.9} /></mesh>
      <mesh position={[0.16, 0.6, 0]} rotation-z={-0.9}><sphereGeometry args={[0.14, 10, 6]} /><meshStandardMaterial color="#16a34a" roughness={0.8} /></mesh>
    </group>
  ),
  cooling: () => (
    <group>
      {[-0.4, 0, 0.4].map((x) => (
        <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.22, 1.2, 0.06]} /><meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.25} roughness={0.3} /></mesh>
      ))}
      <mesh position={[0, 0, -0.06]}><boxGeometry args={[1.15, 0.16, 0.06]} /><meshStandardMaterial color="#94a3b8" roughness={0.4} /></mesh>
    </group>
  ),
  tether: () => (
    <group rotation-z={0.35}>
      <mesh position={[0, 0.35, 0]}><torusGeometry args={[0.2, 0.05, 10, 24]} /><meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.35} /></mesh>
      <mesh position={[0, -0.25, 0]} rotation-z={0.15}><cylinderGeometry args={[0.045, 0.045, 1, 8]} /><meshStandardMaterial color="#e2e8f0" roughness={0.7} /></mesh>
      <mesh position={[0, -0.8, 0]}><torusGeometry args={[0.13, 0.045, 10, 20]} /><meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} /></mesh>
    </group>
  ),
  sunglasses: () => (
    <group>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation-x={CONE}><cylinderGeometry args={[0.34, 0.34, 0.08, 24]} /><meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.3} /></mesh>
      ))}
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.3, 0.06, 0.06]} /><meshStandardMaterial color="#334155" roughness={0.3} /></mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={'a' + x} position={[x, 0.12, -0.25]} rotation-y={x > 0 ? -0.5 : 0.5}><boxGeometry args={[0.06, 0.06, 0.55]} /><meshStandardMaterial color="#334155" roughness={0.3} /></mesh>
      ))}
    </group>
  ),
  habitat: () => (
    <group position={[0, -0.2, 0]}>
      <mesh><cylinderGeometry args={[0.75, 0.8, 0.25, 28]} /><meshStandardMaterial color="#94a3b8" roughness={0.6} /></mesh>
      <mesh position={[0, 0.14, 0]}><sphereGeometry args={[0.72, 28, 16, 0, Math.PI * 2, 0, CONE]} /><meshPhysicalMaterial color="#bae6fd" transparent opacity={0.4} roughness={0.05} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.4, 0.35, 0.4]} /><meshStandardMaterial color="#e2e8f0" roughness={0.5} /></mesh>
      <mesh position={[0.72, 0.05, 0]} rotation-z={CONE}><cylinderGeometry args={[0.12, 0.12, 0.35, 12]} /><meshStandardMaterial color="#cbd5e1" roughness={0.5} /></mesh>
    </group>
  ),
  power: () => (
    <group rotation-x={-0.35}>
      <mesh><boxGeometry args={[1.5, 0.9, 0.05]} /><meshStandardMaterial color="#1d4ed8" emissive="#1e3a8a" emissiveIntensity={0.5} metalness={0.6} roughness={0.25} /></mesh>
      {[-0.375, 0, 0.375].map((x) => (
        <mesh key={x} position={[x, 0, 0.03]}><boxGeometry args={[0.02, 0.9, 0.02]} /><meshBasicMaterial color="#93c5fd" /></mesh>
      ))}
      <mesh position={[0, 0, 0.03]}><boxGeometry args={[1.5, 0.02, 0.02]} /><meshBasicMaterial color="#93c5fd" /></mesh>
      <mesh position={[0, -0.65, -0.15]} rotation-x={0.5}><cylinderGeometry args={[0.06, 0.06, 0.5, 8]} /><meshStandardMaterial color="#64748b" roughness={0.4} /></mesh>
    </group>
  ),
  rover: () => (
    <group position={[0, -0.1, 0]}>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[1.05, 0.32, 0.6]} /><meshStandardMaterial color="#e2e8f0" roughness={0.45} /></mesh>
      {[[-0.38, 0.28], [0.38, 0.28], [-0.38, -0.28], [0.38, -0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.08, z]} rotation-x={CONE}>
          <cylinderGeometry args={[0.17, 0.17, 0.12, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[-0.32, 0.48, 0]}><cylinderGeometry args={[0.03, 0.03, 0.4, 8]} /><meshStandardMaterial color="#94a3b8" roughness={0.4} /></mesh>
      <mesh position={[-0.32, 0.7, 0]}><boxGeometry args={[0.22, 0.14, 0.05]} /><meshStandardMaterial color="#0f172a" roughness={0.3} /></mesh>
      <mesh position={[0.25, 0.42, 0]} rotation-x={-0.3}><boxGeometry args={[0.4, 0.02, 0.3]} /><meshStandardMaterial color="#1d4ed8" emissive="#1e3a8a" emissiveIntensity={0.4} roughness={0.3} /></mesh>
    </group>
  ),
};

// ids that are just another name for a real body in the textured kit
export const BODY_ALIASES = { luna: 'moon' };
