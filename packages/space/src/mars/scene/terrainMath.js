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

// Shared surface height so anything placed on the ground (player, rover,
// boulders, spawns) matches the mesh exactly.
export function terrainHeight(x, z) {
  const dunes = Math.sin(x * 0.045) * Math.cos(z * 0.038) * 0.62
              + Math.sin((x + z) * 0.073 + 1.7) * 0.26;
  const broad = (valueNoiseWorld(x + 80, z - 40, 18, 101) - 0.5) * 0.74;
  const ripples = Math.sin(x * 0.42 + Math.sin(z * 0.11) * 1.7) * 0.035;
  return dunes + broad + ripples;
}
