import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genSentenceRu } from '../src/sentencesRu.js';

const items = [
  { en: 'I see a cat.', ru: 'Я вижу кошку.' },
  { en: 'The dog can run.', ru: 'Собака умеет бегать.' },
  { en: 'We go to bed.', ru: 'Мы идём спать.' },
];

test('genSentenceRu draws an item, scrambles its en words into tokens, kind=sentenceRu', () => {
  for (let i = 0; i < 30; i++) {
    const p = genSentenceRu(items);
    assert.equal(p.kind, 'sentenceRu');
    const it = items.find((x) => x.en === p.word);
    assert.ok(it, `word must be one of the injected en sentences, got "${p.word}"`);
    const step = p.steps[0];
    // tokens are exactly the en sentence's words (order-independent: scrambled)
    assert.deepEqual([...step.tokens].sort(), it.en.split(' ').sort());
    assert.equal(step.tokens.join(' ').split(' ').length, it.en.split(' ').length);
    assert.equal(step.expected, it.en);
    assert.equal(p.result, it.en);
    // prompt carries the native-language meaning
    assert.ok(step.prompt.includes(it.ru), `prompt must contain ru, got "${step.prompt}"`);
    assert.equal(step.tokenAudio, true);
    assert.equal(step.inputKind, 'build');
    assert.equal(step.lower, true);
  }
});

test('genSentenceRu sets localized placeholder + readsLabel for the SentenceBuilder board', () => {
  const p = genSentenceRu(items);
  assert.equal(p.steps[0].placeholder, 'нажимай на слова…');
  assert.equal(p.steps[0].readsLabel, 'Получилось:');
});
