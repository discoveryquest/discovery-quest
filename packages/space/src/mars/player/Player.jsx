import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { input, installInput } from '../input/inputStore.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { telemetry } from '../telemetry.js';
import Luna from './Luna.jsx';

const SPEED = 5;        // m/s walk
const JUMP_V0 = 5.2;    // single shared jump impulse (see gravity.js / plan R3)
const EYE = 1.15;       // first-person eye height above capsule center

// Owns the physics capsule + reads input + drives the camera (first/third person).
// Combined here (rather than split controllers) to avoid cross-component ref
// plumbing for a POC; Luna is a swappable visual child shown in third-person.
export default function Player() {
  const body = useRef();
  const { camera, gl } = useThree();
  const { view } = useMarsState();
  const lastJump = useRef(0);

  useEffect(() => installInput(marsStore.toggleView), []);

  // Pointer lock for first-person mouse-look (only requested in first-person).
  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => { if (marsStore.getState().view === 'first') el.requestPointerLock?.(); };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [gl]);

  useFrame((_, dt) => {
    const rb = body.current;
    if (!rb) return;
    const yaw = input.yaw;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);

    // Movement relative to camera yaw: forward = (-sin,0,-cos), right = (cos,0,-sin).
    let vx = -sin * input.forward + cos * input.right;
    let vz = -cos * input.forward - sin * input.right;
    const moving = input.forward !== 0 || input.right !== 0;
    if (moving) { const l = Math.hypot(vx, vz) || 1; vx = (vx / l) * SPEED; vz = (vz / l) * SPEED; }
    else { vx = 0; vz = 0; }

    const cur = rb.linvel();
    // Velocity-based grounded check + short cooldown (avoids double-jump at apex).
    const grounded = Math.abs(cur.y) < 0.08;
    const now = performance.now();
    if (input.jump && grounded && now - lastJump.current > 350) {
      rb.setLinvel({ x: vx, y: JUMP_V0, z: vz }, true);
      lastJump.current = now;
    } else {
      rb.setLinvel({ x: vx, y: cur.y, z: vz }, true);
    }

    // Drive the camera.
    const t = rb.translation();

    // Telemetry for the HUD (movement confirmation).
    telemetry.x = t.x; telemetry.y = t.y; telemetry.z = t.z;
    telemetry.speed = Math.hypot(vx, vz);
    telemetry.grounded = grounded;
    if (marsStore.getState().view === 'first') {
      camera.position.set(t.x, t.y + EYE, t.z);
      camera.quaternion.setFromEuler(new THREE.Euler(input.pitch, yaw, 0, 'YXZ'));
    } else {
      // Orbit behind the player (behind = +forward-basis so we look at their back).
      camera.position.set(t.x + sin * 4.5, t.y + 2.4, t.z + cos * 4.5);
      camera.lookAt(t.x, t.y + 1.0, t.z);
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      mass={1}
      position={[0, 3, 0]}
      enabledRotations={[false, false, false]}
      canSleep={false}
    >
      <CapsuleCollider args={[0.5, 0.35]} />
      {/* Luna faces the player's forward (-z at yaw 0); shown only in third-person.
          Feet at capsule bottom = center - (halfHeight + radius) = -0.85. */}
      {view === 'third' && (
        <group position={[0, -0.85, 0]} rotation={[0, input.yaw, 0]}>
          <Luna />
        </group>
      )}
    </RigidBody>
  );
}
