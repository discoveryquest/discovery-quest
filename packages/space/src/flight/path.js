// Pure, dependency-free path math for the GUIDED flight (design spec §5.1):
// the ship auto-flies a smooth curved 3D path to the locked beacon. Operates on
// plain {x,y,z} points so it is unit-testable without three.js — the R3F layer
// (CameraRig/Ship) converts the samples into THREE.Vector3.

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (v) => Math.hypot(v.x, v.y, v.z);
export const dist = (a, b) => len(sub(a, b));

// Smoothstep ease for travel (slow out / slow in) — keeps motion gentle for kids.
export function easeInOut(t) {
  t = Math.max(0, Math.min(1, t));
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Uniform Catmull-Rom interpolation of one component between p1 and p2.
function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1)
    + (-p0 + p2) * t
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

const at = (pts, i) => pts[Math.max(0, Math.min(pts.length - 1, i))];

// Sample a Catmull-Rom spline through `points` at u in [0,1]. Endpoints are exact.
export function samplePath(points, u) {
  if (!points || points.length === 0) return { x: 0, y: 0, z: 0 };
  if (points.length === 1) return { ...points[0] };
  const segCount = points.length - 1;
  const uu = Math.max(0, Math.min(1, u));
  let seg = Math.floor(uu * segCount);
  if (seg >= segCount) seg = segCount - 1;
  const localT = uu * segCount - seg;
  const p0 = at(points, seg - 1), p1 = at(points, seg), p2 = at(points, seg + 1), p3 = at(points, seg + 2);
  return {
    x: cr(p0.x, p1.x, p2.x, p3.x, localT),
    y: cr(p0.y, p1.y, p2.y, p3.y, localT),
    z: cr(p0.z, p1.z, p2.z, p3.z, localT),
  };
}

// Approximate unit tangent at u (direction of travel) to orient the camera/ship.
export function tangentAt(points, u, eps = 1e-3) {
  const a = samplePath(points, Math.min(1, u + eps));
  const b = samplePath(points, Math.max(0, u - eps));
  const d = sub(a, b);
  const l = len(d) || 1;
  return { x: d.x / l, y: d.y / l, z: d.z / l };
}

// Build a gently arced flight path from `from` to `to` so travel reads as 3D
// (a lifted midpoint, not a straight line). `arc` scales the lift by path length.
export function flightPath(from, to, { arc = 0.25 } = {}) {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: (from.z + to.z) / 2 };
  const l = dist(from, to) || 1;
  const lifted = { x: mid.x, y: mid.y + l * arc, z: mid.z };
  return [from, lifted, to];
}
