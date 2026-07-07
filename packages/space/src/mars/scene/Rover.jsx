import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { telemetry } from '../telemetry.js';
import { useMarsState } from '../store/marsStore.js';
import { ROVER_PARTS } from './roverParts.js';
import { roverPoseAt } from './roverMotion.js';

// The real NASA Perseverance rover (public-domain glb fetched in T6) — the "find
// a real object on Mars" payoff. It moves as a slow kinematic body so it feels
// alive while doing rover work, but remains predictable and easy to find via the
// minimap. The GLB is grouped into kid-friendly named subsystems for the parts
// tour; selected subsystems glow softly in-scene.
const ASSET = '/mars/perseverance.glb';
const MODEL_SCALE = 0.6;
const MODEL_YAW_OFFSET = -Math.PI / 4;
const q = new THREE.Quaternion();
const e = new THREE.Euler(0, 0, 0, 'XYZ');

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

function isPartObject(object, names) {
  for (let o = object; o; o = o.parent) {
    if (names.has(o.name)) return true;
  }
  return false;
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
    opacity: material.opacity ?? 1,
    transparent: material.transparent ?? false,
  };
  material.userData.__marsOriginal = original;
  return original;
}

function setHighlighted(material, selected, tourOpen) {
  const original = captureOriginalMaterial(material);
  if (material.emissive) {
    material.emissive.copy(original.emissive ?? new THREE.Color(0x000000));
    material.emissiveIntensity = original.emissiveIntensity;
    if (selected && tourOpen) {
      material.emissive.set('#ffb35e');
      material.emissiveIntensity = 0.9;
    } else if (tourOpen) {
      material.emissiveIntensity = Math.min(material.emissiveIntensity, 0.08);
    }
  }
  material.opacity = original.opacity;
  material.transparent = original.transparent;
  material.needsUpdate = true;
}

export default function Rover() {
  const body = useRef();
  const { scene } = useGLTF(ASSET);
  const { roverTourOpen, roverPartIndex } = useMarsState();
  const model = useMemo(() => cloneRover(scene), [scene]);
  const selectedNames = useMemo(
    () => new Set(ROVER_PARTS[roverPartIndex]?.nodes ?? []),
    [roverPartIndex],
  );

  useEffect(() => {
    model.traverse((o) => {
      if (!o.isMesh) return;
      const selected = roverTourOpen && isPartObject(o, selectedNames);
      forEachMaterial(o, (m) => setHighlighted(m, selected, roverTourOpen));
    });
  }, [model, roverTourOpen, selectedNames]);

  useFrame((state) => {
    const pose = roverPoseAt(state.clock.elapsedTime);
    telemetry.roverX = pose.x;
    telemetry.roverY = pose.y;
    telemetry.roverZ = pose.z;
    telemetry.roverHeading = pose.heading;

    const rb = body.current;
    if (!rb) return;
    rb.setNextKinematicTranslation({ x: pose.x, y: pose.y, z: pose.z });
    e.set(0, pose.heading + MODEL_YAW_OFFSET, 0);
    q.setFromEuler(e);
    rb.setNextKinematicRotation(q);
  });

  const start = roverPoseAt(0);
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[start.x, start.y, start.z]}
      rotation={[0, start.heading + MODEL_YAW_OFFSET, 0]}
    >
      <primitive object={model} scale={MODEL_SCALE} />
      {/* Approximate body collider so Luna and thrown rocks respect the moving rover. */}
      <CuboidCollider args={[1.35, 1.1, 1.55]} position={[0, 1.1, 0]} />
    </RigidBody>
  );
}

useGLTF.preload(ASSET);
