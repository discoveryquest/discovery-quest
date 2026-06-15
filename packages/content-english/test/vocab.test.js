import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genPictureMatch, genVocabListen, genSightWords, genSameOpposite, genContextClues } from '../src/vocab.js';

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

const sight = ['the', 'and', 'is', 'you', 'to', 'see'];

test('genSightWords draws from injected string items, 4 choices, kind=sightWord', () => {
  const p = genSightWords(sight, { band: 0, lowercase: true });
  assert.equal(p.kind, 'sightWord');
  assert.ok(sight.includes(p.word));
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].choices.includes(p.word));
  assert.equal(p.steps[0].expected, p.word);
  assert.equal(p.steps[0].lower, true);
});

test('genSightWords lowercase falls back to band>=2', () => {
  assert.equal(genSightWords(sight, { band: 0 }).steps[0].lower, false);
  assert.equal(genSightWords(sight, { band: 2 }).steps[0].lower, true);
});

const synonyms = [['big', 'large'], ['happy', 'glad'], ['small', 'little']];
const antonyms = [['big', 'small'], ['hot', 'cold'], ['up', 'down']];

test('genSameOpposite takes {synonyms, antonyms}, correct from chosen mode, kind=sameOpp', () => {
  const allWords = [...new Set([...synonyms, ...antonyms].flat())];
  for (let i = 0; i < 30; i++) {
    const p = genSameOpposite({ synonyms, antonyms }, { band: 0, lowercase: true });
    assert.equal(p.kind, 'sameOpp');
    const pairs = p.mode === 'same' ? synonyms : antonyms;
    // target+correct must be a pair (in either order) from the chosen mode's collection
    assert.ok(pairs.some(([a, b]) => (a === p.target && b === p.word) || (b === p.target && a === p.word)));
    assert.equal(p.steps[0].choices.length, 4);
    assert.ok(p.steps[0].choices.includes(p.word));
    // distractors drawn from union of both collections
    for (const c of p.steps[0].choices) assert.ok(allWords.includes(c));
    assert.equal(p.steps[0].lower, true);
  }
});

test('genSameOpposite lowercase falls back to band>=2', () => {
  assert.equal(genSameOpposite({ synonyms, antonyms }, { band: 0 }).steps[0].lower, false);
  assert.equal(genSameOpposite({ synonyms, antonyms }, { band: 2 }).steps[0].lower, true);
});

const context = [
  { s: 'I sleep in my ___.', a: 'bed', d: ['cup', 'bus', 'fish'] },
  { s: 'The ___ shines.', a: 'sun', d: ['bed', 'cat', 'box'] },
];

test('genContextClues draws from injected items, kind=contextClue, 4 choices', () => {
  const p = genContextClues(context, { band: 0 });
  assert.equal(p.kind, 'contextClue');
  assert.ok(context.some((i) => i.a === p.word));
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].choices.includes(p.word));
  assert.equal(p.steps[0].expected, p.word);
});
