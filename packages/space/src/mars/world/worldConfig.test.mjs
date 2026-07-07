import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWorldConfig } from './worldConfig.js';

const valid = {
  id: 'mars', name: 'Mars',
  gravity: 3.72, earthGravity: 9.81,
  temperatureC: -60,
  sky: { top: '#d7a06a', horizon: '#e8c9a0', sunColor: '#fff3e0' },
  wind: { seed: 7, baseSpeed: 4, gustSpeed: 14 },
  assets: { panorama: '/mars/panorama.jpg', ground: '/mars/regolith.jpg', rover: '/mars/perseverance.glb' },
  ambientTrack: 'mars-wind',
};

test('accepts a complete config', () => {
  assert.deepEqual(validateWorldConfig(valid), { ok: true, errors: [] });
});

test('flags a missing gravity', () => {
  const bad = { ...valid }; delete bad.gravity;
  const res = validateWorldConfig(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('gravity')));
});

test('flags a non-numeric temperature', () => {
  const res = validateWorldConfig({ ...valid, temperatureC: 'cold' });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('temperatureC')));
});

test('flags missing asset urls', () => {
  const res = validateWorldConfig({ ...valid, assets: { panorama: '/x' } });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('assets.ground')));
  assert.ok(res.errors.some((e) => e.includes('assets.rover')));
});

// R1: range / logic checks — this validator is the safety rail for Moon later.
test('flags gravity >= earthGravity (should be a fraction of Earth)', () => {
  const res = validateWorldConfig({ ...valid, gravity: 12 });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('gravity')));
});
test('flags implausible temperature', () => {
  assert.equal(validateWorldConfig({ ...valid, temperatureC: -999 }).ok, false);
});
test('flags gustSpeed < baseSpeed', () => {
  const res = validateWorldConfig({ ...valid, wind: { seed: 1, baseSpeed: 10, gustSpeed: 2 } });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('wind.gustSpeed')));
});
test('flags a non-same-origin asset path', () => {
  const res = validateWorldConfig({ ...valid, assets: { ...valid.assets, ground: 'https://evil/x.jpg' } });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('assets.ground')));
});
