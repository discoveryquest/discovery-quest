import { ROVER_PARTS } from './roverParts.js';

// Pure geometry for the rover exploded view. Kept framework-free so the
// direction/offset math is unit-testable without a WebGL context. The Rover
// component does the three.js reparenting + per-frame animation on top of these.

// How far parts drift out from the body at full explosion (model-local units,
// before the 0.6 model scale) and how much the whole diagram lifts off the deck.
// Parts fan out into a ring (see fanDir) so the compact rover reads as a proper
// exploded diagram instead of a clump; spread is the ring radius.
export const EXPLODE_SPREAD = 2.4;
export const EXPLODE_LIFT = 1.0;
export const BOB_AMP = 0.06;
export const BOB_SPEED = 1.1;

// Which rover part owns a given mesh: walk up the ancestor chain and return the
// FIRST part whose node set contains an ancestor's name. Nearest-ancestor wins,
// so a nested instrument (PIXL under the arm's turret) is claimed by the PIXL
// part, not the arm — that is what lets nested parts fly apart independently.
// `object` is any three.js Object3D-like node ({ name, parent }); parts default
// to ROVER_PARTS but is injectable for testing.
export function partIdForObject(object, parts = ROVER_PARTS) {
  for (let o = object; o; o = o.parent) {
    for (const part of parts) {
      if (part.nodes && part.nodes.includes(o.name)) return part.id;
    }
  }
  return null;
}

// Angle of a part around the body's vertical axis (in the horizontal plane), used
// to ORDER parts around the exploded ring so each fans out roughly toward its real
// side of the rover — front instruments to the front, antennas to the back.
export function centroidAngle(centroid, center) {
  return Math.atan2(centroid.z - center.z, centroid.x - center.x);
}

// Fan direction for a part at ring slot `index` of `count`. Parts spread evenly
// around a circle (so nothing overlaps) and stagger across three height tiers so
// the ring reads with depth. y is intentionally un-normalized — it is a height
// offset, scaled by spread in partOffset — not part of a unit vector.
export function fanDir(index, count) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2;
  const tier = (index % 3) - 1; // -1, 0, +1 → low / mid / high
  return { x: Math.cos(angle), y: tier * 0.42, z: Math.sin(angle) };
}

// Outward unit direction for a part, from the body center to the part centroid.
// Purely horizontal-biased so parts fan out around the rover rather than stacking
// vertically, but a small vertical component is preserved so tall parts (mast,
// antennas) still rise. Returns a normalized {x,y,z}; degenerate (part at center)
// falls back to straight up so it still separates.
export function outwardDir(centroid, center) {
  let x = centroid.x - center.x;
  let y = (centroid.y - center.y) * 0.35;
  let z = centroid.z - center.z;
  const len = Math.hypot(x, y, z);
  if (len < 1e-4) return { x: 0, y: 1, z: 0 };
  return { x: x / len, y: y / len, z: z / len };
}

// Camera-facing "gallery" layout. Instead of a 3D ring, parts spread across the
// screen on a stable arc (ordered by the nav order) and the selected part lifts to
// a centre spotlight — so it reads like a shelf with the current item front-centre.
// Returns a camera-space offset {x (right), y (up), depth (forward)} in metres; the
// caller maps it into world space using the live camera basis.
export const GALLERY = {
  arcWidth: 4.4,   // horizontal spread of the arc at home depth
  arcRise: 0.35,   // how much the middle of the arc lifts (gentle rainbow)
  homeY: 0.5,      // arc height above the view centre (keeps the card area clear)
  homeDepth: 3.9,  // distance to the arc
  arcDepth: 0.8,   // extra distance at the arc ends (curves away)
  spotY: -0.15,    // spotlight a touch below centre so it dominates
  spotDepth: 2.7,  // spotlight closer than the arc → bigger, clearly the subject
};

export function gallerySlot(index, count, isSelected) {
  if (isSelected) return { x: 0, y: GALLERY.spotY, depth: GALLERY.spotDepth };
  const t = count > 1 ? index / (count - 1) : 0.5; // 0 = left … 1 = right
  const edge = Math.abs(t - 0.5);
  return {
    x: (t - 0.5) * GALLERY.arcWidth,
    y: GALLERY.homeY + Math.cos((t - 0.5) * Math.PI) * GALLERY.arcRise,
    depth: GALLERY.homeDepth + edge * GALLERY.arcDepth,
  };
}

// Local-space offset for a part this frame: eased outward drift + lift, plus a
// slow idle bob so the floating parts feel alive. All scaled by `factor` (0→1) so
// everything collapses exactly to the assembled pose when the tour closes.
export function partOffset(dir, factor, time, bobPhase) {
  const bob = Math.sin(time * BOB_SPEED + bobPhase) * BOB_AMP * factor;
  return {
    x: dir.x * EXPLODE_SPREAD * factor,
    y: dir.y * EXPLODE_SPREAD * factor + EXPLODE_LIFT * factor + bob,
    z: dir.z * EXPLODE_SPREAD * factor,
  };
}
