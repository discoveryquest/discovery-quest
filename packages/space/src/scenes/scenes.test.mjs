import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRenderer } from './registry.js';
import { orbitPosition, phaseMaskShift } from './geometry.js';
import { clampIndex, indexFromFraction, fractionFromIndex } from './scrub.js';

// Task 1 — Renderer registry + resolution
const A2D = () => '2d-orbit';
const A3D = () => '3d-orbit';
const B2D = () => '2d-body';
const REG = { '2d': { orbit: A2D, body: B2D }, '3d': { orbit: A3D } };

test('resolves the renderer for the requested mode+kind', () => {
  assert.equal(resolveRenderer(REG, '3d', 'orbit'), A3D);
});
test('falls back to 2d when the mode lacks the kind', () => {
  assert.equal(resolveRenderer(REG, '3d', 'body'), B2D);
});
test('falls back to 2d when the mode is unknown', () => {
  assert.equal(resolveRenderer(REG, 'vr', 'orbit'), A2D);
});
test('returns null for an unknown kind (caller renders nothing)', () => {
  assert.equal(resolveRenderer(REG, '2d', 'nope'), null);
});

// Task 2 — Orbit/geometry math
test('orbitPosition: angle 0 is to the right of center', () => {
  const p = orbitPosition({ cx: 100, cy: 100, radius: 50, angleDeg: 0 });
  assert.equal(Math.round(p.x), 150);
  assert.equal(Math.round(p.y), 100);
});
test('orbitPosition: angle 90 is below center (SVG y grows down)', () => {
  const p = orbitPosition({ cx: 100, cy: 100, radius: 50, angleDeg: 90 });
  assert.equal(Math.round(p.x), 100);
  assert.equal(Math.round(p.y), 150);
});
test('phaseMaskShift maps fraction 0 to full-left, 0.5 centered, 1 full-right', () => {
  assert.equal(phaseMaskShift(0, 56), -56);
  assert.equal(phaseMaskShift(0.5, 56), 0);
  assert.equal(phaseMaskShift(1, 56), 56);
});

// Task 3 — Scrub (interactive state) math
test('clampIndex keeps index within [0, n-1]', () => {
  assert.equal(clampIndex(-2, 4), 0);
  assert.equal(clampIndex(9, 4), 3);
  assert.equal(clampIndex(2, 4), 2);
});
test('indexFromFraction buckets a 0..1 drag across n states', () => {
  assert.equal(indexFromFraction(0, 3), 0);
  assert.equal(indexFromFraction(0.5, 3), 1);
  assert.equal(indexFromFraction(1, 3), 2);
});
test('fractionFromIndex is the inverse midpoint of a bucket', () => {
  assert.equal(fractionFromIndex(0, 3), 0);
  assert.equal(fractionFromIndex(2, 3), 1);
});
