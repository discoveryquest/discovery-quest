import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { input } from '../input/inputStore.js';
import { telemetry } from '../telemetry.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { ROVER_PARTS, CHASSIS_ID } from './roverParts.js';
import { roverPoseAt } from './roverMotion.js';
import { partIdForObject, gallerySlot } from './explode.js';

// The real NASA Perseverance rover (public-domain glb fetched in T6) — the "find
// a real object on Mars" payoff. It slowly patrols so it feels alive, then, when
// the player presses E nearby, it becomes the star of an exploded-view tour: the
// rover freezes and its subsystems fly out into a camera-facing gallery spread
// across the screen, with the selected part lifted to a centre spotlight (glowing
// cyan) and its info card shown. Stepping through parts glides them between their
// shelf slot and centre. Closing eases everything back home to reassemble.
const ASSET = '/mars/perseverance.glb';
const MODEL_SCALE = 0.6;
const MODEL_YAW_OFFSET = -Math.PI / 4;
const ROT_SENS = 0.01;   // radians of part spin per pixel of drag
const ZOOM_MIN = 0.65;   // how far you can push the inspected part away
const ZOOM_MAX = 2.6;    // how close you can pull it in
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const q = new THREE.Quaternion();
const e = new THREE.Euler(0, 0, 0, 'XYZ');
const tmpV = new THREE.Vector3();
const tmpCentroid = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camRight = new THREE.Vector3();
const camUp = new THREE.Vector3();
const camFwd = new THREE.Vector3();
const mQuat = new THREE.Quaternion();
const mQuatInv = new THREE.Quaternion();
const localQuat = new THREE.Quaternion();
const idQuat = new THREE.Quaternion();
const qDelta = new THREE.Quaternion();
const qPitch = new THREE.Quaternion();

function cloneRover(scene) {
  const clone = scene.clone(true);
  clone.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
    else if (o.material) o.material = o.material.clone();
  });
  return clone;
}

function forEachMaterial(object, fn) {
  const mats = Array.isArray(object.material) ? object.material : [object.material];
  mats.filter(Boolean).forEach(fn);
}

// Cyan edge glow for the selected part. Rather than flooding the part with emissive
// (which washed out its real texture), we inject a Fresnel rim into the material's
// shader: the part stays fully visible and gains a glowing cyan border at its
// silhouette. Toggled per material; customProgramCacheKey keeps the on/off variants
// as distinct compiled programs (see candidate procedural-regolith-and-detile-shader).
const RIM_COLOR = new THREE.Color('#3ff0ff');

function setRimHighlight(material, on) {
  if (!!material.userData.__rimOn === !!on) return; // no redundant recompiles
  material.userData.__rimOn = on;
  if (on) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uRimColor = { value: RIM_COLOR };
      shader.uniforms.uRimPower = { value: 2.4 };
      shader.uniforms.uRimStrength = { value: 1.5 };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimPower;\nuniform float uRimStrength;',
        )
        .replace(
          '#include <dithering_fragment>',
          '#include <dithering_fragment>\n  float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), uRimPower);\n  gl_FragColor.rgb += uRimColor * clamp(rim * uRimStrength, 0.0, 1.0);',
        );
    };
    material.customProgramCacheKey = () => 'mars-rim-on';
  } else {
    material.onBeforeCompile = () => {};
    material.customProgramCacheKey = () => 'mars-rim-off';
  }
  material.needsUpdate = true;
}

// Reparent every mesh into a flat per-part "shell" group so nested subsystems
// (the arm's turret instruments) can fly apart independently and each part is a
// single pickable subtree. attach() preserves world transforms, so at rest
// (shell.position = 0) the rover looks byte-identical to the un-exploded model.
// Each shell records the part's geometric centre and its slot order (the nav /
// ROVER_PARTS order) so the gallery arc lays parts out left-to-right consistently.
function buildShells(model) {
  model.updateWorldMatrix(true, true);
  const leaves = [];
  model.traverse((o) => { if (o.isMesh) leaves.push(o); });

  const groups = new Map(); // partId -> { leaves, sum, count }
  for (const leaf of leaves) {
    const local = model.worldToLocal(leaf.getWorldPosition(new THREE.Vector3()));
    const id = partIdForObject(leaf) ?? CHASSIS_ID;
    if (!groups.has(id)) groups.set(id, { leaves: [], sum: new THREE.Vector3(), count: 0 });
    const g = groups.get(id);
    g.leaves.push(leaf);
    g.sum.add(local);
    g.count += 1;
  }

  const shells = [];
  for (const [id, g] of groups) {
    const shell = new THREE.Group();
    shell.name = `shell:${id}`;
    shell.userData.partId = id;
    shell.userData.orderIndex = Math.max(0, ROVER_PARTS.findIndex((p) => p.id === id));
    shell.userData.centroid = g.sum.multiplyScalar(1 / g.count).clone();
    shell.userData.userRot = new THREE.Quaternion(); // player inspection spin (world space)
    model.add(shell);
    for (const leaf of g.leaves) shell.attach(leaf); // keeps world transform
    shells.push(shell);
  }
  return shells;
}

function applyHighlight(shells, selectedId, tourActive) {
  for (const shell of shells) {
    const selected = tourActive && shell.userData.partId === selectedId;
    shell.traverse((o) => {
      if (o.isMesh) forEachMaterial(o, (m) => setRimHighlight(m, selected));
    });
  }
}

export default function Rover() {
  const body = useRef();
  const { scene } = useGLTF(ASSET);
  const { camera } = useThree();
  const { roverTour: tour, roverPartIndex } = useMarsState();
  const model = useMemo(() => cloneRover(scene), [scene]);

  const shells = useRef(null);
  const factor = useRef(0);      // 0 assembled → 1 fully laid out in the gallery
  const frozen = useRef(null);   // pose captured when the tour opened
  const prevTour = useRef('closed');
  const zoom = useRef(1);        // inspection zoom of the spotlight part
  const grab = useRef(null);     // { startX, startY, startQuat } while spinning a part

  const selectedId = ROVER_PARTS[roverPartIndex]?.id ?? null;

  // Re-apply the glow whenever the selection or tour state changes.
  useEffect(() => {
    if (shells.current) applyHighlight(shells.current, selectedId, tour !== 'closed');
  }, [selectedId, tour, model]);

  // During the tour, dragging inspects the spotlight part (spin it) rather than
  // orbiting the camera, so suppress camera-look for the whole tour.
  useEffect(() => {
    input.suppressLook = tour !== 'closed';
    return () => { input.suppressLook = false; };
  }, [tour]);

  // A freshly selected part starts unrotated and un-zoomed so each inspection is clean.
  useEffect(() => {
    zoom.current = 1;
    const shell = shells.current?.find((s) => s.userData.partId === selectedId);
    if (shell) shell.userData.userRot.identity();
  }, [selectedId]);

  // Drag to spin the spotlight part; wheel/pinch to zoom it in and out. Handled on
  // window so the gesture works anywhere (on the part or in empty space) and keeps
  // going if the pointer leaves the part.
  useEffect(() => {
    const curShell = () => {
      const i = marsStore.getState().roverPartIndex;
      const id = ROVER_PARTS[i]?.id;
      return shells.current?.find((s) => s.userData.partId === id) ?? null;
    };
    const down = (ev) => {
      if (marsStore.getState().roverTour === 'closed' || ev.button !== 0) return;
      const shell = curShell();
      if (!shell) return;
      grab.current = { startX: ev.clientX, startY: ev.clientY, startQuat: shell.userData.userRot.clone() };
    };
    const move = (ev) => {
      if (!grab.current) return;
      const shell = curShell();
      if (!shell) return;
      const dx = ev.clientX - grab.current.startX;
      const dy = ev.clientY - grab.current.startY;
      // World-space turntable: horizontal drag spins around up, vertical tilts
      // around the camera's right axis. Compose onto the spin captured at grab time.
      qDelta.setFromAxisAngle(WORLD_UP, -dx * ROT_SENS);
      qPitch.setFromAxisAngle(camRight, -dy * ROT_SENS);
      qDelta.multiply(qPitch);
      shell.userData.userRot.copy(qDelta.multiply(grab.current.startQuat));
    };
    const up = () => { grab.current = null; };
    const wheel = (ev) => {
      if (marsStore.getState().roverTour === 'closed') return;
      ev.preventDefault();
      zoom.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.current * (1 - ev.deltaY * 0.0012)));
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('wheel', wheel, { passive: false });
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('wheel', wheel);
    };
  }, []);

  useFrame((state, dt) => {
    const rb = body.current;
    if (!rb) return;
    const t = state.clock.elapsedTime;
    const active = tour !== 'closed';

    // Freeze the rover the instant the tour opens; capture the pose so the model
    // and the minimap agree on where it stopped.
    if (active && prevTour.current === 'closed') {
      frozen.current = roverPoseAt(t);
      if (!shells.current) shells.current = buildShells(model);
      applyHighlight(shells.current, selectedId, true);
    }
    prevTour.current = tour;

    // Ease the explode factor toward its target (frame-rate independent). Only the
    // 'open' phase spreads the parts out; 'closing' eases them back home, and once
    // they've essentially arrived we flip the tour to fully closed.
    const target = tour === 'open' ? 1 : 0;
    factor.current += (target - factor.current) * (1 - Math.exp(-dt * 3.4));
    if (tour === 'closing' && factor.current < 0.004) {
      factor.current = 0;
      marsStore.finishCloseTour();
    }

    // Pose: patrol when closed, hold the frozen pose during the tour.
    const pose = active && frozen.current ? frozen.current : roverPoseAt(t);
    telemetry.roverX = pose.x;
    telemetry.roverY = pose.y;
    telemetry.roverZ = pose.z;
    telemetry.roverHeading = pose.heading;
    rb.setNextKinematicTranslation({ x: pose.x, y: pose.y, z: pose.z });
    e.set(0, pose.heading + MODEL_YAW_OFFSET, 0);
    q.setFromEuler(e);
    rb.setNextKinematicRotation(q);

    // Lay the parts out in a camera-facing gallery: each part eases to its slot on
    // the arc (or the centre spotlight if selected). Recomputed against the live
    // camera basis each frame so the shelf stays spread across the screen as you
    // look around, and glides ("switch places") when the selection changes.
    if (shells.current && factor.current > 0.0005) {
      const f = factor.current;
      const n = ROVER_PARTS.length;
      const k = 1 - Math.exp(-dt * 6);
      const kq = 1 - Math.exp(-dt * 10);
      const m = camera.matrixWorld.elements;
      camera.getWorldPosition(camPos);
      camRight.set(m[0], m[1], m[2]);
      camUp.set(m[4], m[5], m[6]);
      camFwd.set(-m[8], -m[9], -m[10]);
      model.getWorldQuaternion(mQuat);
      mQuatInv.copy(mQuat).invert();
      for (const shell of shells.current) {
        const isSel = shell.userData.partId === selectedId;
        const slot = gallerySlot(shell.userData.orderIndex, n, isSel);
        // The spotlight part can be pulled closer/pushed away (inspection zoom).
        const depth = isSel ? slot.depth / zoom.current : slot.depth;

        // Ease the part's orientation: the selected part follows the player's
        // world-space spin (converted into the rover's local frame); others rest
        // unrotated so they reassemble cleanly.
        if (isSel) localQuat.copy(mQuatInv).multiply(shell.userData.userRot).multiply(mQuat);
        else localQuat.copy(idQuat);
        shell.quaternion.slerp(localQuat, kq);

        tmpV.copy(camPos)
          .addScaledVector(camFwd, depth)
          .addScaledVector(camRight, slot.x)
          .addScaledVector(camUp, slot.y);
        model.worldToLocal(tmpV);              // camera-space slot → model-local
        // Land the part's (possibly spun) centre on the slot.
        tmpCentroid.copy(shell.userData.centroid).applyQuaternion(shell.quaternion);
        tmpV.sub(tmpCentroid);
        tmpV.multiplyScalar(f);                // collapse toward assembled as it closes
        shell.position.lerp(tmpV, k);          // smooth glide (open + switch-places)
      }
    } else if (shells.current) {
      for (const shell of shells.current) { shell.position.set(0, 0, 0); shell.quaternion.identity(); }
    }
  });

  // Clicking a part selects it (lifts it to centre stage + shows its card).
  const onPointerDown = (event) => {
    if (marsStore.getState().roverTour === 'closed') return;
    let shell = null;
    for (let o = event.object; o; o = o.parent) { if (o.userData?.partId) { shell = o; break; } }
    if (!shell) return;
    event.stopPropagation();
    const i = ROVER_PARTS.findIndex((p) => p.id === shell.userData.partId);
    if (i >= 0 && i !== marsStore.getState().roverPartIndex) {
      shell.userData.userRot.identity(); // new selection starts unrotated
      zoom.current = 1;
      marsStore.setRoverPartIndex(i);
    }
    // suppressLook is already true for the whole tour; the window drag handler
    // will spin this part (grabbing starts on the same pointerdown).
  };

  const start = roverPoseAt(0);
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[start.x, start.y, start.z]}
      rotation={[0, start.heading + MODEL_YAW_OFFSET, 0]}
    >
      <primitive object={model} scale={MODEL_SCALE} onPointerDown={onPointerDown} />
      {/* Approximate body collider so Luna and thrown rocks respect the moving rover. */}
      <CuboidCollider args={[1.35, 1.1, 1.55]} position={[0, 1.1, 0]} />
    </RigidBody>
  );
}

useGLTF.preload(ASSET);
