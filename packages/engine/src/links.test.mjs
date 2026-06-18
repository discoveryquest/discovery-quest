import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSES_CATALOG_URL, ACCOUNT_DASHBOARD_URL, resolveCatalogUrl } from './links.js';
import { setSaveKey, getSaveKey } from './save.js';

test('catalog + account URLs are absolute https', () => {
  assert.match(COURSES_CATALOG_URL, /^https:\/\/discoveryquest\.app\/courses$/);
  assert.match(ACCOUNT_DASHBOARD_URL, /^https:\/\/app\.discoveryquest\.app$/);
});

test('resolveCatalogUrl prefers an explicit override', () => {
  assert.equal(resolveCatalogUrl('https://x.test/c'), 'https://x.test/c');
  assert.equal(resolveCatalogUrl(''), COURSES_CATALOG_URL);
  assert.equal(resolveCatalogUrl(undefined), COURSES_CATALOG_URL);
  assert.equal(resolveCatalogUrl(null), COURSES_CATALOG_URL);
});

test('getSaveKey reflects setSaveKey', () => {
  setSaveKey('eq-save');
  assert.equal(getSaveKey(), 'eq-save');
  setSaveKey('lmq-save'); // restore default for other suites
  assert.equal(getSaveKey(), 'lmq-save');
});
