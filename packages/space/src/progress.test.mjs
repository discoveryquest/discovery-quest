import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordGateResult, recordLessonResult } from './progress.js';
import { loadSave } from '@discoveryquest/engine/save';
import { computeXp, heroLevel, XP } from '@discoveryquest/engine/xp';
import { createGameStore, setGatePersister, setLessonPersister, PHASES } from './store/gameStore.js';

// In-memory storage (engine save/telemetry are storage-injectable for node tests).
function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('recordGateResult writes stars + telemetry + concept the engine xp reads', () => {
  const storage = memStorage();
  recordGateResult({ stationId: 'moon-phases', stars: 3, correct: 1, concept: 'moon-phases' }, storage);

  const save = loadSave(storage);
  assert.equal(save.stations['moon-phases'].stars, 3);
  assert.equal(save.conceptSeen['moon-phases'], true);

  // 1 correct + 3 stars + 1 active day + 1 concept
  const expected = 1 * XP.CORRECT + 3 * XP.PER_STAR + 1 * XP.STREAK + 1 * XP.CONCEPT;
  assert.equal(computeXp(save), expected);
  assert.ok(heroLevel(computeXp(save)) >= 2);
});

test('recordGateResult keeps best-of stars on replay', () => {
  const storage = memStorage();
  recordGateResult({ stationId: 'moon-phases', stars: 3, correct: 1, concept: 'moon-phases' }, storage);
  recordGateResult({ stationId: 'moon-phases', stars: 1, correct: 1, concept: 'moon-phases' }, storage);
  const save = loadSave(storage);
  assert.equal(save.stations['moon-phases'].stars, 3, 'stars never regress');
});

test('recordLessonResult adds correct + concept but no stars', () => {
  const storage = memStorage();
  recordLessonResult({ stationId: 'moon-phases', correct: 2, concept: 'moon-phases' }, storage);
  const save = loadSave(storage);
  assert.equal(save.conceptSeen['moon-phases'], true);
  assert.equal(save.stations['moon-phases']?.stars ?? 0, 0, 'lesson awards no stars');
  // 2 correct + 1 active day + 1 concept
  assert.equal(computeXp(save), 2 * XP.CORRECT + 1 * XP.STREAK + 1 * XP.CONCEPT);
});

test('store recordLesson flows through the injected lesson persister', () => {
  const calls = [];
  setLessonPersister((d) => calls.push(d));
  try {
    const store = createGameStore();
    store.actions.warpTo({ sectorId: 'backyard-sky', stationOrder: ['moon-phases'] });
    store.actions.arriveStation('moon-phases');
    store.actions.recordLesson({ correct: 2, concept: 'moon-phases' });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { stationId: 'moon-phases', correct: 2, concept: 'moon-phases' });
  } finally {
    setLessonPersister(null);
  }
});

test('store → injected persister flows the gate result through', () => {
  const calls = [];
  setGatePersister((d) => calls.push(d));
  try {
    const store = createGameStore();
    store.actions.warpTo({ sectorId: 'backyard-sky', stationOrder: ['moon-phases', 'day-night'] });
    store.actions.arriveStation('moon-phases');
    store.actions.startGate();
    store.actions.resolveGate({ stars: 2, correct: 1, concept: 'moon-phases' });
    assert.equal(store.get().phase, PHASES.STATION_IDLE);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { stationId: 'moon-phases', stars: 2, correct: 1, concept: 'moon-phases' });
  } finally {
    setGatePersister(null); // don't leak the module-global persister into other tests
  }
});

test('persister is not called on an invalid resolveGate', () => {
  const calls = [];
  setGatePersister((d) => calls.push(d));
  try {
    const store = createGameStore(); // still GALACTIC — no active gate
    store.actions.resolveGate({ stars: 3 });
    assert.equal(calls.length, 0);
  } finally {
    setGatePersister(null);
  }
});
