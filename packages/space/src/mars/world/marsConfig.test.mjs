import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marsConfig } from './marsConfig.js';
import { validateWorldConfig } from './worldConfig.js';

test('marsConfig is a valid WorldConfig', () => {
  assert.deepEqual(validateWorldConfig(marsConfig), { ok: true, errors: [] });
});
test('mars gravity is ~0.38 g', () => {
  assert.ok(Math.abs(marsConfig.gravity / marsConfig.earthGravity - 0.38) < 0.01);
});
