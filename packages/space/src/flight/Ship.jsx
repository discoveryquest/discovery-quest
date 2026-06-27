import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _fwd = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

// The ship rides just ahead of and below the camera, so guided travel reads as
// "piloting" without the child controlling 6-DoF (spec §5.1). The CameraRig
// flies the camera; the ship simply follows in front of it.
export default function Ship() {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const cam = state.camera;
    cam.getWorldDirection(_fwd);
    _pos.copy(cam.position).addScaledVector(_fwd, 6);
    _pos.y -= 1.2;
    ref.current.position.lerp(_pos, 0.2);
    _look.copy(ref.current.position).addScaledVector(_fwd, 4);
    ref.current.lookAt(_look);
  });

  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 1.6, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.1, -0.6]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}
