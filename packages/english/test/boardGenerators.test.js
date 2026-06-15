import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_GENERATORS } from '../src/boardGenerators.js';
import { BOARD_META } from '../src/boardMeta.js';

test('generators cover the EFL board kinds and match BOARD_META content', () => {
  for (const kind of ['pictureMatch', 'vocabListen']) {
    const e = BOARD_GENERATORS[kind];
    assert.ok(e, `missing entry: ${kind}`);
    assert.equal(typeof e.generate, 'function');
    assert.equal(e.content, BOARD_META[kind].content); // both 'vocab'
  }
});

test('a generator runs against injected items', () => {
  const items = [{ word: 'cat', emoji: '🐱', ru: 'кошка' }, { word: 'dog', emoji: '🐶', ru: 'собака' }];
  const p = BOARD_GENERATORS.pictureMatch.generate(items, { band: 0, lowercase: true });
  assert.ok(items.some((i) => i.word === p.word));
});
