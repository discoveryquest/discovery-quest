// Shared pieces for 3D practice mechanics. Course missions mix real bodies
// (earth, jupiter…) with CONCEPTS (Core, GPS, Nebula…). NO EMOJIS anywhere
// (Pavel 2026-07-04): bodies render from the textured kit, concepts from the
// procedural CONCEPTS registry, and unknown ids get a plain glow orb plus a
// console.warn nudging authors to add a model.
import * as THREE from 'three';
import { Planet, Asteroid, BODIES } from '../scene/bodies/index.js';
import { CONCEPTS, BODY_ALIASES } from './concepts3d.jsx';

function GlowOrb({ radius = 0.85, tint = '#38bdf8' }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial color={tint} transparent opacity={0.25} roughness={0.15} transmission={0.6} thickness={0.5} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial color={tint} transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// A mission item as a real 3D object.
const ROCK_SEEDS = { asteroid: 13, 'belt-rock': 21, 'crater-rock': 33 };
export function renderPiece(item, radius) {
  if (ROCK_SEEDS[item.id]) return <Asteroid seed={ROCK_SEEDS[item.id]} radius={radius * 0.85} spin={0.3} />;
  const bodyId = BODY_ALIASES[item.id] ?? item.id;
  if (BODIES[bodyId]) return <Planet body={bodyId} radius={radius} timeScale={6000} detail={bodyId === 'saturn' || bodyId === 'uranus'} />;
  const Concept = CONCEPTS[item.id];
  if (Concept) return <group scale={radius}><Concept /></group>;
  console.warn(`[practice3d] no 3D model for item "${item.id}" — add one to concepts3d.jsx`);
  return <GlowOrb radius={radius} />;
}

// Consistent name-chip styling across mechanics.
export function chipClass(state) {
  const base = 'touch-manipulation whitespace-nowrap rounded-full border px-3 py-1 text-xs font-extrabold capitalize backdrop-blur-sm ';
  if (state === 'held') return base + 'border-amber-300 bg-amber-400/20 text-amber-100';
  if (state === 'won') return base + 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200';
  return base + 'border-white/15 bg-slate-950/60 text-slate-200';
}
