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
      { name: 'band', type: 'number', required: false, example: 0, note: 'phonics band this letter is introduced in (0=s,a,t,p,i,n; 1=+m,d,g,o,c,k; 2=all)' },
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
    description: 'Vocabulary words paired with a picture (emoji), plus an optional native-language gloss (ru/…) for foreign-language courses. Feeds picture-match + listen-from-vocab.',
    collection: 'objects',
    item: [
      { name: 'word', type: 'string', required: true, example: 'cat' },
      { name: 'emoji', type: 'string', required: true, example: '🐱' },
      { name: 'ru', type: 'string', required: false, example: 'кошка', note: 'optional native-language gloss shown beneath the word (EFL courses)' },
      { name: 'band', type: 'number', required: false, example: 0, note: 'optional difficulty/topic band; a station selects its slice via bands:' },
    ],
  },
  blendWords: {
    description: 'Decodable CVC words for sound-blending, tagged with the BLEND_BANDS band they are introduced in.',
    collection: 'objects',
    item: [
      { name: 'word', type: 'string', required: true, example: 'cat' },
      { name: 'band', type: 'number', required: true, example: 0, note: 'first BLEND_BANDS array the word appears in' },
    ],
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
    description: 'The grammar word bank, role-keyed: nouns / verbs / adjectives. The generator draws from the appropriate array per category.',
    collection: 'wordbank',
    fields: [
      { name: 'nouns', type: 'string[]', required: true, example: ['cat', 'dog', 'sun'] },
      { name: 'verbs', type: 'string[]', required: true, example: ['run', 'jump', 'sit'] },
      { name: 'adjectives', type: 'string[]', required: true, example: ['big', 'small', 'hot'] },
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
