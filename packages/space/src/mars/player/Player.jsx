import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { input, installInput } from '../input/inputStore.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { telemetry } from '../telemetry.js';
import { playStep } from '../audio/marsAudio.js';
import Luna from './Luna.jsx';

const SPEED = 5;        // m/s walk
const JUMP_V0 = 5.2;    // single shared jump impulse (see gravity.js / plan R3)
const EYE = 1.15;       // first-person eye height above capsule center
const STEP_DIST = 1.5;  // metres of grounded travel between footstep crunches

// Owns the physics capsule + reads input + drives the camera (first/third person).
// Combined here (rather than split controllers) to avoid cross-component ref
// plumbing for a POC; Luna is a swappable visual child shown in third-person.
export default function Player() {
  const body = useRef();
  const { camera, gl } = useThree();
  const { view } = useMarsState();
  const lastJump = useRef(0);
  const lastGrounded = useRef(0);      // for coyote-time walking detection
  const stepAccum = useRef(STEP_DIST); // primed so the first stride lands a step
  const lunaRef = useRef();
  // Luna's facing angle θ (the suit model faces (sinθ, cosθ) in world x/z). π = −z
  // = away from the spawn camera. GTA-style: eased toward the movement heading.
  const heading = useRef(Math.PI);

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
    // Coyote-smoothed walking flag: gentle terrain slopes briefly lift the player,
    // which would otherwise strobe the gait/footsteps. Treat as "on ground" if we
    // were grounded within the last 220ms — a real jump lasts far longer, so it
    // still reads as airborne.
    if (grounded) lastGrounded.current = now;
    telemetry.stepping = now - lastGrounded.current < 220 && telemetry.speed > 0.3;

    // Footstep crunches: one every STEP_DIST metres of walking (plays in both
    // camera views; silent until audio is armed by the first gesture).
    if (telemetry.stepping) {
      stepAccum.current += telemetry.speed * dt;
      if (stepAccum.current >= STEP_DIST) {
        stepAccum.current = 0;
        playStep(0.42 + Math.random() * 0.18);
      }
    } else {
      stepAccum.current = STEP_DIST; // re-arm so moving off again steps immediately
    }
    if (marsStore.getState().view === 'first') {
      camera.position.set(t.x, t.y + EYE, t.z);
      camera.quaternion.setFromEuler(new THREE.Euler(input.pitch, yaw, 0, 'YXZ'));
    } else {
      // Orbit behind the player: yaw spins the camera around Luna (drag-look, no
      // walking) and pitch tilts it up/down, always looking at her back.
      const p = Math.max(-0.5, Math.min(0.9, input.pitch));
      camera.position.set(t.x + sin * 4.5, t.y + 2.4 + p * 3.4, t.z + cos * 4.5);
      camera.lookAt(t.x, t.y + 1.0, t.z);

      // GTA-style turning: Luna rotates to face where she's actually walking (so
      // forward+right runs diagonally with her body turned, not a locked strafe).
      // Ease toward the new heading via the shortest angle; keep facing when idle.
      if (moving) {
        const target = Math.atan2(vx, vz); // model faces (sinθ,cosθ) = (vx,vz)/|v|
        let d = target - heading.current;
        d = Math.atan2(Math.sin(d), Math.cos(d)); // wrap to [−π, π]
        heading.current += d * Math.min(1, dt * 10);
      }
      if (lunaRef.current) lunaRef.current.rotation.y = heading.current;
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
      {/* Luna, third-person only. Her rotation.y is driven each frame in useFrame
          (heading toward movement); the initial π faces her away from the spawn
          camera flash-free. Feet at capsule bottom = center − (halfH + r) = −0.85. */}
      {view === 'third' && (
        <group ref={lunaRef} position={[0, -0.85, 0]} rotation={[0, Math.PI, 0]}>
          <Luna />
        </group>
      )}
    </RigidBody>
  );
}
