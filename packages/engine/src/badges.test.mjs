import { test } from 'node:test';
import assert from 'node:assert/strict';
import { courseBadge, superHero, TIER } from './badges.js';

const save = (stars) => ({ stations: Object.fromEntries(Object.entries(stars).map(([id, s]) => [id, { stars: s }])) });
const IDS = ['a', 'b', 'c'];

test('no station ids → no badge', () => {
  const b = courseBadge(save({ a: 3 }), []);
  assert.equal(b.earned, false);
  assert.equal(b.tier, TIER.NONE);
});

test('a star on every station earns Hero (1★ is enough)', () => {
  const b = courseBadge(save({ a: 1, b: 2, c: 1 }), IDS);
  assert.equal(b.earned, true);
  assert.equal(b.gold, false);
  assert.equal(b.tier, TIER.HERO);
  assert.equal(b.starred, 3);
  assert.equal(b.total, 3);
});

test('one unstarred station → not earned', () => {
  const b = courseBadge(save({ a: 3, b: 3, c: 0 }), IDS);
  assert.equal(b.earned, false);
  assert.equal(b.starred, 2);
});

test('missing station in save counts as 0 stars', () => {
  const b = courseBadge(save({ a: 1, b: 1 }), IDS);
  assert.equal(b.earned, false);
  assert.equal(b.starred, 2);
});

test('3★ on every station turns the badge gold', () => {
  const b = courseBadge(save({ a: 3, b: 3, c: 3 }), IDS);
  assert.equal(b.earned, true);
  assert.equal(b.gold, true);
  assert.equal(b.tier, TIER.GOLD);
});

test('all starred but not all 3★ → Hero, not gold', () => {
  const b = courseBadge(save({ a: 3, b: 3, c: 2 }), IDS);
  assert.equal(b.gold, false);
  assert.equal(b.tier, TIER.HERO);
});

test('Super Hero needs Hero on 3 courses', () => {
  const hero = { earned: true, gold: false };
  const gold = { earned: true, gold: true };
  const none = { earned: false, gold: false };
  assert.equal(superHero({ math: hero, space: hero }).earned, false);
  assert.equal(superHero({ math: hero, space: hero, english: hero }).earned, true);
  assert.equal(superHero({ math: gold, space: hero, english: none }).earned, false);
  const s = superHero({ math: hero, space: hero, english: hero });
  assert.equal(s.heroCount, 3);
});

test('Super Hero gold needs gold on 3 courses', () => {
  const gold = { earned: true, gold: true };
  const hero = { earned: true, gold: false };
  assert.equal(superHero({ math: gold, space: gold, english: gold }).gold, true);
  assert.equal(superHero({ math: gold, space: gold, english: hero }).gold, false);
});
