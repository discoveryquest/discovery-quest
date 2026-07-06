import { forwardRef } from 'react';
import { BallCollider, RigidBody } from '@react-three/rapier';
import { telemetry } from '../telemetry.js';
import { playThud } from '../audio/marsAudio.js';

// Impact SFX: on a new contact, scale a thud by the rock's speed (resting rocks
// read ~0 so settling is silent) and pan by where it landed relative to the
// player. Audio is a no-op until the context is armed by a user gesture, so
// spawn-time settling before any click makes no sound.
function onRockImpact({ target }) {
  const rb = target?.rigidBody;
  if (!rb) return;
  const v = rb.linvel();
  const speed = Math.hypot(v.x, v.y, v.z);
  if (speed < 1.2) return;
  const t = rb.translation();
  playThud(Math.min(1, speed / 11), Math.max(-1, Math.min(1, (t.x - telemetry.x) / 10)));
}

// Placeholder throwable rock. The visual is intentionally cheap (an icosahedron)
// so the POC proves the physics/learning loop first; Meshy rocks can replace the
// mesh behind this component in T22 without changing the interaction contract.
const Rock = forwardRef(function Rock(
  {
    id,
    position,
    radius = 0.32,
    selected = false,
    held = false,
    interesting = false,
  },
  ref,
) {
  const color = interesting ? '#6f7f87' : '#5d2b1d';
  return (
    <RigidBody
      ref={ref}
      name={`mars-rock-${id}`}
      type={held ? 'kinematicPosition' : 'dynamic'}
      gravityScale={held ? 0 : 1}
      colliders={false}
      mass={1.1}
      position={position}
      linearDamping={0.18}
      angularDamping={0.25}
      restitution={0.35}
      friction={0.9}
      canSleep={!held}
      onCollisionEnter={onRockImpact}
      ccd
    >
      <BallCollider args={[radius * 0.82]} />
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[radius, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={1}
          flatShading
          emissive={selected || held ? '#ff9d4a' : '#000000'}
          emissiveIntensity={held ? 0.45 : selected ? 0.28 : 0}
        />
      </mesh>
      {(selected || held) && (
        <mesh scale={1.18}>
          <icosahedronGeometry args={[radius, 1]} />
          <meshBasicMaterial color="#ffb15d" wireframe transparent opacity={held ? 0.35 : 0.22} />
        </mesh>
      )}
    </RigidBody>
  );
});

export default Rock;
