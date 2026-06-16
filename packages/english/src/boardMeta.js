// Catalog metadata for English BOARD kinds — the interactive question types a station can
// use (`board: <kind>`). One entry per key in BOARD_REGISTRY; gen-capabilities verifies they
// stay in lockstep. Unlike math (engine-generated), English boards consume
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
    description: 'Same or opposite? Pick the synonym or the antonym of the given word. Draws from both the synonyms and antonyms collections.',
    content: ['synonyms', 'antonyms'],
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
    description: 'Spot the naming word (noun) — sorts words by part of speech. Draws from the nouns array of the parts_of_speech word bank.',
    content: 'parts_of_speech',
    item: [{ name: '(word)', type: 'string', example: 'dog', note: 'tagged noun in the word bank' }],
  },
  grammarVerb: {
    description: 'Spot the doing word (verb). Draws from the verbs array of the parts_of_speech word bank.',
    content: 'parts_of_speech',
    item: [{ name: '(word)', type: 'string', example: 'run', note: 'tagged verb' }],
  },
  grammarAdj: {
    description: 'Spot the describing word (adjective). Draws from the adjectives array of the parts_of_speech word bank.',
    content: 'parts_of_speech',
    item: [{ name: '(word)', type: 'string', example: 'happy', note: 'tagged adjective' }],
  },
  sentence: {
    description: 'Build a correct sentence by ordering the words (capital first, period last).',
    content: 'sentences',
    item: [{ name: '(sentence)', type: 'string', example: 'The cat is big.', note: 'a model sentence the words are drawn from' }],
  },
  sentenceRu: {
    description: 'Build an English sentence from scrambled word tiles, prompted by its native-language meaning; each tile speaks its word. Foreign-language sentence construction (renders via SentenceBuilder).',
    content: 'sentencesRu',
    item: [
      { name: 'en', type: 'string', example: 'I see a cat.', note: 'the target English sentence (words scrambled into tiles)' },
      { name: 'ru', type: 'string', example: 'Я вижу кошку.', note: 'native-language meaning shown as the prompt' },
    ],
  },
  ruleQuiz: {
    description: 'Apply a spelling/grammar rule: a reminder of the rule, then pick the word that follows it (Bossy R, Magic E, i-before-e…).',
    content: 'rules',
    item: [
      { name: 'rule', type: 'string', example: 'i before e, except after c', note: 'the mnemonic shown as the reminder banner' },
      { name: 'question', type: 'string', example: 'Which is correct?' },
      { name: 'answer', type: 'string', example: 'receive', note: 'the word that follows the rule' },
      { name: 'distractors', type: 'string[]', example: ['recieve'], note: 'wrong-but-plausible choices that break the rule' },
    ],
  },
  punctuation: {
    description: 'Choose the right end mark for a sentence (. ? !).',
    content: 'punctuationCores',
    item: [{ name: '(core)', type: 'string', example: 'the cat is big', note: 'sentence without its end mark' }],
  },
  soundPattern: {
    description: 'Advanced phonics: a reminder of a decoding pattern (vowel team, r-controlled, diphthong, silent letter), then pick the word that uses it. Shares the RuleQuiz interaction but draws from the patterns collection.',
    content: 'patterns',
    item: [
      { name: 'rule', type: 'string', example: 'ai and ay spell long A', note: 'the pattern shown as the reminder banner' },
      { name: 'question', type: 'string', example: 'Which spells the long A sound?' },
      { name: 'answer', type: 'string', example: 'rain', note: 'the word that uses the pattern' },
      { name: 'distractors', type: 'string[]', example: ['ran', 'run'], note: 'words that break the pattern' },
    ],
  },
  spellBee: {
    description: 'Spelling Bee: a reminder tip, then pick the correctly-spelled word (tricky high-frequency words, homophones, word endings). Shares the RuleQuiz interaction but draws from the spellings collection.',
    content: 'spellings',
    item: [
      { name: 'rule', type: 'string', example: 'their = belonging, there = a place', note: 'the spelling tip shown as the reminder banner' },
      { name: 'question', type: 'string', example: 'They lost ___ ball.' },
      { name: 'answer', type: 'string', example: 'their', note: 'the correctly-spelled word' },
      { name: 'distractors', type: 'string[]', example: ['there', "they're"], note: 'plausible misspellings/confusions' },
    ],
  },
  firstReader: {
    description: 'First Readers: read along to a short decodable story (narrated word by word), then tap the word you heard. Renders via the StoryReader board.',
    content: 'storyItems',
    item: [
      { name: 'story', type: 'string', example: 'The cat is on the mat. The cat can nap.' },
      { name: 'q', type: 'string', example: 'cat', note: 'the target word to tap' },
      { name: 'd', type: 'string[]', example: ['mat', 'hat', 'map'], note: 'distractor words' },
    ],
  },
  mainIdea: {
    description: 'Main Idea: read a short story, then answer a spoken wh-question about what it is about. Renders via the StoryReader board.',
    content: 'mainIdeaItems',
    item: [
      { name: 'story', type: 'string', example: 'The cat sat on the mat. The cat can nap. The cat is little.' },
      { name: 'q', type: 'string', example: 'rq-main', note: 'rq-* clip key for the spoken question' },
      { name: 'text', type: 'string', example: 'What is the story about?' },
      { name: 'a', type: 'string', example: 'cat', note: 'the answer word' },
      { name: 'd', type: 'string[]', example: ['dog', 'sun', 'bus'], note: 'distractor words' },
    ],
  },
  findDetail: {
    description: 'Find the Detail: read a short story, then answer a spoken wh-question whose answer is stated in the text. Renders via the StoryReader board.',
    content: 'detailItems',
    item: [
      { name: 'story', type: 'string', example: 'The cat is on the mat. The cat is big.' },
      { name: 'q', type: 'string', example: 'rq-where-cat', note: 'rq-* clip key for the spoken question' },
      { name: 'text', type: 'string', example: 'Where is the cat?' },
      { name: 'a', type: 'string', example: 'mat', note: 'the answer word' },
      { name: 'd', type: 'string[]', example: ['box', 'bed', 'web'], note: 'distractor words' },
    ],
  },
  inference: {
    description: 'Read Between the Lines: read a short story, then infer the answer to a spoken wh-question using clues. Renders via the StoryReader board.',
    content: 'inferenceItems',
    item: [
      { name: 'story', type: 'string', example: 'The dog can run and jump. The dog can dig.' },
      { name: 'q', type: 'string', example: 'rq-feel-dog', note: 'rq-* clip key for the spoken question' },
      { name: 'text', type: 'string', example: 'How does the dog feel?' },
      { name: 'a', type: 'string', example: 'happy', note: 'the inferred answer word' },
      { name: 'd', type: 'string[]', example: ['sad', 'mad'], note: 'distractor words' },
    ],
  },
};
