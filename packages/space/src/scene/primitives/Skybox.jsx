import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Named gradient backdrops per sector (spec §3 scene settings). Unknown preset
// degrades gracefully to dawn-gradient.
const PRESETS = {
  'dawn-gradient': { top: '#0b1026', bottom: '#3a2a4d' },
  'deep-indigo': { top: '#05060f', bottom: '#141a3a' },
  'orbit-teal': { top: '#03121a', bottom: '#0a2230' },
};

export default function Skybox({ preset = 'dawn-gradient', radius = 400 }) {
  if (!PRESETS[preset]) console.warn(`[Skybox] unknown preset "${preset}", using dawn-gradient`);
  const colors = PRESETS[preset] ?? PRESETS['dawn-gradient'];

  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(colors.top) },
      bottom: { value: new THREE.Color(colors.bottom) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 top; uniform vec3 bottom;
      void main() {
        float h = normalize(vPos).y * 0.5 + 0.5;
        gl_FragColor = vec4(mix(bottom, top, h), 1.0);
      }
    `,
  }), [colors.top, colors.bottom]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} scale={radius} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}
