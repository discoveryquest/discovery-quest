import { useEffect, useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Tileable value noise used both for broad terrain displacement and the generated
// regolith texture. Keeping it deterministic means rocks/props can ask for the
// same terrainHeight() without needing to sample GPU state.
function hash2(ix, iy, seed = 0) {
  let n = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function valueNoiseTiled(u, v, cells, seed = 0) {
  const x = u * cells;
  const y = v * cells;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const x1 = (x0 + 1) % cells;
  const y1 = (y0 + 1) % cells;
  const wx0 = ((x0 % cells) + cells) % cells;
  const wy0 = ((y0 % cells) + cells) % cells;
  const a = hash2(wx0, wy0, seed);
  const b = hash2(x1, wy0, seed);
  const c = hash2(wx0, y1, seed);
  const d = hash2(x1, y1, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

function fbmTiled(u, v, baseCells, octaves, seed = 0) {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoiseTiled(u, v, baseCells << i, seed + i * 37) * amp;
    norm += amp;
    amp *= 0.5;
  }
  return sum / (norm || 1);
}

function valueNoiseWorld(x, z, scale, seed = 0) {
  const xi = Math.floor(x / scale);
  const zi = Math.floor(z / scale);
  const fx = smooth(x / scale - xi);
  const fz = smooth(z / scale - zi);
  const a = hash2(xi, zi, seed);
  const b = hash2(xi + 1, zi, seed);
  const c = hash2(xi, zi + 1, seed);
  const d = hash2(xi + 1, zi + 1, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
}

function makeRegolithTexture(res = 1024) {
  const data = new Uint8ClampedArray(res * res * 4);
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const u = x / res;
      const v = y / res;
      const broad = fbmTiled(u, v, 5, 4, 11);
      const mid = fbmTiled(u + 0.17, v - 0.09, 18, 4, 23);
      const fine = fbmTiled(u - 0.31, v + 0.27, 96, 3, 41);
      const grain = fbmTiled(u, v, 220, 2, 59);
      const pebble = hash2(Math.floor(u * 380), Math.floor(v * 380), 71);
      const ridge = Math.abs(fine * 2 - 1);

      // Desaturated rusty regolith: not a saturated orange floor. Broad/mid
      // layers give dune-like patches; fine/grain layers give close-up grit.
      let r = 91 + broad * 42 + mid * 31 + fine * 16;
      let g = 45 + broad * 29 + mid * 24 + fine * 11;
      let b = 25 + broad * 19 + mid * 16 + fine * 8;
      const shade = 0.82 + mid * 0.24 + grain * 0.10 - ridge * 0.11;
      r *= shade; g *= shade; b *= shade;

      // Tiny light/dark mineral flecks break the "printed carpet" look when the
      // camera is near the ground. Sparse, deterministic, and still tileable.
      if (pebble > 0.985) {
        const fleck = 30 + hash2(x, y, 89) * 42;
        r += fleck; g += fleck * 0.82; b += fleck * 0.62;
      } else if (pebble < 0.018) {
        r *= 0.55; g *= 0.52; b *= 0.50;
      }

      const i = (y * res + x) * 4;
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  }
  // CanvasTexture has proven more reliable across Chrome/SwiftShader than an RGB
  // DataTexture here; the scene's verification path runs WebGL in headless Chrome.
  let tex;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = res;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    ctx.putImageData(new ImageData(data, res, res), 0, 0);
    tex = new THREE.CanvasTexture(canvas);
  } else {
    tex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat);
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function disposeTexture(tex) {
  tex?.dispose?.();
}

// Break the visible repeat: blend the diffuse/bump sample with two lower-frequency
// samples of the same generated texture. This MUST receive the shader argument
// directly from three.js; the previous implementation accidentally wrapped
// onBeforeCompile inside itself, so de-tiling never actually ran.
function deTile(shader) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    `#ifdef USE_MAP
      vec4 tileColor = texture2D( map, vMapUv );
      vec4 macroColor = texture2D( map, vMapUv * 0.161 + vec2(0.173, 0.097) );
      vec4 megaColor = texture2D( map, vMapUv * 0.047 + vec2(0.381, 0.211) );
      vec4 sampledDiffuseColor = mix(tileColor, macroColor, 0.32);
      sampledDiffuseColor = mix(sampledDiffuseColor, megaColor, 0.20);
      diffuseColor *= sampledDiffuseColor;
    #endif`,
  );
}

// Bounded, gently undulating regolith patch. The SAME displaced geometry drives
// the visible mesh AND a trimesh collider (RigidBody colliders="trimesh"), so the
// player walks exactly on what they see — no foot sliding/floating (plan M5).
// Deterministic displacement keeps it stable. The regolith texture arrives in T6;
// until then a flat rusty color stands in.
// Shared surface height so anything placed on the ground (boulders, spawns)
// matches the mesh exactly. DRY: the mesh displacement uses this too.
export function terrainHeight(x, z) {
  const dunes = Math.sin(x * 0.045) * Math.cos(z * 0.038) * 0.62
              + Math.sin((x + z) * 0.073 + 1.7) * 0.26;
  const broad = (valueNoiseWorld(x + 80, z - 40, 18, 101) - 0.5) * 0.74;
  const ripples = Math.sin(x * 0.42 + Math.sin(z * 0.11) * 1.7) * 0.035;
  return dunes + broad + ripples;
}

function makeGeometry(size, segments) {
  const g = new THREE.PlaneGeometry(size, size, segments, segments);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  }
  g.computeVertexNormals();
  return g;
}

export default function Terrain({ size = 240 }) {
  const gl = useThree((s) => s.gl);
  // Modest segment count keeps the trimesh collider cheap on mobile.
  const geometry = useMemo(() => makeGeometry(size, 160), [size]);
  // A generated 1024px tile gives close-up grain without shipping a huge texture.
  // The old 512px panorama crop is kept in public/ for provenance/debug, but using
  // it directly made the ground look like a blurry printed carpet.
  const procedural = useMemo(() => makeRegolithTexture(1024), []);
  useMemo(() => {
    procedural.repeat.set(size / 7.5, size / 7.5);
    procedural.anisotropy = gl?.capabilities?.getMaxAnisotropy?.() ?? 8;
    procedural.needsUpdate = true;
  }, [procedural, size, gl]);
  useEffect(() => () => disposeTexture(procedural), [procedural]);
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          map={procedural}
          bumpMap={procedural}
          bumpScale={0.075}
          color="#cbb39d"
          roughness={1}
          onBeforeCompile={deTile}
          customProgramCacheKey={() => 'mars-regolith-detiled-v2'}
        />
      </mesh>
    </RigidBody>
  );
}
