import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Revolves its children around `center` at radius `r`, one lap per `period`
// seconds. Used so a Moon orbits an Earth purely from scene data (spec §B.1).
export default function Orbit({ center = [0, 0, 0], r = 4, period = 30, phase = 0, paused = false, children }) {
  const pivot = useRef();
  useFrame((_, dt) => {
    if (pivot.current && !paused && period > 0) {
      pivot.current.rotation.y += ((2 * Math.PI) / period) * dt;
    }
  });
  return (
    <group position={center}>
      <group ref={pivot} rotation={[0, phase, 0]}>
        <group position={[r, 0, 0]}>{children}</group>
      </group>
    </group>
  );
}
