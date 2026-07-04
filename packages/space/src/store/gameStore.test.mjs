import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASES, initialState, warpTo, openStarChart, markLearned, lockBeacon, arriveStation, startGate, resolveGate, createGameStore,
} from './gameStore.js';

const ORDER = ['a', 'b', 'c'];
const enter = () => warpTo(initialState(), { sectorId: 'backyard-sky', stationOrder: ORDER });

test('initial state is GALACTIC and empty', () => {
  const s = initialState();
  assert.equal(s.phase, PHASES.GALACTIC);
  assert.equal(s.sectorId, null);
  assert.deepEqual(s.unlocked, {});
});

test('warpTo enters the sector, unlocks only the first station, flies to it', () => {
  const s = enter();
  assert.equal(s.phase, PHASES.FLYING);
  assert.equal(s.sectorId, 'backyard-sky');
  assert.equal(s.lockedBeacon, 'a');
  assert.deepEqual(s.unlocked, { a: true });
  assert.equal(s.cameraMode, 'cruise');
});

test('warpTo with no stations stays GALACTIC', () => {
  const s = warpTo(initialState(), { sectorId: 'x', stationOrder: [] });
  assert.equal(s.phase, PHASES.GALACTIC);
  assert.equal(s.lockedBeacon, null);
});

test('lockBeacon only works for unlocked stations', () => {
  const s = enter();
  assert.equal(lockBeacon(s, 'c'), s, 'locked station: no change');
  const s2 = lockBeacon(s, 'a');
  assert.equal(s2.phase, PHASES.FLYING);
  assert.equal(s2.lockedBeacon, 'a');
});

test('arriveStation moves to STATION_IDLE in approach mode', () => {
  const s = arriveStation(enter(), 'a');
  assert.equal(s.phase, PHASES.STATION_IDLE);
  assert.equal(s.stationId, 'a');
  assert.equal(s.cameraMode, 'approach');
});

test('arriveStation ignores locked stations', () => {
  const s = enter();
  assert.equal(arriveStation(s, 'b'), s);
});

test('startGate only from an idle station', () => {
  assert.equal(startGate(enter()).phase, PHASES.FLYING, 'cannot start while flying');
  const idle = arriveStation(enter(), 'a');
  assert.equal(startGate(idle).phase, PHASES.GATE_ACTIVE);
});

test('resolveGate records best-of stars and unlocks the next station', () => {
  let s = startGate(arriveStation(enter(), 'a'));
  s = resolveGate(s, { stars: 2 });
  assert.equal(s.phase, PHASES.STATION_IDLE);
  assert.equal(s.stars.a, 2);
  assert.equal(s.unlocked.b, true, 'next station unlocked');
  assert.equal(s.unlocked.c, undefined, 'only the immediate next');
});

test('resolveGate keeps the best star score (no regressions)', () => {
  let s = resolveGate(startGate(arriveStation(enter(), 'a')), { stars: 3 });
  // replay the same station with a worse score
  s = arriveStation(s, 'a');
  s = resolveGate(startGate(s), { stars: 1 });
  assert.equal(s.stars.a, 3);
});

test('finishing every station completes the sector', () => {
  let s = enter();
  for (const id of ORDER) {
    s = arriveStation(s, id);
    s = resolveGate(startGate(s), { stars: 3 });
  }
  assert.equal(s.phase, PHASES.SECTOR_COMPLETE);
});

test('openStarChart returns to GALACTIC but keeps progress', () => {
  let s = arriveStation(enter(), 'a');
  s = resolveGate(startGate(s), { stars: 2 }); // a now has stars
  const chart = openStarChart(s);
  assert.equal(chart.phase, PHASES.GALACTIC);
  assert.equal(chart.stationId, null);
  assert.equal(chart.lockedBeacon, null);
  assert.equal(chart.sectorId, 'backyard-sky', 'remembers where we were');
  assert.equal(chart.stars.a, 2, 'stars retained');
});

test('warpTo re-derives unlocked from persisted stars (revisit-safe)', () => {
  // simulate having earned stars on a and b already
  const withStars = { ...initialState(), stars: { a: 3, b: 2 } };
  const s = warpTo(withStars, { sectorId: 'backyard-sky', stationOrder: ORDER });
  assert.equal(s.unlocked.a, true);          // first
  assert.equal(s.unlocked.b, true);          // already earned
  assert.equal(s.unlocked.c, true);          // predecessor (b) earned → unlocked
  assert.equal(s.unlocked.d ?? false, false, 'c not yet done → d stays locked');
});

test('warp between two sectors keeps the first sector\'s stars', () => {
  const store = createGameStore();
  store.actions.warpTo({ sectorId: 's1', stationOrder: ['a', 'b'] });
  store.actions.arriveStation('a');
  store.actions.startGate();
  store.actions.resolveGate({ stars: 3 });
  store.actions.openStarChart();
  store.actions.warpTo({ sectorId: 's2', stationOrder: ['x', 'y'] });
  assert.equal(store.get().sectorId, 's2');
  assert.equal(store.get().stars.a, 3, 'sector 1 progress survives the warp');
  assert.equal(store.get().unlocked.x, true);
});

test('markLearned collects a station and is idempotent', () => {
  const a = markLearned(initialState(), 'moon-phases');
  assert.equal(a.learned['moon-phases'], true);
  assert.equal(markLearned(a, 'moon-phases'), a, 'no change on repeat');
  assert.deepEqual(markLearned(initialState(), null).learned, {}, 'null id is a no-op');
});

test('recordLesson action marks the current station learned', () => {
  const store = createGameStore();
  store.actions.warpTo({ sectorId: 'backyard-sky', stationOrder: ['moon-phases'] });
  store.actions.arriveStation('moon-phases');
  store.actions.recordLesson({ correct: 2, concept: 'moon-phases' });
  assert.equal(store.get().learned['moon-phases'], true);
});

test('store dispatches actions and notifies subscribers', () => {
  const store = createGameStore();
  let hits = 0;
  const unsub = store.subscribe(() => hits++);
  store.actions.warpTo({ sectorId: 'backyard-sky', stationOrder: ORDER });
  store.actions.arriveStation('a');
  store.actions.startGate();
  const final = store.actions.resolveGate({ stars: 3 });
  assert.equal(final.stars.a, 3);
  assert.equal(store.get().unlocked.b, true);
  assert.ok(hits >= 4);
  unsub();
});
