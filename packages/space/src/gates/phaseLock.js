// Cosmic Gate: "Phase Lock" (spec §3, Sector 1). The child rotates the Sun
// around the Moon to match a target phase. Pure scoring logic — no three/React —
// so it is unit-testable; the gate UI (PhaseLockGate.jsx) drives it.
//
// Angle = the Sun's position around the Moon in degrees (0 = new moon, the Sun
// behind us lighting the far side; 180 = full moon, Sun behind the Moon).

export const MOON_PHASES = [
  { name: 'new', label: 'New Moon', emoji: '🌑', angle: 0 },
  { name: 'waxing-crescent', label: 'Waxing Crescent', emoji: '🌒', angle: 45 },
  { name: 'first-quarter', label: 'First Quarter', emoji: '🌓', angle: 90 },
  { name: 'waxing-gibbous', label: 'Waxing Gibbous', emoji: '🌔', angle: 135 },
  { name: 'full', label: 'Full Moon', emoji: '🌕', angle: 180 },
  { name: 'waning-gibbous', label: 'Waning Gibbous', emoji: '🌖', angle: 225 },
  { name: 'last-quarter', label: 'Last Quarter', emoji: '🌗', angle: 270 },
  { name: 'waning-crescent', label: 'Waning Crescent', emoji: '🌘', angle: 315 },
];

export function phaseByName(name) {
  return MOON_PHASES.find((p) => p.name === name) || null;
}

export function targetAngle(name) {
  return phaseByName(name)?.angle ?? 0;
}

// Shortest angular distance between two angles, in degrees (0..180).
export function angularError(a, b) {
  const d = (((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

// Nearest named phase to an arbitrary angle (drives the live preview).
export function phaseForAngle(angle) {
  let best = MOON_PHASES[0];
  let bestErr = Infinity;
  for (const p of MOON_PHASES) {
    const e = angularError(angle, p.angle);
    if (e < bestErr) { bestErr = e; best = p; }
  }
  return best;
}

// Stars (0..3) by how close the chosen Sun angle is to the target phase.
export function scorePhase(targetName, chosenAngle) {
  const error = angularError(chosenAngle, targetAngle(targetName));
  const stars = error <= 12 ? 3 : error <= 30 ? 2 : error <= 55 ? 1 : 0;
  return { error, stars };
}
