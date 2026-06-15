import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genPictureMatch, genVocabListen } from '../src/vocab.js';

const items = [
  { word: 'cat', emoji: '🐱', ru: 'кошка' },
  { word: 'dog', emoji: '🐶', ru: 'собака' },
  { word: 'cow', emoji: '🐮', ru: 'корова' },
  { word: 'fish', emoji: '🐟', ru: 'рыба' },
  { word: 'frog', emoji: '🐸', ru: 'лягушка' },
];

test('genPictureMatch draws from injected items, carries emoji+ru, 4 choices', () => {
  const p = genPictureMatch(items, { band: 0, lowercase: true });
  assert.ok(items.some((i) => i.word === p.word));
  assert.equal(p.emoji, items.find((i) => i.word === p.word).emoji);
  assert.equal(p.ru, items.find((i) => i.word === p.word).ru);
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].choices.includes(p.word));
  assert.equal(p.steps[0].lower, true);
  assert.equal(p.steps[0].expected, p.word);
});

test('lowercase falls back to band>=2 when ctx.lowercase is undefined', () => {
  assert.equal(genPictureMatch(items, { band: 0 }).steps[0].lower, false);
  assert.equal(genPictureMatch(items, { band: 2 }).steps[0].lower, true);
});

test('genVocabListen draws from injected items + has playLabel', () => {
  const p = genVocabListen(items, { band: 0, lowercase: true });
  assert.ok(items.some((i) => i.word === p.word));
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].playLabel);
});
