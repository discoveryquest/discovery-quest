import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSyncRequest } from './sync.js';

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
