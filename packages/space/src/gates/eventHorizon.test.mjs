import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreSlingshot, IDEAL } from './eventHorizon.js';

test('right on the sweet spot → 3 stars, slingshot', () => {
  const r = scoreSlingshot(IDEAL);
  assert.equal(r.stars, 3);
  assert.equal(r.outcome, 'slingshot');
});

test('a little off → still 3, then 2', () => {
  assert.equal(scoreSlingshot(IDEAL + 6).stars, 3);
  assert.equal(scoreSlingshot(IDEAL + 13).stars, 2);
});

test('moderately off → 1 star', () => {
  assert.equal(scoreSlingshot(IDEAL - 22).stars, 1);
});

test('too far out → 0 stars, drifted', () => {
  const r = scoreSlingshot(10);
  assert.equal(r.stars, 0);
  assert.equal(r.outcome, 'drifted');
});

test('too close → 0 stars, pulled in', () => {
  const r = scoreSlingshot(98);
  assert.equal(r.stars, 0);
  assert.equal(r.outcome, 'pulled-in');
});
