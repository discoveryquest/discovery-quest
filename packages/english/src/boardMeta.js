// Catalog metadata for English BOARD kinds — the interactive question types a station can
// use (`board: <kind>`). One entry per key in PhonicsQuest's TOPICS map; gen-capabilities
// verifies they stay in lockstep. Unlike math (engine-generated), English boards consume
// AUTHORED content (word banks, sentences), so each entry names the `content` list it draws
// from and the shape of one item — that's what a content PR adds to. Every station also
// takes `bands` (difficulty) and an optional `lesson`; those are station fields, not repeated
// per board here.
export const BOARD_META = {
  soundToLetter: {
    description: 'Hear a sound, tap the letter that makes it. The first phonics interaction.',
    content: 'phonemes',
    item: [
      { name: 'letter', type: 'string', example: 's' },
      { name: 'sound', type: 'string', example: '/s/' },
      { name: 'word', type: 'string', example: 'sun' },
    ],
  },
  blendWord: {
    description: 'Build a short (CVC) word by choosing its sounds in order.',
    content: 'blendWords',
    item: [{ name: '(word)', type: 'string', example: 'cat', note: 'blendWords is a flat list of decodable words' }],
  },
  wordFamily: {
    description: 'Word families: same ending, swap the first sound (-at → cat, hat, mat).',
    content: 'wordFamilies',
    item: [{ name: '(family)', type: 'object', example: { rime: 'at', words: ['cat', 'hat'] }, note: 'see the wordFamilies content collection' }],
  },
  digraphs: {
    description: 'Two letters, one sound: pick the digraph team (sh, ch, th, ck) that spells the sound.',
    content: 'digraphs',
    item: [
      { name: 'team', type: 'string', example: 'sh' },
      { name: 'sound', type: 'string', example: '/sh/' },
      { name: 'word', type: 'string', example: 'ship' },
    ],
  },
  pictureMatch: {
    description: 'Match a picture to its written word (or vice versa). Core vocabulary recognition. Shows an optional native-language gloss (ru) beneath the word for foreign-language courses.',
    content: 'vocab',
    item: [
      { name: 'word', type: 'string', example: 'cat' },
      { name: 'emoji', type: 'string', example: '🐱' },
      { name: 'ru', type: 'string', example: 'кошка', note: 'optional native-language gloss (EFL)' },
    ],
  },
  vocabListen: {
    description: 'Hear a vocabulary word, tap it among choices — the listening counterpart of picture-match. Reuses the vocab bank (incl. the optional ru gloss); ideal for foreign-language listening.',
    content: 'vocab',
    item: [
      { name: 'word', type: 'string', example: 'cat' },
      { name: 'emoji', type: 'string', example: '🐱' },
      { name: 'ru', type: 'string', example: 'кошка', note: 'optional native-language gloss (EFL)' },
    ],
  },
  sightWord: {
    description: 'Choose the high-frequency sight word that was spoken — words you learn by sight, not sounding out.',
    content: 'sightWords',
    item: [{ name: '(word)', type: 'string', example: 'the', note: 'flat list of sight words' }],
  },
  sameOpp: {
    description: 'Same or opposite? Pick the synonym or the antonym of the given word.',
    content: 'synonyms, antonyms',
    item: [
      { name: 'word', type: 'string', example: 'big' },
      { name: 'match', type: 'string', example: 'large', note: 'the synonym/antonym partner' },
    ],
  },
  contextClue: {
    description: 'Fill the blank in a sentence using context clues — pick the word that makes sense.',
    content: 'contextClues',
    item: [
      { name: 'sentence', type: 'string', example: 'I sleep in my ___.', note: 'contains the blank' },
      { name: 'answer', type: 'string', example: 'bed' },
    ],
  },
  grammarNoun: {
    description: 'Spot the naming word (noun) — sorts words by part of speech.',
    content: 'parts_of_speech (nouns)',
    item: [{ name: '(word)', type: 'string', example: 'dog', note: 'tagged noun in the word bank' }],
  },
  grammarVerb: {
    description: 'Spot the doing word (verb).',
    content: 'parts_of_speech (verbs)',
    item: [{ name: '(word)', type: 'string', example: 'run', note: 'tagged verb' }],
  },
  grammarAdj: {
    description: 'Spot the describing word (adjective).',
    content: 'parts_of_speech (adjectives)',
    item: [{ name: '(word)', type: 'string', example: 'happy', note: 'tagged adjective' }],
  },
  sentence: {
    description: 'Build a correct sentence by ordering the words (capital first, period last).',
    content: 'sentences',
    item: [{ name: '(sentence)', type: 'string', example: 'The cat is big.', note: 'a model sentence the words are drawn from' }],
  },
  punctuation: {
    description: 'Choose the right end mark for a sentence (. ? !).',
    content: 'punctuationCores',
    item: [{ name: '(core)', type: 'string', example: 'the cat is big', note: 'sentence without its end mark' }],
  },
};
