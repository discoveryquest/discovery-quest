// Real solar-system data driving the 3D bodies kit. Rotation is sidereal;
// negative hours = retrograde spin (Venus, Uranus). Axial tilt in degrees to
// the orbital plane — Uranus really does roll on its side at 97.8°.
// Display scales compress the true ranges (Sun is 109× Earth, Neptune is 30 AU
// out) so everything stays on screen together while relative order is kept.

export const BODIES = {
  sun: { kind: 'star', radiusKm: 695700, tiltDeg: 7.25, rotationHours: 609.12 },
  mercury: { radiusKm: 2439.7, tiltDeg: 0.034, rotationHours: 1407.6, orbit: { aAU: 0.387, periodDays: 87.97 } },
  venus: { radiusKm: 6051.8, tiltDeg: 177.4, rotationHours: -5832.5, orbit: { aAU: 0.723, periodDays: 224.7 }, atmoColor: '#e8c37a' },
  earth: { radiusKm: 6371, tiltDeg: 23.44, rotationHours: 23.93, orbit: { aAU: 1.0, periodDays: 365.25 }, atmoColor: '#6ab7ff' },
  moon: { radiusKm: 1737.4, tiltDeg: 6.68, rotationHours: 655.7, orbit: { aAU: 0.00257, periodDays: 27.32, around: 'earth' } },
  mars: { radiusKm: 3389.5, tiltDeg: 25.19, rotationHours: 24.62, orbit: { aAU: 1.524, periodDays: 687 }, atmoColor: '#e09b6d', atmoOpacity: 0.35 },
  jupiter: { radiusKm: 69911, tiltDeg: 3.13, rotationHours: 9.93, orbit: { aAU: 5.203, periodDays: 4332.6 }, atmoColor: '#d8ca9d', atmoOpacity: 0.4 },
  saturn: { radiusKm: 58232, tiltDeg: 26.73, rotationHours: 10.66, orbit: { aAU: 9.537, periodDays: 10759 }, atmoColor: '#e3d8b0', atmoOpacity: 0.35, ring: { innerKm: 74500, outerKm: 140220 } },
  uranus: { radiusKm: 25362, tiltDeg: 97.77, rotationHours: -17.24, orbit: { aAU: 19.19, periodDays: 30688 }, atmoColor: '#9fe3e3', atmoOpacity: 0.4, ring: { innerKm: 41837, outerKm: 51149, faint: true } },
  neptune: { radiusKm: 24622, tiltDeg: 28.32, rotationHours: 16.11, orbit: { aAU: 30.07, periodDays: 60182 }, atmoColor: '#6a8cff', atmoOpacity: 0.45 },
  ceres: { radiusKm: 469.7, tiltDeg: 4, rotationHours: 9.07, orbit: { aAU: 2.77, periodDays: 1683 } },
};

export const PLANET_ORDER = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

const DEG = Math.PI / 180;
export const tiltRad = (body) => (BODIES[body]?.tiltDeg ?? 0) * DEG;

// --- display scaling ------------------------------------------------------
// Sizes: r ∝ km^0.45 keeps Jupiter big without erasing Mercury.
// Distances: d ∝ AU^0.55 keeps Neptune reachable without gluing Mercury to the Sun.
const SIZE_EXP = 0.45;
const DIST_EXP = 0.55;

export function displayRadius(body, k = 0.028) {
  const km = BODIES[body]?.radiusKm ?? 3000;
  return k * Math.pow(km, SIZE_EXP);
}

export function displayOrbitRadius(body, k = 14) {
  const a = BODIES[body]?.orbit?.aAU ?? 1;
  return k * Math.pow(a, DIST_EXP);
}

// --- motion ---------------------------------------------------------------
// timeScale = simulated seconds per real second. At the default 4000 an Earth
// day takes ~21.5s and an Earth year ~2.2h — spins read clearly, orbits crawl.
export function spinRadPerSec(body, timeScale = 4000) {
  const h = BODIES[body]?.rotationHours;
  if (!h) return 0;
  return ((2 * Math.PI) / (Math.abs(h) * 3600)) * Math.sign(h) * timeScale;
}

export function orbitRadPerSec(body, timeScale = 4000) {
  const d = BODIES[body]?.orbit?.periodDays;
  if (!d) return 0;
  return ((2 * Math.PI) / (d * 86400)) * timeScale;
}

// Kepler-flavoured belt speed for arbitrary semi-major axes (ω ∝ a^-1.5).
export function beltRadPerSec(aAU, timeScale = 4000) {
  const periodDays = 365.25 * Math.pow(aAU, 1.5);
  return ((2 * Math.PI) / (periodDays * 86400)) * timeScale;
}
