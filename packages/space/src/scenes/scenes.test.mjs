import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRenderer } from './registry.js';
import { orbitPosition, phaseMaskShift, litFraction, litPath } from './geometry.js';
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

// From-Earth phase geometry (shared by the learn-it diagram + practice mechanic)
test('litFraction: new=0, quarter=0.5, full=1', () => {
  assert.ok(litFraction(0) < 0.001);
  assert.ok(Math.abs(litFraction(90) - 0.5) < 1e-9);
  assert.ok(litFraction(180) > 0.999);
  assert.ok(Math.abs(litFraction(270) - 0.5) < 1e-9);
});
test('litPath: new moon returns null (fully dark)', () => {
  assert.equal(litPath(0, 20, 100, 100), null);
});
test('litPath: full moon is a closed two-arc disc', () => {
  const d = litPath(180, 20, 100, 100);
  assert.match(d, /^M 100 80 A 20 20 0 1 1 100 120 A 20 20 0 1 1 100 80 Z$/);
});
test('litPath: waxing (θ<180) lit on the right → terminator sweep differs by gibbous', () => {
  const crescent = litPath(45, 20, 100, 100); // f<0.5
  const gibbous = litPath(135, 20, 100, 100); // f>0.5
  assert.match(crescent, /A 20 20 0 0 1 100 120/); // lit limb: right semicircle
  assert.match(gibbous, /A 20 20 0 0 1 100 120/);
  assert.ok(crescent.endsWith('0 0 0 100 80 Z')); // crescent terminator sweep 0
  assert.ok(gibbous.endsWith('0 0 1 100 80 Z')); // gibbous terminator sweep 1
});
test('litPath: waning (θ>180) is the mirror image — lit on the left', () => {
  const waningGibbous = litPath(225, 20, 100, 100);
  const waningCrescent = litPath(315, 20, 100, 100);
  assert.match(waningGibbous, /A 20 20 0 0 0 100 120/); // lit limb: left semicircle
  assert.ok(waningGibbous.endsWith('0 0 0 100 80 Z')); // gibbous sweep 0
  assert.ok(waningCrescent.endsWith('0 0 1 100 80 Z')); // crescent sweep 1
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

import { buildVoiceJobs } from './voiceJobs.js';

test('buildVoiceJobs turns the narration map into deduped slow jobs', () => {
  const course = { narration: { 'mp-0': 'Hi', 'mp-1': 'There', dup: 'Hi' } };
  const jobs = buildVoiceJobs(course);
  assert.deepEqual(jobs.find((j) => j.key === 'mp-0'), { key: 'mp-0', text: 'Hi', slow: true });
  assert.equal(jobs.length, 3);
  assert.ok(jobs.every((j) => j.slow === true));
});
