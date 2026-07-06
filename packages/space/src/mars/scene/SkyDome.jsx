import { useMemo } from 'react';
import * as THREE from 'three';

// Procedural Martian sky: a big inward sphere with a vertical gradient from the
// butterscotch zenith down to a paler dusty horizon (colors from marsConfig.sky).
// A real photographic panorama (NASA Mastcam-Z) is foreground/rover-deck heavy
// and doesn't wrap as a clean skybox, so we use the *color* — the actual Mars
// realism cue — and blend the terrain into it with scene fog set to `horizon`.
// (A future pass could add real distant hills as a horizon cylinder band.)
export default function SkyDome({ top = '#b5651d', horizon = '#e9c39a' }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(top) },
          uHorizon: { value: new THREE.Color(horizon) },
        },
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vPos;
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          void main() {
            float h = normalize(vPos).y * 0.5 + 0.5;      // 0 at nadir, 1 at zenith
            vec3 c = mix(uHorizon, uTop, smoothstep(0.02, 0.55, h));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [top, horizon],
  );
  return (
    <mesh>
      <sphereGeometry args={[500, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
