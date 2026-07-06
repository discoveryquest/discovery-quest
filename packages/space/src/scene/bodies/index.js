// 3D bodies kit — realistic textured solar-system objects with real physics
// (sidereal spin, axial tilt, Kepler-scaled orbits). Textures load from
// /textures by default; see textures.js. Wrap consumers in <Suspense>.
export { BODIES, PLANET_ORDER, tiltRad, displayRadius, displayOrbitRadius, spinRadPerSec, orbitRadPerSec, beltRadPerSec } from './physics.js';
export { setTextureBase, texUrl, useBodyTexture, SURFACE_MAP } from './textures.js';
export { default as Planet } from './Planet.jsx';
export { default as Sun } from './Sun.jsx';
export { default as Rings } from './Rings.jsx';
export { default as Atmosphere } from './Atmosphere.jsx';
export { default as MilkyWay } from './MilkyWay.jsx';
export { Asteroid, AsteroidBelt, rockGeometry } from './Asteroids.jsx';
