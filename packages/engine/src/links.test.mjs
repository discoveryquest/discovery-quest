import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SITE_HOME_URL, ACCOUNT_DASHBOARD_URL, resolveHomeUrl } from './links.js';
import { setSaveKey, getSaveKey } from './save.js';

test('site home + account URLs are absolute https', () => {
  assert.match(SITE_HOME_URL, /^https:\/\/discoveryquest\.app$/);
  assert.match(ACCOUNT_DASHBOARD_URL, /^https:\/\/app\.discoveryquest\.app$/);
});

test('resolveHomeUrl prefers an explicit override', () => {
  assert.equal(resolveHomeUrl('https://x.test/c'), 'https://x.test/c');
  assert.equal(resolveHomeUrl(''), SITE_HOME_URL);
  assert.equal(resolveHomeUrl(undefined), SITE_HOME_URL);
  assert.equal(resolveHomeUrl(null), SITE_HOME_URL);
});

test('getSaveKey reflects setSaveKey', () => {
  setSaveKey('eq-save');
  assert.equal(getSaveKey(), 'eq-save');
  setSaveKey('lmq-save'); // restore default for other suites
  assert.equal(getSaveKey(), 'lmq-save');
});
