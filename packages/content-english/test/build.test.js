import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genWordBuild } from '../src/build.js';

const items = [
  { rule: 'add -ed for the past', prompt: 'Make it past tense', parts: ['walk', 'ed'], distractors: ['ing', 's'], answer: 'walked' },
  { rule: 'un- means not', prompt: 'Build the word that means "not happy"', parts: ['un', 'happy'], distractors: ['re', 'ly'], answer: 'unhappy' },
  { rule: '-er compares two things', prompt: 'Make it mean "more big"', parts: ['big', 'ger'], distractors: ['est', 's'], answer: 'bigger' },
];

test('genWordBuild draws from injected items, kind=wordBuild', () => {
  const p = genWordBuild(items, { band: 0 });
  assert.equal(p.kind, 'wordBuild');
  assert.ok(items.some((i) => i.answer === p.word));
});

test('expected === answer; tokens include every part; tokens = parts + distractors; joinWith empty', () => {
  for (let i = 0; i < 30; i++) {
    const p = genWordBuild(items, { band: 0 });
    const item = items.find((it) => it.answer === p.word);
    const step = p.steps[0];
    assert.ok(item, `word must be an injected answer, got "${p.word}"`);
    assert.equal(step.expected, item.answer);
    for (const part of item.parts) assert.ok(step.tokens.includes(part), `tokens must include part "${part}"`);
    assert.equal(step.tokens.length, item.parts.length + item.distractors.length);
    assert.equal(step.joinWith, '');
    // the correct parts, joined in order, equal the answer
    assert.equal(item.parts.join(''), item.answer);
  }
});

test('steps[0].rule is set (the reminder the board shows)', () => {
  const p = genWordBuild(items, { band: 0 });
  const item = items.find((it) => it.answer === p.word);
  assert.ok(p.steps[0].rule);
  assert.equal(p.steps[0].rule, item.rule);
});
