import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistry, seedFromSaves, defaultRegistry } from './profiles.js';
import { resolveActiveProfile, createProfile, setActiveProfile, editProfile } from './profiles.js';

function mem(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('loadRegistry returns a default empty registry when none stored', () => {
  const reg = loadRegistry(mem());
  assert.equal(reg.version, 1);
  assert.deepEqual(reg.profiles, []);
  assert.deepEqual(reg.lastUsedByCourse, {});
});

test('seedFromSaves builds the roster from existing per-course saves (dedup by id)', () => {
  const storage = mem({
    'lmq-save': JSON.stringify({ profile: { id: 'p1', name: 'Mila', avatar: '🦊', age: 7 } }),
    'eru-save': JSON.stringify({ profile: { id: 'p1', name: 'Mila', avatar: '🦊', age: 7 } }),
    'eq-save':  JSON.stringify({ profile: { id: 'p2', name: 'Sam',  avatar: '🚀', age: 6 } }),
  });
  const reg = seedFromSaves(storage, [
    { key: 'lmq-save', courseId: 'math' },
    { key: 'eru-save', courseId: 'english-ru' },
    { key: 'eq-save',  courseId: 'english' },
  ]);
  assert.equal(reg.profiles.length, 2); // p1 deduped across math + EFL
  assert.equal(reg.lastUsedByCourse.math, 'p1');
  assert.equal(reg.lastUsedByCourse['english-ru'], 'p1');
  assert.equal(reg.lastUsedByCourse.english, 'p2');
});

test('seedFromSaves skips auto-minted saves with no chosen name (no phantom profiles)', () => {
  const storage = mem({
    'lmq-save': JSON.stringify({ profile: { id: 'auto', name: null, avatar: '🦊' } }), // fresh, never onboarded
    'eq-save':  JSON.stringify({ profile: { id: 'real', name: 'Sam', avatar: '🚀', age: 6 } }),
  });
  const reg = seedFromSaves(storage, [
    { key: 'lmq-save', courseId: 'math' },
    { key: 'eq-save',  courseId: 'english' },
  ]);
  assert.equal(reg.profiles.length, 1);
  assert.equal(reg.profiles[0].id, 'real');
  assert.equal(reg.lastUsedByCourse.math, undefined); // nameless save not remembered
  assert.equal(reg.lastUsedByCourse.english, 'real');
});

test('resolveActiveProfile: empty registry → setup', () => {
  assert.deepEqual(resolveActiveProfile('math', defaultRegistry()), { mode: 'setup' });
});

test('resolveActiveProfile: remembered course → game with that id', () => {
  const reg = { ...defaultRegistry(), profiles: [{ id: 'p1' }], lastUsedByCourse: { math: 'p1' } };
  assert.deepEqual(resolveActiveProfile('math', reg), { mode: 'game', profileId: 'p1' });
});

test('resolveActiveProfile: profiles exist but none for this course → picker', () => {
  const reg = { ...defaultRegistry(), profiles: [{ id: 'p1' }], lastUsedByCourse: { english: 'p1' } };
  assert.deepEqual(resolveActiveProfile('math', reg), { mode: 'picker' });
});

test('resolveActiveProfile: remembered id no longer in roster → picker', () => {
  const reg = { ...defaultRegistry(), profiles: [{ id: 'p2' }], lastUsedByCourse: { math: 'gone' } };
  assert.deepEqual(resolveActiveProfile('math', reg), { mode: 'picker' });
});

test('createProfile adds to roster, sets lastUsed, mirrors into the course save', () => {
  const storage = mem({ 'lmq-save': JSON.stringify({ profile: { id: 'old' } }) });
  const { reg, profile } = createProfile(storage, {
    courseId: 'math', saveKey: 'lmq-save',
    fields: { name: 'Mila', avatar: '🦊', age: 7 },
  });
  assert.equal(reg.profiles.length, 1);
  assert.equal(reg.lastUsedByCourse.math, profile.id);
  assert.equal(JSON.parse(storage.getItem('lmq-save')).profile.id, profile.id);
  assert.equal(JSON.parse(storage.getItem('lmq-save')).profile.name, 'Mila');
});

test('setActiveProfile points a course at an existing profile and mirrors identity', () => {
  const storage = mem({ 'eru-save': JSON.stringify({ profile: { id: 'x' }, stations: { s: { stars: 1 } } }) });
  let reg = { ...defaultRegistry(), profiles: [{ id: 'p1', name: 'Mila', avatar: '🦊', age: 7 }] };
  reg = setActiveProfile(storage, { reg, courseId: 'english-ru', saveKey: 'eru-save', profileId: 'p1' });
  assert.equal(reg.lastUsedByCourse['english-ru'], 'p1');
  const save = JSON.parse(storage.getItem('eru-save'));
  assert.equal(save.profile.id, 'p1');
  assert.equal(save.profile.name, 'Mila');
  assert.deepEqual(save.stations, { s: { stars: 1 } }); // progress untouched
});

test('editProfile updates the roster entry, bumps updatedAt, refreshes active mirror', () => {
  const storage = mem({ 'lmq-save': JSON.stringify({ profile: { id: 'p1', name: 'Mila', avatar: '🦊' } }) });
  let reg = { ...defaultRegistry(), profiles: [{ id: 'p1', name: 'Mila', avatar: '🦊', age: 7, updatedAt: 1 }] };
  reg = editProfile(storage, { reg, saveKey: 'lmq-save', profileId: 'p1', fields: { avatar: '🐼' } });
  assert.equal(reg.profiles[0].avatar, '🐼');
  assert.ok(reg.profiles[0].updatedAt > 1);
  assert.equal(JSON.parse(storage.getItem('lmq-save')).profile.avatar, '🐼');
});

import { mergeRoster } from './profiles.js';

test('mergeRoster unions profiles by id', () => {
  const a = { profiles: [{ id: 'p1', name: 'Mila', updatedAt: 5 }] };
  const b = { profiles: [{ id: 'p2', name: 'Sam', updatedAt: 5 }] };
  const m = mergeRoster(a, b);
  assert.deepEqual(m.profiles.map((p) => p.id).sort(), ['p1', 'p2']);
});

test('mergeRoster resolves field conflicts by updatedAt (newer wins)', () => {
  const a = { profiles: [{ id: 'p1', name: 'Old', avatar: '🦊', updatedAt: 1 }] };
  const b = { profiles: [{ id: 'p1', name: 'New', avatar: '🐼', updatedAt: 9 }] };
  assert.equal(mergeRoster(a, b).profiles[0].name, 'New');
  assert.equal(mergeRoster(b, a).profiles[0].name, 'New'); // order-independent
});

test('mergeRoster ignores lastUsedByCourse (device-local)', () => {
  const a = { profiles: [], lastUsedByCourse: { math: 'p1' } };
  const b = { profiles: [], lastUsedByCourse: { math: 'p2' } };
  assert.equal(mergeRoster(a, b).lastUsedByCourse, undefined);
});

test('mergeRoster tolerates null inputs', () => {
  assert.deepEqual(mergeRoster(null, { profiles: [{ id: 'p1' }] }).profiles, [{ id: 'p1' }]);
  assert.deepEqual(mergeRoster({ profiles: [{ id: 'p1' }] }, null).profiles, [{ id: 'p1' }]);
});

test('mergeRoster merges xpByCourse per-key by max (not clobbered by LWW spread)', () => {
  const a = { profiles: [{ id: 'p1', name: 'Old', updatedAt: 1, xpByCourse: { math: 300, english: 50 } }] };
  const b = { profiles: [{ id: 'p1', name: 'New', updatedAt: 9, xpByCourse: { math: 100, 'english-ru': 70 } }] };
  const m = mergeRoster(a, b).profiles[0];
  assert.equal(m.name, 'New');               // identity LWW (newer)
  assert.deepEqual(m.xpByCourse, { math: 300, english: 50, 'english-ru': 70 }); // per-key max + union
});

test('mergeRoster xpByCourse is order-independent + idempotent', () => {
  const a = { profiles: [{ id: 'p1', updatedAt: 1, xpByCourse: { math: 300 } }] };
  const b = { profiles: [{ id: 'p1', updatedAt: 9, xpByCourse: { math: 100 } }] };
  assert.equal(mergeRoster(a, b).profiles[0].xpByCourse.math, 300);
  assert.equal(mergeRoster(b, a).profiles[0].xpByCourse.math, 300);
  assert.equal(mergeRoster(mergeRoster(a, b), b).profiles[0].xpByCourse.math, 300);
});

test('mergeRoster: a lone xpByCourse (first-seen id) passes through', () => {
  const a = { profiles: [{ id: 'p1', xpByCourse: { math: 42 } }] };
  assert.deepEqual(mergeRoster(a, { profiles: [] }).profiles[0].xpByCourse, { math: 42 });
});
