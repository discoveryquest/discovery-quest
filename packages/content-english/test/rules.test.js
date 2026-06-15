import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genRuleQuiz } from '../src/rules.js';

const rules = [
  { rule: 'i before e, except after c', question: 'Which is correct?', answer: 'receive', distractors: ['recieve'] },
  { rule: 'Magic E makes the vowel say its name', question: 'Which spells the long-a word?', answer: 'cape', distractors: ['cap', 'capp'] },
  { rule: 'Bossy R: the r changes the vowel sound', question: 'Which word has the er sound?', answer: 'bird', distractors: ['bid', 'bed'] },
];

test('genRuleQuiz draws from injected items, kind=ruleQuiz', () => {
  const p = genRuleQuiz(rules, { band: 0 });
  assert.equal(p.kind, 'ruleQuiz');
  assert.ok(rules.some((i) => i.answer === p.word));
});

test('choices include the answer (>= 2) and expected === answer', () => {
  for (let i = 0; i < 30; i++) {
    const p = genRuleQuiz(rules, { band: 0 });
    const item = rules.find((r) => r.answer === p.word);
    assert.ok(item, `word must be an injected answer, got "${p.word}"`);
    assert.ok(p.steps[0].choices.length >= 2);
    assert.ok(p.steps[0].choices.includes(p.word));
    assert.equal(p.steps[0].choices.length, 1 + item.distractors.length);
    assert.equal(p.steps[0].expected, item.answer);
  }
});

test('steps[0].rule is set (the mnemonic the board shows)', () => {
  const p = genRuleQuiz(rules, { band: 0 });
  const item = rules.find((r) => r.answer === p.word);
  assert.ok(p.steps[0].rule);
  assert.equal(p.steps[0].rule, item.rule);
});
