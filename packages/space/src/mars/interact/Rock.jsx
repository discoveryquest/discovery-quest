import { forwardRef, useMemo } from 'react';
import { BallCollider, RigidBody } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { telemetry } from '../telemetry.js';
import { playThud } from '../audio/marsAudio.js';

const ROCK_URL = '/mars/meshy/rock-a.glb';

// The Meshy Mars rock glb, cloned + centred + scaled so its widest extent ≈ the
// rock's diameter (it sits inside the BallCollider). One glb reused across all
// spawns with per-rock scale + a stable random tumble so they don't look identical.
function RockMesh({ radius, seed }) {
  const { scene } = useGLTF(ROCK_URL);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    clone.position.sub(c);
    clone.scale.setScalar((radius * 2.05) / (Math.max(size.x, size.y, size.z) || 1));
    clone.rotation.set(seed * 1.7, seed * 2.3, seed * 0.9);
    return clone;
  }, [scene, radius, seed]);
  return <primitive object={model} />;
}

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

// Throwable rock: the Meshy Mars-rock glb inside a ball collider. The interaction
// contract (props, ref, collider) is unchanged from the placeholder — only the
// visual mesh was swapped (T22).
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
  const seed = useMemo(() => (id ? [...id].reduce((a, c) => a + c.charCodeAt(0), 0) : 0), [id]);
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
      <RockMesh radius={radius} seed={seed} />
      {/* selection / held highlight ring around the rock */}
      {(selected || held) && (
        <mesh scale={radius * 1.25}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ffb15d" wireframe transparent opacity={held ? 0.4 : 0.25} />
        </mesh>
      )}
    </RigidBody>
  );
});

export default Rock;
useGLTF.preload(ROCK_URL);
