// Texture map registry for the bodies kit. Maps are NOT bundled — they're
// served statically (platform: apps/space-quest/public/textures; dev preview:
// symlink to packages/space/assets/textures created by fetch-textures.mjs).
// Call setTextureBase() before mounting if they live somewhere else.
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

let TEXTURE_BASE = '/textures';
export const setTextureBase = (base) => { TEXTURE_BASE = base.replace(/\/$/, ''); };
export const texUrl = (name) => `${TEXTURE_BASE}/${name}`;

// Suspense-loading color map with correct sRGB handling.
export function useBodyTexture(name, { srgb = true } = {}) {
  const tex = useLoader(THREE.TextureLoader, texUrl(name));
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export const SURFACE_MAP = {
  sun: 'sun.jpg',
  mercury: 'mercury.jpg',
  venus: 'venus_surface.jpg',
  earth: 'earth_day.jpg',
  moon: 'moon.jpg',
  mars: 'mars.jpg',
  jupiter: 'jupiter.jpg',
  saturn: 'saturn.jpg',
  uranus: 'uranus.jpg',
  neptune: 'neptune.jpg',
  ceres: 'ceres.jpg',
};
