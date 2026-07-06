// The Sun: textured photosphere (unlit — it IS the light), fresnel corona
// shells, a procedural radial-gradient halo sprite (reads as glow without a
// bloom pass, so it's cheap on phones), and the scene's point light.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { displayRadius, spinRadPerSec } from './physics.js';
import { useBodyTexture } from './textures.js';
import Atmosphere from './Atmosphere.jsx';

function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255, 236, 170, 0.85)');
  g.addColorStop(0.25, 'rgba(255, 190, 92, 0.38)');
  g.addColorStop(0.6, 'rgba(255, 140, 40, 0.10)');
  g.addColorStop(1, 'rgba(255, 120, 20, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Sun({ radius, position = [0, 0, 0], timeScale = 4000, lightIntensity = 2200, halo = true }) {
  const r = radius ?? displayRadius('sun', 0.01); // gentler scale or it eats the scene
  const map = useBodyTexture('sun.jpg');
  const spinRef = useRef();
  const rate = spinRadPerSec('sun', timeScale);
  useFrame((_, dt) => { if (spinRef.current) spinRef.current.rotation.y += rate * dt; });
  const haloMap = useMemo(haloTexture, []);

  return (
    <group position={position}>
      <mesh ref={spinRef}>
        <sphereGeometry args={[r, 64, 64]} />
        <meshBasicMaterial map={map} color="#ffe9b0" />
      </mesh>
      <Atmosphere radius={r} color="#ffb347" opacity={0.9} scale={1.25} power={2.6} />
      {halo && (
        <sprite scale={[r * 7, r * 7, 1]}>
          <spriteMaterial map={haloMap} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
      <pointLight intensity={lightIntensity} distance={0} decay={2} color="#fff4de" castShadow />
    </group>
  );
}
