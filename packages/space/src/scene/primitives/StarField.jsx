import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Thousands of background stars as a SINGLE THREE.Points → one draw call (spec §7.2).
const DEPTHS = { near: 60, mid: 140, far: 280 };

export default function StarField({ count = 4000, depth = 'far', size = 0.7, color = '#ffffff' }) {
  const geometry = useMemo(() => {
    const radius = DEPTHS[depth] ?? DEPTHS.far;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // uniform points in a spherical shell so the field surrounds the camera
      const r = radius * (0.6 + 0.4 * Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count, depth]);

  // Dispose the GPU buffer when the field changes / unmounts (spec §7.2).
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={size} color={color} sizeAttenuation depthWrite={false} transparent opacity={0.9} />
    </points>
  );
}
