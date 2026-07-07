import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { telemetry } from '../telemetry.js';

// Luna — the discovery-quest owl mascot, assembled from modular Meshy glb parts
// plus a real transparent glass helmet (three.js, since Meshy can't do glass):
//   • suit  — the wearable navy spacesuit (the visible body; opaque, hides what's
//     inside), fitted so feet sit at group origin y=0
//   • owl   — the base owl, scaled + raised so only her head emerges from the
//     suit's open neck ring (body tucked inside the opaque suit)
//   • dome  — a glass bubble + orange trim ring over her head
// Feet at y=0 so this drops into Player's third-person mount unchanged. The owl
// alone is reusable across the regular courses.
const OWL_URL = '/mars/meshy/luna-owl.glb';
const SUIT_URL = '/mars/meshy/luna-suit.glb';

// --- assembly tuning (this specific set of glbs) ---
// The owl's head is offset from its bbox centre (asymmetric body/tail), so we nudge
// the whole owl to seat the head in the neck ring and its body inside the suit.
const SUIT_HEIGHT = 1.35;   // suit feet→neck-rim height
const OWL_SCALE = 0.56;     // owl scale (just the head needs to read)
const OWL_POS = [0.30, 0.62, -0.14]; // x right / y up / z back — centre the head in
                                     // the collar; low enough that the chest tucks in
const HEAD = { x: 0.02, y: 1.28, z: 0.14, r: 0.37 };
const BODY_OFFSET = [0, 0, 0]; // whole-character offset (unused; kept for tuning)

// Fit the suit to a target height (feet at y=0), AND — because the Meshy suit is
// one static mesh with no skeleton — precompute the two boot vertex clusters so we
// can animate a walk cycle by displacing geometry directly. Returns the fitted
// object plus a `step(phase, factor)` that lifts each foot alternately (factor
// 0..1 fades the whole gait in/out). Legs = vertices in the bottom LEG_FRACTION of
// the mesh, split left/right by centre x; each weighted so the toe lifts most and
// the hip stays planted (no tearing at the waist).
const LEG_FRACTION = 0.34; // bottom third-ish of the body is "leg"

function useWalkingSuit(url, targetHeight) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const clone = scene.clone(true);
    let mesh = null;
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        o.geometry = o.geometry.clone(); // own the buffer so we can mutate verts
        mesh = o;
      }
    });
    // Fit (same as a plain fitted glb): scale to height, seat feet at 0, centre x/z.
    let box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    clone.scale.setScalar(targetHeight / (size.y || 1));
    box = new THREE.Box3().setFromObject(clone);
    const c = box.getCenter(new THREE.Vector3());
    clone.position.set(-c.x, -box.min.y, -c.z);

    // Build leg data in the mesh's own (unscaled) local space.
    let step = () => {};
    if (mesh) {
      const pos = mesh.geometry.attributes.position;
      const base = pos.array.slice(); // pristine copy to displace from
      mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      const minY = bb.min.y, hY = bb.max.y - bb.min.y;
      const legTop = minY + LEG_FRACTION * hY;
      const legSpan = legTop - minY || 1;
      const midX = (bb.min.x + bb.max.x) / 2;
      const legs = [];
      for (let i = 0; i < pos.count; i++) {
        const y = base[i * 3 + 1];
        if (y > legTop) continue;
        const side = base[i * 3] < midX ? 1 : -1; // +1 = one foot, -1 = the other
        const w = Math.min(1, Math.max(0, (legTop - y) / legSpan)); // 0 hip → 1 toe
        legs.push({ i, side, w });
      }
      const lift = 0.55 * legSpan;  // max foot lift (local units)
      const swing = 0.38 * legSpan; // forward/back reach as the foot lifts
      step = (phase, factor) => {
        const arr = pos.array;
        const s = Math.sin(phase);
        const liftA = Math.max(0, s) * lift * factor;   // one foot up on +sin
        const liftB = Math.max(0, -s) * lift * factor;  // other up on −sin
        const swA = s * swing * factor;
        const swB = -s * swing * factor;
        for (let k = 0; k < legs.length; k++) {
          const { i, side, w } = legs[k];
          const bi = i * 3;
          const up = side > 0 ? liftA : liftB;
          const fw = side > 0 ? swA : swB;
          arr[bi + 1] = base[bi + 1] + up * w;
          arr[bi + 2] = base[bi + 2] + fw * w;
        }
        pos.needsUpdate = true;
      };
    }
    return { object: clone, step };
  }, [scene, targetHeight]);
}

// Load the owl at native scale, centred x/z with feet at 0, then the caller scales
// + raises it. (Fitting to a fixed height would defeat the manual owl scale.)
function useOwl() {
  const { scene } = useGLTF(OWL_URL);
  return useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const s = 1.5 / (size.y || 1); // normalise to ~1.5 then OWL_SCALE tunes it
    clone.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(clone);
    const c = box2.getCenter(new THREE.Vector3());
    clone.position.set(-c.x, -box2.min.y, -c.z);
    return clone;
  }, [scene]);
}

export default function Luna(props) {
  const { object: suit, step } = useWalkingSuit(SUIT_URL, SUIT_HEIGHT);
  const owl = useOwl();

  // Procedural life: the Meshy glbs are static (no skeleton), so we animate it all
  // from the shared telemetry the Player writes each frame — actual alternating leg
  // steps (boot-vertex displacement, see useWalkingSuit) plus a penguin waddle
  // (body roll + lean + small bob) and an idle breathing bob at rest.
  const anim = useRef();
  const t = useRef(0);
  const stride = useRef(0);
  const legF = useRef(0);   // eased 0..1 gait strength (fades legs in/out)
  const lastF = useRef(0);
  useFrame((_, dt) => {
    const g = anim.current;
    if (!g) return;
    t.current += dt;
    const sp = Math.min(telemetry.speed / 5, 1); // 0..1 of full walk speed
    const walking = telemetry.stepping;          // coyote-smoothed (see telemetry.js)
    // Frame-rate independent gait smoothing. The old fixed-per-frame easing made
    // the suit pop/stick at low FPS and over-animate at high FPS.
    legF.current += ((walking ? sp : 0) - legF.current) * (1 - Math.exp(-dt * 10));
    if (walking) stride.current += dt * (5.4 + sp * 3.6);
    const s = Math.sin(stride.current);
    const gait = legF.current;
    const idleBob = Math.sin(t.current * 1.8) * 0.012 * (1 - gait);
    const walkBob = Math.abs(s) * 0.018 * gait; // keep feet visually closer to ground
    g.position.y = idleBob + walkBob;
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, s * 0.075 * gait, 14, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.075 * gait, 14, dt);
    // Only touch geometry while the gait (or its tail) is non-zero — idle frames
    // skip the vertex work entirely, but the final tail still returns boots home.
    if (legF.current > 0.002 || lastF.current > 0.002) step(stride.current, legF.current);
    lastF.current = legF.current;
  });

  return (
    <group {...props}>
      {/* whole-character offset (viewer's right = Luna's left) */}
      <group ref={anim} position={BODY_OFFSET}>
        <pointLight position={[0.4, 1.5, 1.4]} intensity={6} distance={5} color="#fff2e0" />
        {/* owl first (behind), so the opaque suit covers her body */}
        <group position={OWL_POS} scale={OWL_SCALE}>
          <primitive object={owl} />
        </group>
        <primitive object={suit} />
        {/* glass helmet dome (the suit already provides the orange collar ring) */}
        <mesh position={[HEAD.x, HEAD.y, HEAD.z]}>
          <sphereGeometry args={[HEAD.r, 32, 32]} />
          <meshPhysicalMaterial
            transparent opacity={0.15} roughness={0.05} metalness={0}
            clearcoat={1} clearcoatRoughness={0.06} color="#d3efff"
            side={THREE.DoubleSide} depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload(OWL_URL);
useGLTF.preload(SUIT_URL);
