import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNearestInRange } from './selection.js';

const P = { x: 0, y: 0, z: 0 };
const rocks = [
  { id: 'a', pos: { x: 3, y: 0, z: 0 } },
  { id: 'b', pos: { x: 1, y: 0, z: 0 } },
  { id: 'c', pos: { x: 10, y: 0, z: 0 } },
];
test('returns nearest within range', () => {
  assert.equal(pickNearestInRange(P, rocks, 2.5), 'b');
});
test('returns null when none in range', () => {
  assert.equal(pickNearestInRange(P, rocks, 0.5), null);
});
test('ignores a held rock (pos null)', () => {
  const r = [{ id: 'b', pos: null }, { id: 'a', pos: { x: 3, y: 0, z: 0 } }];
  assert.equal(pickNearestInRange(P, r, 5), 'a');
});
