import { test } from 'node:test';
import assert from 'node:assert/strict';
import { samplePath, tangentAt, flightPath, easeInOut, dist } from './path.js';

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const near = (p, q, eps = 1e-9) => approx(p.x, q.x, eps) && approx(p.y, q.y, eps) && approx(p.z, q.z, eps);

const PTS = [
  { x: 0, y: 0, z: 0 },
  { x: 5, y: 2, z: 0 },
  { x: 10, y: 0, z: 0 },
];

test('samplePath hits the endpoints exactly', () => {
  assert.ok(near(samplePath(PTS, 0), PTS[0]));
  assert.ok(near(samplePath(PTS, 1), PTS[2]));
});

test('samplePath clamps u outside [0,1]', () => {
  assert.ok(near(samplePath(PTS, -3), PTS[0]));
  assert.ok(near(samplePath(PTS, 9), PTS[2]));
});

test('samplePath degenerate inputs', () => {
  assert.deepEqual(samplePath([], 0.5), { x: 0, y: 0, z: 0 });
  assert.ok(near(samplePath([{ x: 1, y: 2, z: 3 }], 0.7), { x: 1, y: 2, z: 3 }));
});

test('tangent points generally forward (+x) along this path', () => {
  assert.ok(tangentAt(PTS, 0.5).x > 0);
});

test('easeInOut endpoints and midpoint', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.ok(approx(easeInOut(0.5), 0.5));
  assert.equal(easeInOut(-1), 0);
  assert.equal(easeInOut(2), 1);
});

test('flightPath arcs the midpoint up between the endpoints', () => {
  const from = { x: 0, y: 0, z: 0 };
  const to = { x: 10, y: 0, z: 0 };
  const path = flightPath(from, to, { arc: 0.25 });
  assert.equal(path.length, 3);
  assert.ok(near(path[0], from));
  assert.ok(near(path[2], to));
  assert.ok(path[1].y > 0, 'midpoint lifted');
  assert.ok(approx(path[1].x, 5));
});

test('dist is euclidean', () => {
  assert.ok(approx(dist({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }), 5));
});
