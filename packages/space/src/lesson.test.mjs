import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreQuiz } from './lesson.js';

const QS = [
  { prompt: 'q1', options: ['a', 'b'], answer: 'a' },
  { prompt: 'q2', options: ['c', 'd'], answer: 'd' },
];

test('all correct', () => {
  assert.deepEqual(scoreQuiz(QS, { 0: 'a', 1: 'd' }), { correct: 2, total: 2, allCorrect: true });
});

test('partial', () => {
  const r = scoreQuiz(QS, { 0: 'a', 1: 'c' });
  assert.equal(r.correct, 1);
  assert.equal(r.allCorrect, false);
});

test('none answered', () => {
  assert.deepEqual(scoreQuiz(QS, {}), { correct: 0, total: 2, allCorrect: false });
});

test('empty quiz is not allCorrect', () => {
  assert.deepEqual(scoreQuiz([], {}), { correct: 0, total: 0, allCorrect: false });
});
