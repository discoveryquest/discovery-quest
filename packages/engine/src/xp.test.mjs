import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeXp, xpBreakdown, XP } from './xp.js';

const save = (over = {}) => ({ stations: {}, telemetry: {}, conceptSeen: {}, ...over });

test('empty save → 0 xp', () => {
  assert.equal(computeXp(save()), 0);
  assert.equal(computeXp(null), 0);
});

test('stars award XP_PER_STAR each', () => {
  assert.equal(computeXp(save({ stations: { s1: { stars: 3 } } })), 3 * XP.PER_STAR);
});

test('correct answers award XP_CORRECT, summed across days, per station', () => {
  const s = save({ telemetry: {
    '2026-06-10': { s1: { correct: 2 } },
    '2026-06-11': { s1: { correct: 3 }, s2: { correct: 1 } },
  } });
  // s1 has 5 corrects, s2 has 1; none past the cap → 6 corrects total. BUT note streak:
  // 2 distinct days also add streak XP, so assert only the correct portion by subtracting streak.
  assert.equal(computeXp(s) - 2 * XP.STREAK, 6 * XP.CORRECT);
});

test('correct XP is capped per station (mastered-station anti-farm)', () => {
  const s = save({ telemetry: { '2026-06-10': { s1: { correct: 100 } } } });
  // capped corrects (15) + 1 day of streak
  assert.equal(computeXp(s), XP.CORRECT_CAP * XP.CORRECT + 1 * XP.STREAK);
});

test('review hits award XP_REVIEW, uncapped', () => {
  const s = save({ telemetry: { '2026-06-10': { s1: { reviewsHit: 4 } } } });
  assert.equal(computeXp(s), 4 * XP.REVIEW + 1 * XP.STREAK);
});

test('daily streak awards XP_STREAK per distinct active day', () => {
  const s = save({ telemetry: { '2026-06-10': { s1: { correct: 0 } }, '2026-06-11': { s1: { correct: 0 } } } });
  assert.equal(computeXp(s), 2 * XP.STREAK);
});

test('new concepts award XP_CONCEPT each', () => {
  assert.equal(computeXp(save({ conceptSeen: { a: true, b: true } })), 2 * XP.CONCEPT);
});

test('computeXp is monotonic and idempotent', () => {
  const s = save({ stations: { s1: { stars: 1 } }, telemetry: { '2026-06-10': { s1: { correct: 2 } } }, conceptSeen: { a: true } });
  const once = computeXp(s);
  assert.equal(computeXp(s), once);
  s.stations.s1.stars = 2;
  assert.ok(computeXp(s) > once);
});

import { xpByStation, heroLevel, heroProgress, totalXp } from './xp.js';

test('xpByStation gives per-station contribution (correct capped + stars)', () => {
  const s = { stations: { s1: { stars: 2 } }, telemetry: { d1: { s1: { correct: 3 } } }, conceptSeen: {} };
  // s1: min(3,15)*10 + 2*50 = 30 + 100 = 130
  assert.equal(xpByStation(s).s1, 130);
});

test('heroLevel curve: Lv1 at 0, Lv2 at 100, Lv7 at 3600', () => {
  assert.equal(heroLevel(0), 1);
  assert.equal(heroLevel(100), 2);
  assert.equal(heroLevel(3600), 7);
});

test('heroProgress returns level + pct in [0,1)', () => {
  const p = heroProgress(150);
  assert.equal(p.level, 2);
  assert.ok(p.pct >= 0 && p.pct < 1);
});

test('totalXp sums an xpByCourse map', () => {
  assert.equal(totalXp({ math: 3100, english: 980, 'english-ru': 740 }), 4820);
  assert.equal(totalXp(undefined), 0);
});

test('xpBreakdown splits by source and sums to computeXp', () => {
  const s = { stations: { s1: { stars: 3 } }, conceptSeen: { c1: 1 },
    telemetry: { '2026-06-10': { s1: { correct: 4, reviewsHit: 2 } } } };
  const b = xpBreakdown(s);
  assert.equal(b.stars, 3 * XP.PER_STAR);
  assert.equal(b.correct, 4 * XP.CORRECT);
  assert.equal(b.reviews, 2 * XP.REVIEW);
  assert.equal(b.streak, 1 * XP.STREAK);
  assert.equal(b.concepts, 1 * XP.CONCEPT);
  assert.equal(b.total, computeXp(s));
});

test('xpBreakdown of empty/null → zeros', () => {
  assert.equal(xpBreakdown(null).total, 0);
  assert.equal(xpBreakdown({}).total, 0);
});
