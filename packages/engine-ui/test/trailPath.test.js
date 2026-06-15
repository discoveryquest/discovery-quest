import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROW, zigzag, yOf, trailPathD } from '../src/trailPath.js';

test('yOf lays stations bottom-up (index 0 is lowest = largest y)', () => {
  assert.equal(yOf(0, 3), 2 * ROW + ROW / 2);   // first station nearest the bottom
  assert.equal(yOf(2, 3), ROW / 2);              // last station at the top
});

test('zigzag alternates left/right', () => {
  assert.equal(zigzag(0), 34);
  assert.equal(zigzag(1), 66);
  assert.equal(zigzag(2), 34);
});

test('trailPathD starts with a moveto and chains smooth curves', () => {
  const d = trailPathD([[34, 290], [66, 174], [34, 58]]);
  assert.match(d, /^M 34 290/);
  assert.equal((d.match(/C /g) || []).length, 2); // one curve per segment after the first
});
