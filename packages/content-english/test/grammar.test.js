import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genWordSort, genBuildSentence, genPunctuation } from '../src/grammar.js';

const bank = {
  nouns: ['cat', 'dog', 'sun', 'hat'],
  verbs: ['run', 'jump', 'sit', 'hop'],
  adjectives: ['big', 'small', 'hot', 'cold'],
};

test('genWordSort picks target from the role collection (singular→plural map), 4 choices', () => {
  const p = genWordSort('noun', bank, { band: 0, lowercase: true });
  assert.equal(p.kind, 'grammarSort');
  assert.equal(p.category, 'noun');
  assert.ok(bank.nouns.includes(p.word));
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].choices.includes(p.word));
  assert.equal(p.steps[0].expected, p.word);
  assert.equal(p.steps[0].lower, true);
  // distractors come from the OTHER roles only
  const others = [...bank.verbs, ...bank.adjectives];
  for (const c of p.steps[0].choices) {
    if (c !== p.word) assert.ok(others.includes(c), `${c} should be a distractor`);
  }
});

test('genWordSort works for verb and adjective categories', () => {
  assert.ok(bank.verbs.includes(genWordSort('verb', bank, { band: 0 }).word));
  assert.ok(bank.adjectives.includes(genWordSort('adjective', bank, { band: 0 }).word));
});

test('genWordSort lowercase falls back to band>=2', () => {
  assert.equal(genWordSort('noun', bank, { band: 0 }).steps[0].lower, false);
  assert.equal(genWordSort('noun', bank, { band: 2 }).steps[0].lower, true);
});

const sentences = ['The cat is big.', 'I see a dog.', 'The sun is hot.'];

test('genBuildSentence draws from injected items, scrambles tokens', () => {
  const p = genBuildSentence(sentences, {});
  assert.equal(p.kind, 'sentence');
  assert.ok(sentences.includes(p.word));
  assert.equal(p.steps[0].inputKind, 'build');
  assert.equal(p.steps[0].tokens.length, p.word.split(' ').length);
  assert.equal(p.steps[0].expected, p.word);
});

const cores = ['the cat is big', 'i see a dog', 'the sun is hot'];

test('genPunctuation draws from injected items, correct is capital+period, 4 choices', () => {
  const p = genPunctuation(cores, {});
  assert.equal(p.kind, 'punctuation');
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].choices.includes(p.word));
  assert.equal(p.steps[0].expected, p.word);
  assert.match(p.word, /^[A-Z].*\.$/);
});
