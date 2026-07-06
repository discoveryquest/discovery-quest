// Textured planet with real physics: sidereal spin rate (retrograde for Venus
// and Uranus via signed rotation hours), true axial tilt, per-body atmosphere
// rim, Saturn/Uranus rings, Earth's drifting cloud deck and night-side city
// lights (emissive is masked by sun direction in a lights-fragment patch, so
// cities only glow in the dark).
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BODIES, tiltRad, spinRadPerSec, displayRadius } from './physics.js';
import { SURFACE_MAP, useBodyTexture } from './textures.js';
import Atmosphere from './Atmosphere.jsx';
import Rings from './Rings.jsx';

function EarthExtras({ radius, timeScale }) {
  const night = useBodyTexture('earth_night.jpg');
  const clouds = useBodyTexture('earth_clouds.jpg', { srgb: false });
  const cloudsRef = useRef();
  // clouds drift ~1.25× the ground rate, like the real jet streams
  const drift = spinRadPerSec('earth', timeScale) * 0.25;
  useFrame((_, dt) => { if (cloudsRef.current) cloudsRef.current.rotation.y += drift * dt; });
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius * 1.001, 64, 64]} />
        <meshBasicMaterial map={night} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.015, 64, 64]} />
        <meshStandardMaterial map={clouds} alphaMap={clouds} transparent depthWrite={false} roughness={1} />
      </mesh>
    </>
  );
}

function VenusVeil({ radius, timeScale }) {
  const veil = useBodyTexture('venus_atmosphere.jpg');
  const ref = useRef();
  // Venus's clouds super-rotate: around the planet in ~4 days vs a 243-day spin
  const rate = spinRadPerSec('venus', timeScale) * 60;
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += rate * dt; });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius * 1.02, 64, 64]} />
      <meshStandardMaterial map={veil} transparent opacity={0.82} depthWrite={false} roughness={1} />
    </mesh>
  );
}

// Masks Earth's emissive city lights to the night side. Standard materials add
// emissive everywhere; this patch scales it by how far the fragment faces away
// from the sun (position passed as a uniform — keep it matching the scene's light).
function nightSidePatch(material, sunPosition) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSunPos = { value: sunPosition };
    material.userData.uSunPos = shader.uniforms.uSunPos;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;\nvWorldNormal = normalize(mat3(modelMatrix) * normal);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;\nuniform vec3 uSunPos;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        vec3 sunDir = normalize(uSunPos - vWorldPos);
        float nightSide = smoothstep(0.12, -0.22, dot(normalize(vWorldNormal), sunDir));
        totalEmissiveRadiance *= nightSide;`
      );
  };
}

export default function Planet({
  body = 'earth',
  radius, // display units; defaults to the physics scale
  position = [0, 0, 0],
  timeScale = 4000,
  atmosphere = true,
  detail = true, // clouds / veils / rings
  segments = 64,
  nightLights = false,
  sunPosition = [0, 0, 0], // where the scene's sun/light is, for the night-lights mask
  children,
}) {
  const data = BODIES[body];
  if (!data) console.warn(`[Planet] unknown body "${body}"`);
  const r = radius ?? displayRadius(body);
  const map = useBodyTexture(SURFACE_MAP[body] ?? SURFACE_MAP.earth);
  const night = useBodyTexture('earth_night.jpg'); // cheap; cached by loader
  const spinRef = useRef();
  const rate = spinRadPerSec(body, timeScale);
  useFrame((_, dt) => { if (spinRef.current) spinRef.current.rotation.y += rate * dt; });

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
    if (body === 'earth' && nightLights) {
      m.emissive = new THREE.Color('#ffd9a0');
      m.emissiveIntensity = 1.6;
      nightSidePatch(m, new THREE.Vector3(...sunPosition));
    }
    return m;
  }, [body, nightLights]);
  if (material.userData.uSunPos) material.userData.uSunPos.value.set(...sunPosition);
  material.map = map;
  if (body === 'earth' && nightLights) material.emissiveMap = night;

  return (
    <group position={position}>
      {/* axial tilt — Uranus (97.8°) visibly rolls on its side */}
      <group rotation-z={tiltRad(body)}>
        <group ref={spinRef}>
          <mesh material={material} castShadow receiveShadow>
            <sphereGeometry args={[r, segments, segments]} />
          </mesh>
          {detail && body === 'earth' && <EarthExtras radius={r} timeScale={timeScale} />}
          {detail && body === 'venus' && <VenusVeil radius={r} timeScale={timeScale} />}
        </group>
        {detail && data?.ring && (
          <Rings
            inner={r * (data.ring.innerKm / data.radiusKm)}
            outer={r * (data.ring.outerKm / data.radiusKm)}
            faint={data.ring.faint}
          />
        )}
        {atmosphere && data?.atmoColor && (
          <Atmosphere radius={r} color={data.atmoColor} opacity={data.atmoOpacity ?? 0.55} />
        )}
      </group>
      {children}
    </group>
  );
}
