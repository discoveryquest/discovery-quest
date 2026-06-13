// Catalog metadata for English CONTENT collections — the authored data lists a course supplies
// under `content:`, which the board generators consume. gen-capabilities puts these in the
// manifest and gen-schema turns each into a validator for the items in that collection, so a
// contributor adding e.g. a vocab entry that's missing its emoji is caught by `course:check`.
// `collection` says how the items are shaped:
//   'objects'  → an array of objects (each item matches `item` fields)
//   'strings'  → a flat array of strings (`example` shows one)
//   'wordbank' → a single object with `fields` (e.g. { note, words: [...] })
export const CONTENT_META = {
  phonemes: {
    description: 'Letter → its sound and an example word. Feeds the sound-to-letter board and phoneme lessons.',
    collection: 'objects',
    item: [
      { name: 'letter', type: 'string', required: true, example: 's' },
      { name: 'sound', type: 'string', required: true, example: '/s/' },
      { name: 'word', type: 'string', required: true, example: 'sun' },
    ],
  },
  digraphs: {
    description: 'Two-letter teams that make one sound (sh, ch, th, ck).',
    collection: 'objects',
    item: [
      { name: 'team', type: 'string', required: true, example: 'sh' },
      { name: 'sound', type: 'string', required: true, example: '/sh/' },
      { name: 'word', type: 'string', required: true, example: 'ship' },
    ],
  },
  vocab: {
    description: 'Vocabulary words paired with a picture (emoji). Feeds picture-match.',
    collection: 'objects',
    item: [
      { name: 'word', type: 'string', required: true, example: 'cat' },
      { name: 'emoji', type: 'string', required: true, example: '🐱' },
    ],
  },
  blendWords: {
    description: 'Decodable CVC words for sound-blending.',
    collection: 'strings',
    example: 'cat',
  },
  wordFamilies: {
    description: 'Word families grouped by rime (-at → cat, hat, mat). Feeds the word-family board.',
    collection: 'objects',
    item: [
      { name: 'rime', type: 'string', required: true, example: 'at' },
      { name: 'words', type: 'string[]', required: true, example: ['cat', 'hat', 'mat'] },
      { name: 'band', type: 'int', required: true, example: 0, note: 'difficulty band the family belongs to' },
    ],
  },
  synonyms: {
    description: 'Word pairs that mean the same. Feeds the same/opposite board (same mode).',
    collection: 'objects',
    item: [
      { name: 'word', type: 'string', required: true, example: 'big' },
      { name: 'match', type: 'string', required: true, example: 'large' },
    ],
  },
  antonyms: {
    description: 'Word pairs that are opposites. Feeds the same/opposite board (opposite mode).',
    collection: 'objects',
    item: [
      { name: 'word', type: 'string', required: true, example: 'hot' },
      { name: 'match', type: 'string', required: true, example: 'cold' },
    ],
  },
  contextClues: {
    description: 'Cloze sentences with the answer + distractors. Feeds the context-clue board.',
    collection: 'objects',
    item: [
      { name: 'sentence', type: 'string', required: true, example: 'I sleep in my ___.', note: 'must contain the "___" blank' },
      { name: 'answer', type: 'string', required: true, example: 'bed' },
      { name: 'distractors', type: 'string[]', required: true, example: ['cup', 'bus', 'fish'], note: 'wrong-but-plausible choices' },
    ],
  },
  sightWords: {
    description: 'High-frequency words learned by sight (not sounded out).',
    collection: 'strings',
    example: 'the',
  },
  parts_of_speech: {
    description: 'The grammar word bank; the generator tags each word as noun / verb / adjective.',
    collection: 'wordbank',
    fields: [
      { name: 'note', type: 'string', required: false },
      { name: 'words', type: 'string[]', required: true, example: ['cat', 'run', 'happy'] },
    ],
  },
  sentences: {
    description: 'Model sentences for the sentence-builder board (capital first, period last).',
    collection: 'strings',
    example: 'The cat is big.',
  },
  punctuationCores: {
    description: 'Sentences with no end mark; the punctuation board asks which of . ? ! fits.',
    collection: 'strings',
    example: 'the cat is big',
  },
};
