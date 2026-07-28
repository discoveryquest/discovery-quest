import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSyncRequest, buildRosterSyncRequest, syncCourse } from './sync.js';
import { setSaveKey } from './save.js';

const memoryStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
};

test('buildSyncRequest targets the account API per quest/profile with the token', () => {
  const { url, options } = buildSyncRequest({
    baseUrl: 'https://app.discoveryquest.app', quest: 'math', profileId: 'p 1', token: 'T',
    save: { profile: { id: 'p 1' } },
  });
  assert.equal(url, 'https://app.discoveryquest.app/api/save/math/p%201');
  assert.equal(options.method, 'PUT');
  assert.equal(options.headers.authorization, 'Bearer T');
  assert.equal(JSON.parse(options.body).profile.id, 'p 1');
});

test('buildRosterSyncRequest targets /api/roster with the token and profiles only', () => {
  const { url, options } = buildRosterSyncRequest({
    baseUrl: 'https://app.discoveryquest.app', token: 'T',
    reg: { profiles: [{ id: 'p1' }], lastUsedByCourse: { math: 'p1' } },
  });
  assert.equal(url, 'https://app.discoveryquest.app/api/roster');
  assert.equal(options.method, 'PUT');
  assert.equal(options.headers.authorization, 'Bearer T');
  const body = JSON.parse(options.body);
  assert.deepEqual(body.profiles, [{ id: 'p1' }]);
  assert.equal(body.lastUsedByCourse, undefined);
});

test('buildRosterSyncRequest serializes xpByCourse on profiles', () => {
  const { options } = buildRosterSyncRequest({
    baseUrl: 'https://app', token: 'T',
    reg: { profiles: [{ id: 'p1', name: 'Mila', xpByCourse: { math: 300 } }] },
  });
  const body = JSON.parse(options.body);
  assert.deepEqual(body.profiles[0].xpByCourse, { math: 300 });
});

test('syncCourse pulls the roster but does not upload an unselected placeholder save', async () => {
  setSaveKey('lq-save');
  const storage = memoryStorage({
    'dq-profiles': JSON.stringify({ version: 1, profiles: [], lastUsedByCourse: {} }),
    'lq-save': JSON.stringify({ version: 1, profile: { id: 'placeholder' }, stations: {}, settings: {} }),
  });
  const urls = [];
  const result = await syncCourse({
    courseId: 'logic',
    baseUrl: 'https://app',
    getToken: async () => 'T',
    storage,
    fetchImpl: async (url) => {
      urls.push(url);
      return { ok: true, json: async () => ({ version: 1, profiles: [] }) };
    },
  });
  assert.deepEqual(urls, ['https://app/api/roster']);
  assert.equal(result.roster.ok, true);
  assert.equal(result.save.reason, 'no-active-profile');
  setSaveKey('lmq-save');
});

test('syncCourse uploads and persists the selected course save', async () => {
  setSaveKey('sq-save');
  const profile = { id: 'p1', name: 'Mila', avatar: '🚀', xpByCourse: {} };
  const storage = memoryStorage({
    'dq-profiles': JSON.stringify({
      version: 1,
      profiles: [profile],
      lastUsedByCourse: { space: 'p1' },
    }),
    'sq-save': JSON.stringify({
      version: 1,
      profile: { id: 'p1', name: 'Mila', avatar: '🚀' },
      stations: { moon: { stars: 2 } },
      settings: { sound: true, music: true },
    }),
  });
  const urls = [];
  const result = await syncCourse({
    courseId: 'space',
    baseUrl: 'https://app',
    getToken: async () => 'T',
    storage,
    fetchImpl: async (url, options) => {
      urls.push(url);
      if (url.endsWith('/api/roster')) {
        return { ok: true, json: async () => JSON.parse(options.body) };
      }
      const save = JSON.parse(options.body);
      return { ok: true, json: async () => ({ ...save, score: 42 }) };
    },
  });
  assert.deepEqual(urls, ['https://app/api/roster', 'https://app/api/save/space/p1']);
  assert.equal(result.ok, true);
  assert.equal(JSON.parse(storage.getItem('sq-save')).score, 42);
  setSaveKey('lmq-save');
});
