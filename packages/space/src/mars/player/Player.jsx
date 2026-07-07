import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { input, installInput } from '../input/inputStore.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { telemetry } from '../telemetry.js';
import { playStep } from '../audio/marsAudio.js';
import { terrainHeight } from '../scene/Terrain.jsx';
import { roverTour } from '../scene/roverTourState.js';
import Luna from './Luna.jsx';

const SPEED = 5;        // m/s walk
const JUMP_V0 = 5.2;    // single shared jump impulse (see gravity.js / plan R3)
const EYE = 1.15;       // first-person eye height above capsule center
const STEP_DIST = 1.5;  // metres of grounded travel between footstep crunches
const CAPSULE_HALF_HEIGHT = 0.5;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_FOOT_OFFSET = CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS;
const GROUND_PROBE = 0.18; // metres of snap/coyote allowance over visible terrain

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
  const visualPos = useRef(new THREE.Vector3());
  const visualTarget = useRef(new THREE.Vector3());
  const visualReady = useRef(false);
  // Rover exploded-view tour camera: eased position that flies from wherever the
  // player was into an orbit around the floating parts (see roverTourState).
  const tourCam = useRef(new THREE.Vector3());
  const tourReady = useRef(false);
  const scratch = useRef(new THREE.Vector3());
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
    let moving = input.forward !== 0 || input.right !== 0;
    if (moving) { const l = Math.hypot(vx, vz) || 1; vx = (vx / l) * SPEED; vz = (vz / l) * SPEED; }
    else { vx = 0; vz = 0; }

    // During the rover tour the player is a spectator: freeze walking (the camera
    // is flown around the floating parts instead) but keep gravity/grounding so
    // Luna stays planted.
    const tourActive = marsStore.getState().roverTour !== 'closed';
    if (tourActive) { vx = 0; vz = 0; moving = false; }

    const rawT = rb.translation();
    const cur = rb.linvel();
    // Terrain-probe grounded check. The previous "abs(vertical velocity) < ε"
    // check went true at the top of a jump and false on slopes, which made the
    // walk cycle strobe and occasionally left Luna looking like she floated.
    const surfaceY = terrainHeight(rawT.x, rawT.z);
    const footGap = rawT.y - CAPSULE_FOOT_OFFSET - surfaceY;
    const grounded = footGap > -0.20 && footGap < GROUND_PROBE && cur.y <= 0.65;
    const now = performance.now();
    if (input.jump && grounded && now - lastJump.current > 350) {
      rb.setLinvel({ x: vx, y: JUMP_V0, z: vz }, true);
      lastJump.current = now;
    } else {
      // When we are terrain-grounded, don't keep feeding tiny negative Rapier
      // contact velocities into the render transform. That contact chatter is a
      // common source of third-person character/camera jitter on trimesh floors.
      const vy = grounded && cur.y < 0.2 ? 0 : cur.y;
      rb.setLinvel({ x: vx, y: vy, z: vz }, true);
    }

    // Snap only the tiny "hover above the sampled ground" gap. This is not a
    // teleport controller; it just glues the capsule to the exact same height
    // function used to build the terrain mesh so feet stay visually planted.
    if (!input.jump && grounded && Math.abs(cur.y) < 1.3) {
      const targetY = surfaceY + CAPSULE_FOOT_OFFSET;
      const y = THREE.MathUtils.lerp(rawT.y, targetY, Math.min(1, dt * 18));
      if (Math.abs(y - rawT.y) > 0.001) rb.setTranslation({ x: rawT.x, y, z: rawT.z }, true);
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
    if (tourActive) {
      // Orbit the exploded diagram. Seed from the live camera on the first tour
      // frame so it flies in from wherever the player was standing, then ease
      // toward the orbit target every frame (drag-look spins yaw/pitch).
      const p = Math.max(-0.35, Math.min(0.95, input.pitch));
      const R = 5.4;
      const tx = roverTour.centerX + Math.sin(yaw) * R;
      const tz = roverTour.centerZ + Math.cos(yaw) * R;
      const ty = roverTour.centerY + 1.4 + p * 3.2;
      if (!tourReady.current) { tourCam.current.copy(camera.position); tourReady.current = true; }
      tourCam.current.lerp(scratch.current.set(tx, ty, tz), 1 - Math.exp(-dt * 3.2));
      camera.position.copy(tourCam.current);
      camera.lookAt(roverTour.focusX, roverTour.focusY, roverTour.focusZ);
      return; // tour owns the camera; skip the normal follow + GTA heading update
    }
    tourReady.current = false; // re-arm the fly-in for the next tour
    if (marsStore.getState().view === 'first') {
      telemetry.facingX = -sin;
      telemetry.facingZ = -cos;
      camera.position.set(t.x, t.y + EYE, t.z);
      camera.quaternion.setFromEuler(new THREE.Euler(input.pitch, yaw, 0, 'YXZ'));
    } else {
      if (!visualReady.current) {
        visualPos.current.set(t.x, t.y, t.z);
        visualReady.current = true;
      } else {
        visualTarget.current.set(t.x, t.y, t.z);
        visualPos.current.lerp(visualTarget.current, 1 - Math.exp(-dt * 22));
      }
      const rt = visualPos.current;
      // Orbit behind the player: yaw spins the camera around Luna (drag-look, no
      // walking) and pitch tilts it up/down, always looking at her back.
      const p = Math.max(-0.5, Math.min(0.9, input.pitch));
      camera.position.set(rt.x + sin * 4.5, rt.y + 2.4 + p * 3.4, rt.z + cos * 4.5);
      camera.lookAt(rt.x, rt.y + 1.0, rt.z);

      // GTA-style turning: Luna rotates to face where she's actually walking (so
      // forward+right runs diagonally with her body turned, not a locked strafe).
      // Ease toward the new heading via the shortest angle; keep facing when idle.
      if (moving) {
        const target = Math.atan2(vx, vz); // model faces (sinθ,cosθ) = (vx,vz)/|v|
        let d = target - heading.current;
        d = Math.atan2(Math.sin(d), Math.cos(d)); // wrap to [−π, π]
        heading.current += d * Math.min(1, dt * 10);
      }
      telemetry.facingX = Math.sin(heading.current);
      telemetry.facingZ = Math.cos(heading.current);
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
      linearDamping={0.15}
    >
      <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} friction={1.6} restitution={0} />
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
