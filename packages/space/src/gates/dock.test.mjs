import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreDock } from './dock.js';

test('perfect alignment → 3 stars', () => {
  assert.deepEqual(scoreDock({ x: 0, y: 0, roll: 0 }), { dist: 0, roll: 0, stars: 3 });
});

test('small offset + small roll → still 3', () => {
  assert.equal(scoreDock({ x: 5, y: 0, roll: 5 }).stars, 3);
});

test('moderate offset → 2 stars', () => {
  assert.equal(scoreDock({ x: 15, y: 0, roll: 10 }).stars, 2);
});

test('docked but bumpy → 1 star', () => {
  assert.equal(scoreDock({ x: 30, y: 0, roll: 0 }).stars, 1);
});

test('roll alone can drop a tight position to 1 star', () => {
  // position is crisp (dist 5) but roll 25° busts tiers 3 and 2
  assert.equal(scoreDock({ x: 5, y: 0, roll: 25 }).stars, 1);
});

test('way off → 0 stars', () => {
  assert.equal(scoreDock({ x: 45, y: 0, roll: 0 }).stars, 0);
  assert.equal(scoreDock({ x: 0, y: 0, roll: 50 }).stars, 0);
});

test('uses both axes for distance', () => {
  assert.equal(scoreDock({ x: 3, y: 4, roll: 0 }).dist, 5);
});
