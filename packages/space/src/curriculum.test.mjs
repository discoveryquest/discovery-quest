import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starsOf, isStationOpen, isWorldUnlocked, startWorldForAge, totalStars, maxStars, frontierStation } from './curriculum.js';

const worlds = [{ stations: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }];
const save = (stars = {}) => ({ stations: Object.fromEntries(Object.entries(stars).map(([k, v]) => [k, { stars: v }])) });

// 3-chapter course for cross-world tests (last station of each = w1c / w2c / w3c).
const chapters = [
  { stations: [{ id: 'w1a' }, { id: 'w1b' }, { id: 'w1c' }] },
  { stations: [{ id: 'w2a' }, { id: 'w2b' }, { id: 'w2c' }] },
  { stations: [{ id: 'w3a' }, { id: 'w3b' }, { id: 'w3c' }] },
];

test('first station open; later ones gated by predecessor stars', () => {
  assert.equal(isStationOpen(save({}), worlds[0], 0), true);
  assert.equal(isStationOpen(save({}), worlds[0], 1), false);
  assert.equal(isStationOpen(save({ a: 1 }), worlds[0], 1), true);
});

test('star totals', () => {
  assert.equal(maxStars(worlds), 9);
  assert.equal(totalStars(save({ a: 3, b: 2 }), worlds), 5);
  assert.equal(starsOf(save({ a: 3 }), 'a'), 3);
});

test('frontier = earliest open station under 3 stars', () => {
  assert.equal(frontierStation(save({}), worlds), 'a');
  assert.equal(frontierStation(save({ a: 3 }), worlds), 'b'); // a maxed → b now open + unfinished
  assert.equal(frontierStation(save({ a: 3, b: 3, c: 3 }), worlds), null); // all done
});

// Regression for the "starts on the last chapter" bug: with no progress the hero must
// sit in the FIRST world, not the last.
test('frontier stays in the first world with no progress', () => {
  assert.equal(frontierStation(save({}), chapters), 'w1a');
});

test('chapters lock until the previous one is cleared (last station starred)', () => {
  assert.equal(isWorldUnlocked(save({}), chapters, 0), true); // first always open
  assert.equal(isWorldUnlocked(save({}), chapters, 1), false); // locked
  assert.equal(isWorldUnlocked(save({ w1c: 1 }), chapters, 1), true); // ch.1 cleared → ch.2 opens
  assert.equal(isWorldUnlocked(save({ w1c: 1 }), chapters, 2), false); // ch.3 still locked
});

test('age sets the start chapter; younger chapters stay unlocked (collapsed elsewhere)', () => {
  assert.equal(startWorldForAge(5, 4), 0);
  assert.equal(startWorldForAge(8, 4), 1);
  assert.equal(startWorldForAge('11+', 4), 2);
  assert.equal(startWorldForAge(12, 4), 2); // capped: never collapse the last two chapters
  // an older child starting at chapter 2 has 0..2 unlocked, hero at the start of chapter 2
  assert.equal(isWorldUnlocked(save({}), chapters, 1, 2), true);
  assert.equal(frontierStation(save({}), chapters, 2), 'w3a');
});
