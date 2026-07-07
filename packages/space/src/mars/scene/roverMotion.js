import { terrainHeight } from './terrainMath.js';
import { ROVER_POS } from './landmarks.js';

// Slow autonomous patrol: Perseverance looks alive without becoming a hazard.
// The route loops around its original landmark area so the minimap can still lead
// learners to the rover, and speed stays intentionally walking-slow.
export const ROVER_PATROL_SPEED = 0.32; // metres / second
export const ROVER_PATROL_POINTS = [
  [ROVER_POS[0], ROVER_POS[2]],
  [ROVER_POS[0] + 3.8, ROVER_POS[2] - 2.3],
  [ROVER_POS[0] + 6.2, ROVER_POS[2] + 0.9],
  [ROVER_POS[0] + 2.2, ROVER_POS[2] + 3.4],
  [ROVER_POS[0] - 1.7, ROVER_POS[2] + 1.2],
];

const segments = ROVER_PATROL_POINTS.map((from, i) => {
  const to = ROVER_PATROL_POINTS[(i + 1) % ROVER_PATROL_POINTS.length];
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  return { from, to, dx, dz, len: Math.hypot(dx, dz) || 1 };
});

export const ROVER_PATROL_LENGTH = segments.reduce((sum, s) => sum + s.len, 0);
export const ROVER_PATROL_RADIUS = Math.max(
  12,
  ...ROVER_PATROL_POINTS.map(([x, z]) => Math.hypot(x - ROVER_POS[0], z - ROVER_POS[2]) + 4),
);

export function roverPoseAt(timeSeconds) {
  let d = ((timeSeconds * ROVER_PATROL_SPEED) % ROVER_PATROL_LENGTH + ROVER_PATROL_LENGTH) % ROVER_PATROL_LENGTH;
  let seg = segments[0];
  for (const candidate of segments) {
    if (d <= candidate.len) { seg = candidate; break; }
    d -= candidate.len;
  }
  const u = d / seg.len;
  const x = seg.from[0] + seg.dx * u;
  const z = seg.from[1] + seg.dz * u;
  const y = terrainHeight(x, z);
  // The model's forward axis is hand-tuned by MODEL_YAW_OFFSET in Rover.jsx; this
  // heading is the world travel direction expressed in x/z for UI + physics.
  const heading = Math.atan2(seg.dx, seg.dz);
  return { x, y, z, heading, dx: seg.dx / seg.len, dz: seg.dz / seg.len };
}
