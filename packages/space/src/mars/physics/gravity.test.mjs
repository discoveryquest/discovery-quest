import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apexHeight, hangTime, GRAVITY } from './gravity.js';

test('same jump impulse goes higher on Mars than Earth', () => {
  const v0 = 5; // m/s upward
  assert.ok(apexHeight(v0, GRAVITY.mars) > apexHeight(v0, GRAVITY.earth));
});
test('apex height = v0^2 / (2g)', () => {
  assert.ok(Math.abs(apexHeight(5, 9.81) - (25 / (2 * 9.81))) < 1e-9);
});
test('mars hang time is ~2.6x earth', () => {
  const r = hangTime(5, GRAVITY.mars) / hangTime(5, GRAVITY.earth);
  assert.ok(Math.abs(r - 9.81 / 3.72) < 1e-6);
});
