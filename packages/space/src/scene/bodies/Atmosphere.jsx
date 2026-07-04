// Fresnel rim glow — a back-side shell whose brightness peaks at the limb, so
// planets read as lit spheres wrapped in air instead of textured balls.
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export default function Atmosphere({ radius = 1, color = '#6ab7ff', opacity = 0.55, scale = 1.18, power = 3.2 }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      opacity: { value: opacity },
      power: { value: power },
    },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal; varying vec3 vView;
      uniform vec3 glowColor; uniform float opacity; uniform float power;
      void main() {
        float rim = pow(clamp(dot(vNormal, vView) + 1.0, 0.0, 1.0), power);
        gl_FragColor = vec4(glowColor, rim * opacity);
      }
    `,
  }), []);

  useEffect(() => {
    material.uniforms.glowColor.value.set(color);
    material.uniforms.opacity.value = opacity;
    material.uniforms.power.value = power;
  }, [material, color, opacity, power]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} scale={scale}>
      <sphereGeometry args={[radius, 48, 48]} />
    </mesh>
  );
}
