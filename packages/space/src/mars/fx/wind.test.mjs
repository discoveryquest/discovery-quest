import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gustAt } from './wind.js';

test('gust is bounded [0,1]', () => {
  for (let t = 0; t < 50; t += 0.37) {
    const g = gustAt(42, t);
    assert.ok(g >= 0 && g <= 1, `out of range at ${t}: ${g}`);
  }
});
test('deterministic for a given seed+t', () => {
  assert.equal(gustAt(7, 3.5), gustAt(7, 3.5));
});
test('different seeds differ somewhere', () => {
  const a = Array.from({ length: 20 }, (_, i) => gustAt(1, i));
  const b = Array.from({ length: 20 }, (_, i) => gustAt(2, i));
  assert.notDeepEqual(a, b);
});
