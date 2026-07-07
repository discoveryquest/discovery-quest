import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { telemetry } from '../telemetry.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { ROVER_PARTS, CHASSIS_ID } from './roverParts.js';
import { roverPoseAt } from './roverMotion.js';
import { partIdForObject, centroidAngle, fanDir, partOffset } from './explode.js';
import { roverTour } from './roverTourState.js';

// The real NASA Perseverance rover (public-domain glb fetched in T6) — the "find
// a real object on Mars" payoff. It slowly patrols so it feels alive, then, when
// the player presses E nearby, it becomes the star of an exploded-view tour: the
// rover freezes, its subsystems fly apart into a floating diagram, the camera
// flies in, and each floating part can be clicked to read about it. Closing the
// tour eases the parts home and hands control back (see marsStore roverTour).
const ASSET = '/mars/perseverance.glb';
const MODEL_SCALE = 0.6;
const MODEL_YAW_OFFSET = -Math.PI / 4;
// How high (world metres) above the rover the exploded diagram's orbit center sits.
const TOUR_CENTER_LIFT = 1.35;
const q = new THREE.Quaternion();
const e = new THREE.Euler(0, 0, 0, 'XYZ');
const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();

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

function captureOriginalMaterial(material) {
  if (material.userData.__marsOriginal) return material.userData.__marsOriginal;
  const original = {
    emissive: material.emissive?.clone?.() ?? null,
    emissiveIntensity: material.emissiveIntensity ?? 0,
  };
  material.userData.__marsOriginal = original;
  return original;
}

function setEmissive(material, selected, tourActive) {
  if (!material.emissive) return;
  const original = captureOriginalMaterial(material);
  material.emissive.copy(original.emissive ?? new THREE.Color(0x000000));
  material.emissiveIntensity = original.emissiveIntensity;
  if (selected) {
    material.emissive.set('#ffb35e');
    material.emissiveIntensity = 1.3;
  } else if (tourActive) {
    // Softly knock back the unselected parts so the picked one pops.
    material.emissiveIntensity = Math.min(material.emissiveIntensity, 0.05);
  }
  material.needsUpdate = true;
}

// Reparent every mesh into a flat per-part "shell" group so nested subsystems
// (the arm's turret instruments) can fly apart independently and each part is a
// single pickable subtree. attach() preserves world transforms, so at rest
// (shell.position = 0) the rover looks byte-identical to the un-exploded model.
function buildShells(model) {
  model.updateWorldMatrix(true, true);
  const leaves = [];
  model.traverse((o) => { if (o.isMesh) leaves.push(o); });

  const localOf = new Map();
  const center = new THREE.Vector3();
  const groups = new Map(); // partId -> { leaves, sum, count }
  for (const leaf of leaves) {
    const local = model.worldToLocal(leaf.getWorldPosition(new THREE.Vector3()));
    localOf.set(leaf, local);
    center.add(local);
    const id = partIdForObject(leaf) ?? CHASSIS_ID;
    if (!groups.has(id)) groups.set(id, { leaves: [], sum: new THREE.Vector3(), count: 0 });
    const g = groups.get(id);
    g.leaves.push(leaf);
    g.sum.add(local);
    g.count += 1;
  }
  center.multiplyScalar(1 / Math.max(1, leaves.length));

  // Order parts by the side of the rover they actually sit on, then fan them out
  // evenly around a ring so the exploded diagram reads cleanly (no clumping) while
  // each piece still drifts toward roughly where it belongs.
  const ordered = [...groups.entries()]
    .map(([id, g]) => ({ id, g, angle: centroidAngle(g.sum.multiplyScalar(1 / g.count), center) }))
    .sort((a, b) => a.angle - b.angle);

  const shells = [];
  ordered.forEach(({ id, g }, i) => {
    const shell = new THREE.Group();
    shell.name = `shell:${id}`;
    shell.userData.partId = id;
    shell.userData.dir = fanDir(i, ordered.length);
    shell.userData.bobPhase = i * 1.7;
    model.add(shell);
    for (const leaf of g.leaves) shell.attach(leaf); // keeps world transform
    shells.push(shell);
  });
  return shells;
}

function applyHighlight(shells, selectedId, tourActive) {
  for (const shell of shells) {
    const selected = tourActive && shell.userData.partId === selectedId;
    shell.traverse((o) => {
      if (o.isMesh) forEachMaterial(o, (m) => setEmissive(m, selected, tourActive));
    });
  }
}

export default function Rover() {
  const body = useRef();
  const { scene } = useGLTF(ASSET);
  const { roverTour: tour, roverPartIndex } = useMarsState();
  const model = useMemo(() => cloneRover(scene), [scene]);

  const shells = useRef(null);
  const factor = useRef(0);        // 0 assembled → 1 fully exploded
  const frozen = useRef(null);     // pose captured when the tour opened
  const prevTour = useRef('closed');

  const selectedId = ROVER_PARTS[roverPartIndex]?.id ?? null;

  // Re-apply the glow whenever the selection or tour state changes.
  useEffect(() => {
    if (shells.current) applyHighlight(shells.current, selectedId, tour !== 'closed');
  }, [selectedId, tour, model]);

  useFrame((state, dt) => {
    const rb = body.current;
    if (!rb) return;
    const t = state.clock.elapsedTime;
    const active = tour !== 'closed';

    // Freeze the rover the instant the tour opens; capture the pose so the model,
    // the orbit center, and the minimap all agree on where it stopped.
    if (active && prevTour.current === 'closed') {
      frozen.current = roverPoseAt(t);
      if (!shells.current) shells.current = buildShells(model);
      applyHighlight(shells.current, selectedId, true);
    }
    prevTour.current = tour;

    // Ease the explode factor toward its target (frame-rate independent). Only the
    // 'open' phase pulls the parts apart; 'closing' still counts as active (rover
    // frozen, camera framing the parts) but eases them back home to reassemble.
    const target = tour === 'open' ? 1 : 0;
    factor.current += (target - factor.current) * (1 - Math.exp(-dt * 3.4));
    if (tour === 'closing' && factor.current < 0.004) {
      factor.current = 0;
      marsStore.finishCloseTour();
    }
    roverTour.factor = factor.current;

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

    // Drive the exploded offsets. Only touch transforms while there is something to
    // animate (factor > 0), so a normal patrol pays nothing.
    if (shells.current && factor.current > 0.0005) {
      for (const shell of shells.current) {
        const off = partOffset(shell.userData.dir, factor.current, t, shell.userData.bobPhase);
        shell.position.set(off.x, off.y, off.z);
      }
    } else if (shells.current) {
      for (const shell of shells.current) shell.position.set(0, 0, 0);
    }

    // Publish the orbit center + focus for Player's tour camera. Center = the rover
    // body lifted; focus nudges toward the selected floating part so a click frames
    // it without losing the whole diagram.
    if (active) {
      roverTour.centerX = pose.x;
      roverTour.centerY = pose.y + TOUR_CENTER_LIFT;
      roverTour.centerZ = pose.z;
      let fx = roverTour.centerX, fy = roverTour.centerY, fz = roverTour.centerZ;
      if (selectedId && shells.current) {
        const shell = shells.current.find((s) => s.userData.partId === selectedId);
        if (shell) {
          shell.getWorldPosition(tmpV);
          tmpV2.set(roverTour.centerX, roverTour.centerY, roverTour.centerZ);
          tmpV2.lerp(tmpV, 0.6); // frame the part but keep the body in shot
          fx = tmpV2.x; fy = tmpV2.y; fz = tmpV2.z;
        }
      }
      // Ease the focus so switching parts glides instead of snapping.
      const k = 1 - Math.exp(-dt * 6);
      roverTour.focusX += (fx - roverTour.focusX) * k;
      roverTour.focusY += (fy - roverTour.focusY) * k;
      roverTour.focusZ += (fz - roverTour.focusZ) * k;
    }
  });

  const onPick = (event) => {
    if (marsStore.getState().roverTour === 'closed') return;
    event.stopPropagation();
    for (let o = event.object; o; o = o.parent) {
      if (o.userData?.partId) {
        const i = ROVER_PARTS.findIndex((p) => p.id === o.userData.partId);
        if (i >= 0) marsStore.setRoverPartIndex(i);
        return;
      }
    }
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
      <primitive object={model} scale={MODEL_SCALE} onClick={onPick} />
      {/* Approximate body collider so Luna and thrown rocks respect the moving rover. */}
      <CuboidCollider args={[1.35, 1.1, 1.55]} position={[0, 1.1, 0]} />
    </RigidBody>
  );
}

useGLTF.preload(ASSET);
