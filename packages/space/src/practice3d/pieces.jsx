// Shared pieces for 3D practice mechanics. Course missions mix real bodies
// (earth, jupiter…) with CONCEPTS (Core, GPS, Nebula…) — concepts render as
// EmojiOrbs: a soft glowing sphere with the emoji floating on it and a name
// chip below. renderPiece() picks the right representation automatically.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet, Asteroid, BODIES } from '../scene/bodies/index.js';

export function EmojiOrb({ emoji = '✨', radius = 0.85, tint = '#38bdf8' }) {
  const shell = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame((state) => {
    if (shell.current) shell.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.6 + phase) * 0.045);
  });
  return (
    <group>
      <mesh ref={shell}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial color={tint} transparent opacity={0.22} roughness={0.15} transmission={0.6} thickness={0.5} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial color={tint} transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Html center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ fontSize: `${Math.round(radius * 44)}px`, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>{emoji}</span>
      </Html>
    </group>
  );
}

// A mission item as a 3D object: a real body when the id is one (real planets
// beat emoji every time), an EmojiOrb otherwise.
export function renderPiece(item, radius) {
  if (item.id === 'asteroid') return <Asteroid seed={13} radius={radius * 0.85} spin={0.3} />;
  if (BODIES[item.id]) return <Planet body={item.id} radius={radius} timeScale={6000} detail={item.id === 'saturn' || item.id === 'uranus'} />;
  return <EmojiOrb emoji={item.emoji} radius={radius} />;
}

// Consistent name-chip styling across mechanics.
export function chipClass(state) {
  const base = 'touch-manipulation whitespace-nowrap rounded-full border px-3 py-1 text-xs font-extrabold capitalize backdrop-blur-sm ';
  if (state === 'held') return base + 'border-amber-300 bg-amber-400/20 text-amber-100';
  if (state === 'won') return base + 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200';
  return base + 'border-white/15 bg-slate-950/60 text-slate-200';
}
