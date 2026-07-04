import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

// A navigation beacon over a station. Tapping an unlocked beacon is the core
// "choose a destination" verb (spec §5.1). Pulses when selectable; dimmed when
// locked; gold when it's the active travel target.
export default function Beacon({ position = [0, 0, 0], label, locked = false, active = false, onSelect }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.12;
    ref.current.scale.setScalar(locked ? 0.45 : pulse);
  });

  const color = locked ? '#475569' : active ? '#fbbf24' : '#22d3ee';

  return (
    <group position={position}>
      {/* Enlarged invisible hit sphere — forgiving tap target on touch/small
          screens. Hidden (and so not raycast) when locked, so it never blocks taps. */}
      <mesh
        visible={!locked}
        onClick={(e) => { e.stopPropagation(); if (!locked) onSelect?.(); }}
        onPointerOver={() => { if (!locked) document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Visual marker (pulses; non-interactive). */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshBasicMaterial color={color} transparent opacity={locked ? 0.3 : 0.95} wireframe={locked} />
      </mesh>
      {label && (
        // No distanceFactor → fixed screen-space size (consistent, not giant up close).
        // Low zIndexRange keeps labels behind the HUD overlays (no more collisions).
        <Html center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            whiteSpace: 'nowrap', transform: 'translateY(-34px)',
            color: '#e2e8f0', font: '700 12px system-ui, sans-serif', letterSpacing: '0.2px',
            background: 'rgba(8,12,28,0.7)', padding: '3px 9px', borderRadius: 999,
            border: '1px solid rgba(148,163,184,0.3)',
            opacity: locked ? 0.45 : 1,
          }}>{label}</div>
        </Html>
      )}
    </group>
  );
}
