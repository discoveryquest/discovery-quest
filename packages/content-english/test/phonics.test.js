import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genSoundToLetter, genBlend, genWordFamily, genDigraph } from '../src/phonics.js';

const phonemes = [
  { letter: 's', sound: '/s/', word: 'sun', band: 0 },
  { letter: 'a', sound: '/a/', word: 'ant', band: 0 },
  { letter: 't', sound: '/t/', word: 'top', band: 0 },
  { letter: 'p', sound: '/p/', word: 'pig', band: 0 },
  { letter: 'i', sound: '/i/', word: 'igloo', band: 0 },
];

test('genSoundToLetter draws from injected items, derives audioPrompt key, 4 choices', () => {
  const p = genSoundToLetter(phonemes, { band: 0, lowercase: true });
  assert.ok(phonemes.some((i) => i.letter === p.letter));
  assert.equal(p.kind, 'soundToLetter');
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].choices.includes(p.letter));
  assert.equal(p.steps[0].audioPrompt, `phon-${p.letter}`);
  assert.equal(p.steps[0].sayQ[1], `phon-${p.letter}`);
  assert.equal(p.steps[0].lower, true);
  assert.equal(p.steps[0].expected, p.letter);
});

test('genSoundToLetter lowercase falls back to band>=2 when ctx.lowercase undefined', () => {
  assert.equal(genSoundToLetter(phonemes, { band: 0 }).steps[0].lower, false);
  assert.equal(genSoundToLetter(phonemes, { band: 2 }).steps[0].lower, true);
});

const blendItems = [
  { word: 'sat', band: 0 }, { word: 'pin', band: 0 }, { word: 'tap', band: 0 }, { word: 'nap', band: 0 },
];

test('genBlend draws from injected items, builds tiles, kind=blendWord', () => {
  const p = genBlend(blendItems, { band: 0, lowercase: true });
  assert.ok(blendItems.some((i) => i.word === p.word));
  assert.equal(p.kind, 'blendWord');
  assert.equal(p.steps[0].inputKind, 'build');
  assert.equal(p.steps[0].tiles.length, p.word.length);
  assert.equal(p.steps[0].lower, true);
  assert.equal(p.steps[0].expected, p.word);
});

test('genBlend lowercase falls back to band>=2', () => {
  assert.equal(genBlend(blendItems, { band: 0 }).steps[0].lower, false);
  assert.equal(genBlend(blendItems, { band: 2 }).steps[0].lower, true);
});

const families = [
  { rime: 'at', words: ['cat', 'hat', 'mat', 'sat', 'rat'], band: 0 },
  { rime: 'an', words: ['can', 'pan', 'fan', 'man', 'ran'], band: 0 },
];

test('genWordFamily draws from injected items, onset choices, kind=wordFamily', () => {
  const p = genWordFamily(families, { band: 0, lowercase: true });
  assert.ok(families.some((f) => f.words.includes(p.word)));
  assert.equal(p.kind, 'wordFamily');
  assert.ok(p.steps[0].choices.includes(p.word[0]));
  assert.equal(p.steps[0].expected, p.word[0]);
  assert.equal(p.steps[0].lower, true);
});

test('genWordFamily lowercase falls back to band>=2', () => {
  assert.equal(genWordFamily(families, { band: 0 }).steps[0].lower, false);
  assert.equal(genWordFamily(families, { band: 2 }).steps[0].lower, true);
});

const digraphs = [
  { team: 'sh', sound: '/sh/', word: 'ship' },
  { team: 'ch', sound: '/ch/', word: 'chip' },
  { team: 'th', sound: '/th/', word: 'thumb' },
  { team: 'ck', sound: '/k/', word: 'duck' },
];

test('genDigraph draws from injected items, team choices, derives audioPrompt key', () => {
  const p = genDigraph(digraphs, {});
  assert.ok(digraphs.some((d) => d.team === p.letter));
  assert.equal(p.kind, 'soundToLetter');
  assert.equal(p.steps[0].choices.length, digraphs.length);
  assert.ok(p.steps[0].choices.includes(p.letter));
  assert.equal(p.steps[0].audioPrompt, `phon-${p.letter}`);
  assert.equal(p.steps[0].expected, p.letter);
});
