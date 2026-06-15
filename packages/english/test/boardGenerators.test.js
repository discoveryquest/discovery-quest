import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_GENERATORS } from '../src/boardGenerators.js';
import { BOARD_META } from '../src/boardMeta.js';

// All 18 English Quest board kinds must be present.
const ALL_KINDS = Object.keys(BOARD_META);

test('BOARD_GENERATORS covers every kind in BOARD_META', () => {
  for (const kind of ALL_KINDS) {
    assert.ok(BOARD_GENERATORS[kind], `missing entry: ${kind}`);
  }
});

test('every generator has a function and content matching BOARD_META', () => {
  for (const kind of ALL_KINDS) {
    const e = BOARD_GENERATORS[kind];
    assert.ok(e, `missing entry: ${kind}`);
    assert.equal(typeof e.generate, 'function', `${kind}.generate must be a function`);
    assert.deepEqual(e.content, BOARD_META[kind].content, `${kind}.content mismatch`);
  }
});

test('a generator runs against injected items — pictureMatch', () => {
  const items = [{ word: 'cat', emoji: '🐱', ru: 'кошка' }, { word: 'dog', emoji: '🐶', ru: 'собака' }];
  const p = BOARD_GENERATORS.pictureMatch.generate(items, { band: 0, lowercase: true });
  assert.ok(items.some((i) => i.word === p.word));
});

test('a generator runs against injected items — soundToLetter', () => {
  const items = [
    { letter: 's', key: 'phon-s', sound: '/s/', word: 'sun' },
    { letter: 'a', key: 'phon-a', sound: '/a/', word: 'ant' },
    { letter: 't', key: 'phon-t', sound: '/t/', word: 'top' },
    { letter: 'p', key: 'phon-p', sound: '/p/', word: 'pig' },
  ];
  const p = BOARD_GENERATORS.soundToLetter.generate(items, { band: 0 });
  assert.ok(items.some((i) => i.letter === p.letter));
});

test('a generator runs against injected items — sameOpp (multi-collection)', () => {
  const content = {
    synonyms: [{ word: 'big', match: 'large' }, { word: 'happy', match: 'glad' }],
    antonyms: [{ word: 'big', match: 'small' }, { word: 'hot', match: 'cold' }],
  };
  const p = BOARD_GENERATORS.sameOpp.generate(content, { band: 0 });
  assert.ok(p.word);
  assert.ok(Array.isArray(p.steps) && p.steps.length > 0);
});

test('a generator runs against injected items — grammarNoun', () => {
  const items = { nouns: ['cat', 'dog'], verbs: ['run', 'jump'], adjectives: ['big', 'small'] };
  const p = BOARD_GENERATORS.grammarNoun.generate(items, { band: 0 });
  assert.ok(items.nouns.includes(p.word), `expected a noun, got "${p.word}"`);
});

test('a generator runs against injected items — firstReader', () => {
  const items = [{ story: 'The cat is on the mat.', q: 'cat', d: ['mat', 'hat', 'map'] }];
  const p = BOARD_GENERATORS.firstReader.generate(items, { band: 0 });
  assert.equal(p.word, 'cat');
});

test('a generator runs against injected items — mainIdea', () => {
  const items = [{ story: 'The cat sat.', q: 'rq-main', text: 'What is the story about?', a: 'cat', d: ['dog', 'sun'] }];
  const p = BOARD_GENERATORS.mainIdea.generate(items, { band: 0 });
  assert.equal(p.steps[0].chip.label, 'Main Idea');
  assert.equal(p.steps[0].chip.color, '#F9A8D4');
});

test('a generator runs against injected items — findDetail', () => {
  const items = [{ story: 'The cat is on the mat.', q: 'rq-where-cat', text: 'Where is the cat?', a: 'mat', d: ['box', 'bed'] }];
  const p = BOARD_GENERATORS.findDetail.generate(items, { band: 0 });
  assert.equal(p.steps[0].chip.label, 'Find the Detail');
  assert.equal(p.steps[0].chip.color, '#F9A8D4');
});

test('a generator runs against injected items — inference', () => {
  const items = [{ story: 'The dog can run.', q: 'rq-feel-dog', text: 'How does the dog feel?', a: 'happy', d: ['sad', 'mad'] }];
  const p = BOARD_GENERATORS.inference.generate(items, { band: 0 });
  assert.equal(p.steps[0].chip.label, 'Inference');
  assert.equal(p.steps[0].chip.color, '#E879F9');
});
