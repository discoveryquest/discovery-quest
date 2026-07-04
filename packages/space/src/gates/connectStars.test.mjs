import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathEdges, scoreConstellation } from './connectStars.js';

const CORRECT = ['a', 'b', 'c', 'd'];

test('pathEdges builds undirected consecutive edges', () => {
  assert.deepEqual([...pathEdges(['a', 'b', 'c'])].sort(), ['a|b', 'b|c']);
  assert.deepEqual([...pathEdges(['a'])], []);
});

test('perfect trace → 3 stars', () => {
  assert.deepEqual(scoreConstellation(CORRECT, CORRECT), { matched: 3, total: 3, wrong: 0, stars: 3 });
});

test('reverse trace still matches (undirected) → 3 stars', () => {
  assert.equal(scoreConstellation(CORRECT, ['d', 'c', 'b', 'a']).stars, 3);
});

test('missing one line → 2/3 → 2 stars', () => {
  const r = scoreConstellation(CORRECT, ['a', 'b', 'c']); // missing c-d
  assert.equal(r.matched, 2);
  assert.equal(r.total, 3);
  assert.equal(r.stars, 2);
});

test('all correct lines but an extra wrong one → not perfect (2 stars)', () => {
  const r = scoreConstellation(CORRECT, ['a', 'b', 'c', 'd', 'a']); // adds wrong d-a
  assert.equal(r.matched, 3);
  assert.equal(r.wrong, 1);
  assert.equal(r.stars, 2);
});

test('totally wrong trace → 0 stars', () => {
  assert.equal(scoreConstellation(CORRECT, ['x', 'y', 'z']).stars, 0);
});
