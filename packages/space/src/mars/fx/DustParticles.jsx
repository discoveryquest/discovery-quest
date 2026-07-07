import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { windState } from './windState.js';
import { telemetry } from '../telemetry.js';
import { prefersReducedMotion } from '../ui/reducedMotion.js';

// Soft round mote sprite (radial alpha falloff) so points read as blown dust
// rather than hard bright squares. Built once on a canvas.
function makeDustSprite() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// Wind-blown regolith haze: a Points cloud that drifts along the wind direction
// at a speed that swells with gusts, and thickens (opacity up) on the same gust —
// so the air visibly "picks up" in time with the pennant snapping. Particles
// recycle within a box that follows the player (telemetry) so the haze is always
// around the camera without needing a huge cloud. Purely atmospheric, no physics.
// (Reduced-motion honoring is wired centrally in Task 21.)
export default function DustParticles({ count = 420, area = 64 }) {
  const geomRef = useRef();
  const matRef = useRef();
  // Reduced motion: keep a thin static haze for depth, but stop the drift.
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const realCount = reduced ? Math.round(count * 0.35) : count;
  const sprite = useMemo(makeDustSprite, []);

  const positions = useMemo(() => {
    const arr = new Float32Array(realCount * 3);
    for (let i = 0; i < realCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * area;
      arr[i * 3 + 1] = 0.2 + Math.random() * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * area;
    }
    return arr;
  }, [realCount, area]);

  useFrame((_, dt) => {
    if (reduced) return; // static haze — no drift
    const geo = geomRef.current;
    if (!geo) return;
    const arr = geo.attributes.position.array;
    const cx = telemetry.x;
    const cz = telemetry.z;
    const half = area / 2;
    const vx = windState.dirX * windState.speed * dt;
    const vz = windState.dirZ * windState.speed * dt;
    for (let i = 0; i < realCount; i++) {
      let x = arr[i * 3] + vx;
      let z = arr[i * 3 + 2] + vz;
      // wrap each particle into the box centered on the player
      if (x - cx > half) x -= area;
      else if (x - cx < -half) x += area;
      if (z - cz > half) z -= area;
      else if (z - cz < -half) z += area;
      arr[i * 3] = x;
      arr[i * 3 + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
    if (matRef.current) matRef.current.opacity = 0.06 + windState.gust * 0.22;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        map={sprite}
        alphaMap={sprite}
        color="#c99a68"
        size={0.16}
        sizeAttenuation
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </points>
  );
}
