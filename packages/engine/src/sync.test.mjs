import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSyncRequest } from './sync.js';
import { buildRosterSyncRequest } from './sync.js';

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
