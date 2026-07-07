import test from 'node:test';
import assert from 'node:assert/strict';
import { ROVER_PATROL_LENGTH, ROVER_PATROL_POINTS, ROVER_PATROL_RADIUS, ROVER_PATROL_SPEED, roverPoseAt } from './roverMotion.js';

test('roverPoseAt starts at the first patrol point and loops', () => {
  const a = roverPoseAt(0);
  const b = roverPoseAt(ROVER_PATROL_LENGTH / ROVER_PATROL_SPEED);
  assert.equal(a.x, ROVER_PATROL_POINTS[0][0]);
  assert.equal(a.z, ROVER_PATROL_POINTS[0][1]);
  assert.ok(Math.abs(a.x - b.x) < 1e-9);
  assert.ok(Math.abs(a.z - b.z) < 1e-9);
});

test('roverPoseAt moves slowly along the first segment', () => {
  const a = roverPoseAt(0);
  const b = roverPoseAt(5);
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  assert.ok(dist > 1.5 && dist < 1.7);
  assert.ok(Number.isFinite(b.heading));
});

test('patrol radius covers the whole route with room for the minimap', () => {
  for (const [x, z] of ROVER_PATROL_POINTS) {
    const d = Math.hypot(x - ROVER_PATROL_POINTS[0][0], z - ROVER_PATROL_POINTS[0][1]);
    assert.ok(d < ROVER_PATROL_RADIUS);
  }
});
