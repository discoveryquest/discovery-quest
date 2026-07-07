import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

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
const OWL_POS = [0.24, 0.62, -0.12]; // x right / y up / z back — low enough that the
                                     // owl's chest tucks inside the suit collar
const HEAD = { x: -0.05, y: 1.28, z: 0.15, r: 0.37 };

// Fit a glb to a target height and seat its feet at y=0 (centred x/z).
function useFitted(url, targetHeight) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    let box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    clone.scale.setScalar(targetHeight / (size.y || 1));
    box = new THREE.Box3().setFromObject(clone);
    const c = box.getCenter(new THREE.Vector3());
    clone.position.set(-c.x, -box.min.y, -c.z);
    return clone;
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
  const suit = useFitted(SUIT_URL, SUIT_HEIGHT);
  const owl = useOwl();

  return (
    <group {...props}>
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
  );
}

useGLTF.preload(OWL_URL);
useGLTF.preload(SUIT_URL);
