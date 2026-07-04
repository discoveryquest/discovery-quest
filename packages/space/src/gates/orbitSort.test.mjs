import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreOrder, scramble } from './orbitSort.js';

const CORRECT = ['mercury', 'venus', 'earth', 'mars'];

test('perfect order → 3 stars', () => {
  assert.deepEqual(scoreOrder(CORRECT, CORRECT), { correctCount: 4, total: 4, stars: 3 });
});

test('one adjacent swap → 2 correct of 4 → 1 star', () => {
  const r = scoreOrder(CORRECT, ['venus', 'mercury', 'earth', 'mars']);
  assert.equal(r.correctCount, 2);
  assert.equal(r.stars, 1);
});

test('fully reversed → 0 correct → 0 stars', () => {
  assert.equal(scoreOrder(CORRECT, ['mars', 'earth', 'venus', 'mercury']).stars, 0);
});

test('three of four in place is impossible, but 2/3 → 2 stars', () => {
  const c = ['a', 'b', 'c'];
  assert.equal(scoreOrder(c, ['a', 'b', 'x']).correctCount, 2);
  assert.equal(scoreOrder(c, ['a', 'b', 'x']).stars, 2); // 0.66
});

test('scramble keeps the same items, differs from input, is deterministic with seeded rand', () => {
  const out = scramble(CORRECT, () => 0);
  assert.deepEqual([...out].sort(), [...CORRECT].sort(), 'same items');
  assert.notDeepEqual(out, CORRECT, 'order changed');
  assert.deepEqual(scramble(CORRECT, () => 0), out, 'deterministic for a fixed rand');
});

test('scramble of a 2-list always swaps', () => {
  assert.deepEqual(scramble(['a', 'b'], () => 0.99), ['b', 'a']);
});
