import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { input } from '../input/inputStore.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { telemetry } from '../telemetry.js';
import { pickNearestInRange } from './selection.js';

// Start with one rock selectable from spawn: cold visitors should discover the
// throw mechanic immediately, not after wandering over low-contrast terrain.
const PICKUP_DIST = 3.2;
const THROW_SPEED = 8.2;      // m/s-ish release velocity, intentionally unscaled by gravity
const THROW_UP_BIAS = 0.22;   // slight lift so the Mars arc reads immediately
const HOLD_DIST = 1.15;
const HOLD_DOWN = 0.22;
const RECALL_DIST = 46;
const RECALL_SECS = 4.0;

const zero = { x: 0, y: 0, z: 0 };

function vToObj(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function lunaFacingInto(target) {
  target.set(telemetry.facingX || 0, 0, telemetry.facingZ || -1);
  if (target.lengthSq() < 0.001) target.set(0, 0, -1);
  return target.normalize();
}

export default function InteractionController({
  rocks,
  rockRefs,
  heldId,
  setHeldId,
  selectedId,
  setSelectedId,
  respawnRock,
}) {
  const { camera } = useThree();
  const { rockResetSeq } = useMarsState();
  const lastInput = useRef({ actionTap: 0, primaryPress: 0, primaryRelease: 0 });
  const lastHud = useRef({ selectedId: null, heldId: null, prompt: '' });
  const outSince = useRef(new Map());
  const pendingThrow = useRef(null);
  const [releaseTick, setReleaseTick] = useState(0);
  const scratch = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      hold: new THREE.Vector3(),
      throwDir: new THREE.Vector3(),
    }),
    [],
  );

  const safeRespawn = (id, offset = 0) => {
    camera.getWorldDirection(scratch.forward);
    scratch.forward.y = 0;
    if (scratch.forward.lengthSq() < 0.01) scratch.forward.set(0, 0, -1);
    scratch.forward.normalize();
    const side = new THREE.Vector3(-scratch.forward.z, 0, scratch.forward.x);
    const x = telemetry.x + scratch.forward.x * (1.7 + offset * 0.25) + side.x * offset * 0.45;
    const z = telemetry.z + scratch.forward.z * (1.7 + offset * 0.25) + side.z * offset * 0.45;
    respawnRock(id, { x, y: telemetry.y + 1.0, z });
    outSince.current.delete(id);
  };

  useEffect(() => {
    if (rockResetSeq === 0) return;
    rocks.forEach((rock, i) => safeRespawn(rock.id, i - (rocks.length - 1) / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rockResetSeq]);

  useEffect(() => {
    if (!pendingThrow.current) return;
    const { id, linvel, impulse, torque } = pendingThrow.current;
    pendingThrow.current = null;
    const rb = rockRefs.current.get(id);
    if (!rb) return;
    rb.setGravityScale?.(1, true);
    rb.setLinvel(linvel, true);
    rb.setAngvel(zero, true);
    rb.applyImpulse(impulse, true);
    rb.applyTorqueImpulse?.(torque, true);
  }, [releaseTick, rockRefs]);

  useFrame((_, dt) => {
    // While the rover exploded-view tour owns the input (clicks pick parts, not
    // rocks), swallow the action edges so releasing a click here can't grab/throw
    // a rock, and skip all rock proximity work.
    if (marsStore.getState().roverTour !== 'closed') {
      lastInput.current = {
        actionTap: input.actionTap,
        primaryPress: input.primaryPress,
        primaryRelease: input.primaryRelease,
      };
      return;
    }
    const player = { x: telemetry.x, y: telemetry.y, z: telemetry.z };
    const positions = rocks.map((rock) => {
      if (rock.id === heldId) return { id: rock.id, pos: null };
      const rb = rockRefs.current.get(rock.id);
      if (!rb) return { id: rock.id, pos: null };
      const p = rb.translation();
      return { id: rock.id, pos: { x: p.x, y: p.y, z: p.z } };
    });

    const nextSelected = heldId ? null : pickNearestInRange(player, positions, PICKUP_DIST);
    if (nextSelected !== selectedId) setSelectedId(nextSelected);

    camera.getWorldDirection(scratch.forward);

    if (heldId) {
      const rb = rockRefs.current.get(heldId);
      if (rb) {
        if (marsStore.getState().view === 'third') {
          // Third-person interactions are body-space, not camera-space. Luna can
          // orbit the camera independently; rocks should sit near her hand and
          // release toward the direction her suit is actually facing.
          lunaFacingInto(scratch.forward);
          scratch.right.set(-scratch.forward.z, 0, scratch.forward.x);
          scratch.hold
            .set(telemetry.x, telemetry.y + 0.08, telemetry.z)
            .addScaledVector(scratch.forward, 0.62)
            .addScaledVector(scratch.right, 0.42);
        } else {
          scratch.hold
            .copy(camera.position)
            .addScaledVector(scratch.forward, HOLD_DIST)
            .add({ x: 0, y: -HOLD_DOWN, z: 0 });
        }
        const hold = vToObj(scratch.hold);
        rb.setLinvel(zero, true);
        rb.setAngvel(zero, true);
        rb.setTranslation(hold, true);
        rb.setNextKinematicTranslation?.(hold);
      }
    }

    const actionEdge = input.actionTap !== lastInput.current.actionTap;
    const pressEdge = input.primaryPress !== lastInput.current.primaryPress;
    const releaseEdge = input.primaryRelease !== lastInput.current.primaryRelease;
    lastInput.current = {
      actionTap: input.actionTap,
      primaryPress: input.primaryPress,
      primaryRelease: input.primaryRelease,
    };

    if (!heldId && nextSelected && (actionEdge || pressEdge)) {
      const rb = rockRefs.current.get(nextSelected);
      if (rb) {
        rb.setGravityScale?.(0, true);
        rb.setLinvel(zero, true);
        rb.setAngvel(zero, true);
        setHeldId(nextSelected);
      }
    } else if (heldId && (actionEdge || releaseEdge)) {
      scratch.throwDir.copy(scratch.forward);
      scratch.throwDir.y += THROW_UP_BIAS;
      scratch.throwDir.normalize();
      pendingThrow.current = {
        id: heldId,
        linvel: {
          x: scratch.throwDir.x * THROW_SPEED,
          y: scratch.throwDir.y * THROW_SPEED,
          z: scratch.throwDir.z * THROW_SPEED,
        },
        impulse: {
          x: scratch.throwDir.x * 1.6,
          y: scratch.throwDir.y * 1.6,
          z: scratch.throwDir.z * 1.6,
        },
        torque: {
          x: -scratch.throwDir.z * 0.7,
          y: 0.35,
          z: scratch.throwDir.x * 0.7,
        },
      };
      setHeldId(null);
      setReleaseTick((x) => x + 1);
    }

    // Non-destructive safe recall: if a rock is far from the player / below the
    // world long enough, put it in front of Luna, never at her feet.
    for (const rock of rocks) {
      if (rock.id === heldId) { outSince.current.delete(rock.id); continue; }
      const rb = rockRefs.current.get(rock.id);
      if (!rb) continue;
      const p = rb.translation();
      const far = Math.hypot(p.x - telemetry.x, p.z - telemetry.z) > RECALL_DIST || p.y < -8;
      if (!far) { outSince.current.delete(rock.id); continue; }
      const prev = outSince.current.get(rock.id) ?? RECALL_SECS;
      const next = prev - dt;
      if (next <= 0) safeRespawn(rock.id);
      else outSince.current.set(rock.id, next);
    }

    const prompt = heldId
      ? 'Release click or press E to throw'
      : nextSelected
        ? 'Click or press E to pick up rock'
        : '';
    if (
      lastHud.current.selectedId !== nextSelected
      || lastHud.current.heldId !== heldId
      || lastHud.current.prompt !== prompt
    ) {
      lastHud.current = { selectedId: nextSelected, heldId, prompt };
      marsStore.setInteraction({ selectedId: nextSelected, heldId, prompt });
    }
  });

  return null;
}
