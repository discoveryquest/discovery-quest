import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emojiToCodepoints } from '../src/emojiCodepoints.js';

test('single-codepoint emoji → uppercase hex', () => {
  assert.equal(emojiToCodepoints('💪'), '1F4AA');
  assert.equal(emojiToCodepoints('🤝'), '1F91D');
  assert.equal(emojiToCodepoints('🎭'), '1F3AD');
});

test('strips the FE0F variation selector (OpenMoji filenames omit it)', () => {
  assert.equal(emojiToCodepoints('⬅️'), '2B05'); // 2B05 FE0F
  assert.equal(emojiToCodepoints('➡️'), '27A1'); // 27A1 FE0F
});

test('multi-codepoint sequence → hyphen-joined', () => {
  assert.equal(emojiToCodepoints('🇺🇸'), '1F1FA-1F1F8'); // regional indicators
});

test('empty / non-string input → empty string (lets caller fall back)', () => {
  assert.equal(emojiToCodepoints(''), '');
  assert.equal(emojiToCodepoints(undefined), '');
  assert.equal(emojiToCodepoints(null), '');
});
