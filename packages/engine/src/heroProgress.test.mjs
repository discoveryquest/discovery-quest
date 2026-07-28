import test from 'node:test';
import assert from 'node:assert/strict';
import { REGISTRY_KEY } from './profiles.js';
import { buildHeroProgress } from './heroProgress.js';
import { computeXp } from './xp.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
  };
}

const mathSave = {
  profile: { id: 'p1', name: 'Nova' },
  stations: { add: { stars: 2 } },
  telemetry: {},
  review: {},
  conceptSeen: {},
};

test('signed-out progress uses only the current course save', () => {
  const storage = memoryStorage({
    'lmq-save': mathSave,
    [REGISTRY_KEY]: {
      profiles: [{ id: 'p1', xpByCourse: { math: 10, english: 900 } }],
      lastUsedByCourse: { math: 'p1' },
    },
  });
  const result = buildHeroProgress({ courseId: 'math', storage });
  assert.equal(result.isCrossCourse, false);
  assert.equal(result.xp, computeXp(mathSave));
  assert.deepEqual(result.xpByCourse, { math: computeXp(mathSave) });
});

test('signed-in progress combines the roster ledger with fresh local XP', () => {
  const storage = memoryStorage({
    'lmq-save': mathSave,
    [REGISTRY_KEY]: {
      profiles: [{ id: 'p1', xpByCourse: { math: 10, english: 900 } }],
      lastUsedByCourse: { math: 'p1' },
    },
  });
  const result = buildHeroProgress({ courseId: 'math', isSignedIn: true, storage });
  assert.equal(result.isCrossCourse, true);
  assert.equal(result.xpByCourse.math, computeXp(mathSave));
  assert.equal(result.xp, 900 + computeXp(mathSave));
  assert.ok(result.level >= 1);
});

test('signed-in without an active roster profile safely stays local-only', () => {
  const storage = memoryStorage({ 'lmq-save': mathSave });
  const result = buildHeroProgress({ courseId: 'math', isSignedIn: true, storage });
  assert.equal(result.isCrossCourse, false);
  assert.equal(result.xp, computeXp(mathSave));
});
