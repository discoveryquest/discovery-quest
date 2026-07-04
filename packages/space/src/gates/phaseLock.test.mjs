import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targetAngle, angularError, phaseForAngle, scorePhase, phaseByName } from './phaseLock.js';

test('targetAngle maps known phases, defaults unknown to 0', () => {
  assert.equal(targetAngle('full'), 180);
  assert.equal(targetAngle('first-quarter'), 90);
  assert.equal(targetAngle('nope'), 0);
  assert.equal(phaseByName('nope'), null);
});

test('angularError is the shortest distance and wraps around 360', () => {
  assert.equal(angularError(90, 90), 0);
  assert.equal(angularError(0, 180), 180);
  assert.equal(angularError(350, 10), 20);
  assert.equal(angularError(10, 350), 20);
});

test('phaseForAngle snaps to the nearest named phase', () => {
  assert.equal(phaseForAngle(178).name, 'full');
  assert.equal(phaseForAngle(44).name, 'waxing-crescent');
  assert.equal(phaseForAngle(2).name, 'new');
  assert.equal(phaseForAngle(358).name, 'new');
});

test('scorePhase awards stars by closeness', () => {
  assert.deepEqual(scorePhase('full', 180), { error: 0, stars: 3 });
  assert.equal(scorePhase('full', 168).stars, 3);   // 12° off → still 3
  assert.equal(scorePhase('full', 205).stars, 2);   // 25° off → 2
  assert.equal(scorePhase('full', 140).stars, 1);   // 40° off → 1
  assert.equal(scorePhase('full', 100).stars, 0);   // 80° off → miss
});
