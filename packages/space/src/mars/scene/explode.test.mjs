import test from 'node:test';
import assert from 'node:assert/strict';
import { partIdForObject, outwardDir, centroidAngle, fanDir, partOffset, gallerySlot, GALLERY, EXPLODE_SPREAD, EXPLODE_LIFT } from './explode.js';

// Minimal Object3D-like nodes for the ancestor-walk logic.
const node = (name, parent = null) => ({ name, parent });

test('partIdForObject claims a mesh by its nearest matching ancestor', () => {
  const parts = [
    { id: 'arm', nodes: ['arm'] },
    { id: 'pixl', nodes: ['PIXL'] },
  ];
  const arm = node('arm');
  const pixl = node('PIXL', arm);      // PIXL nested under the arm
  const pixlLeaf = node('mesh', pixl);
  const armLeaf = node('mesh', arm);
  // Nearest-ancestor wins: the instrument nested inside the arm is still its own part.
  assert.equal(partIdForObject(pixlLeaf, parts), 'pixl');
  assert.equal(partIdForObject(armLeaf, parts), 'arm');
});

test('partIdForObject returns null when nothing matches (chassis fallback)', () => {
  const parts = [{ id: 'arm', nodes: ['arm'] }];
  assert.equal(partIdForObject(node('Body'), parts), null);
});

test('outwardDir points from center to the part and is unit length', () => {
  const d = outwardDir({ x: 3, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  assert.ok(d.x > 0.99);
  assert.ok(Math.abs(Math.hypot(d.x, d.y, d.z) - 1) < 1e-6);
});

test('outwardDir falls back to straight up for a part at the center', () => {
  const d = outwardDir({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  assert.deepEqual(d, { x: 0, y: 1, z: 0 });
});

test('gallerySlot puts the selected part dead centre, closer than the arc', () => {
  const s = gallerySlot(3, 10, true);
  assert.equal(s.x, 0);
  assert.equal(s.y, GALLERY.spotY);
  assert.ok(s.depth < GALLERY.homeDepth); // spotlight is nearer than the arc
});

test('gallerySlot spreads unselected parts left→right across the arc', () => {
  const left = gallerySlot(0, 10, false);
  const mid = gallerySlot(5, 10, false);
  const right = gallerySlot(9, 10, false);
  assert.ok(left.x < 0 && right.x > 0);          // ends flank the centre
  assert.ok(Math.abs(mid.x) < Math.abs(right.x)); // middle nearer centre
  assert.ok(left.depth > mid.depth && right.depth > mid.depth); // ends curve away
});

test('partOffset collapses to (near) zero when assembled (factor 0)', () => {
  const o = partOffset({ x: 1, y: 0, z: 0 }, 0, 12.3, 0.5);
  assert.equal(o.x, 0);
  assert.equal(o.y, 0); // bob is scaled by factor too, so fully home
  assert.equal(o.z, 0);
});

test('centroidAngle orders parts around the body', () => {
  const c = { x: 0, y: 0, z: 0 };
  assert.ok(Math.abs(centroidAngle({ x: 1, y: 0, z: 0 }, c) - 0) < 1e-9);            // +x → 0
  assert.ok(Math.abs(centroidAngle({ x: 0, y: 0, z: 1 }, c) - Math.PI / 2) < 1e-9); // +z → 90°
});

test('fanDir spreads parts evenly around a horizontal ring', () => {
  const n = 4;
  const dirs = Array.from({ length: n }, (_, i) => fanDir(i, n));
  // Slot 0 points +x; slot 1 (quarter turn) points +z.
  assert.ok(dirs[0].x > 0.99);
  assert.ok(dirs[1].z > 0.99);
  // Each ring member has unit horizontal reach so radius is constant.
  for (const d of dirs) assert.ok(Math.abs(Math.hypot(d.x, d.z) - 1) < 1e-9);
  // Height tiers stagger (not all the same y).
  assert.ok(new Set(dirs.map((d) => d.y)).size > 1);
});

test('partOffset drives the part out + up at full explosion', () => {
  const o = partOffset({ x: 1, y: 0, z: 0 }, 1, 0, 0); // time 0, phase 0 → no bob
  assert.ok(Math.abs(o.x - EXPLODE_SPREAD) < 1e-9);
  assert.ok(Math.abs(o.y - EXPLODE_LIFT) < 1e-9);
  assert.equal(o.z, 0);
});
