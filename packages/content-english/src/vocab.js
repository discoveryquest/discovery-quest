// Vocabulary — English Quest World 2 (Word Woods). First topic: Picture Match — see a
// picture, tap the word that names it. Audio-first friendly (the word also plays), and
// it reuses the same per-subject contract + word-<w> clips as phonics.
//   topic = { id, title, boardKind, bands, generate(band) → problem }

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const C = { green: '#4ADE80' };

// nouns with a clear picture and an existing word-<w> clip (decodable, common)
export const VOCAB = [
  { word: 'cat', emoji: '🐱' }, { word: 'dog', emoji: '🐶' }, { word: 'pig', emoji: '🐷' },
  { word: 'sun', emoji: '☀️' }, { word: 'hat', emoji: '🎩' }, { word: 'bus', emoji: '🚌' },
  { word: 'cup', emoji: '☕' }, { word: 'hen', emoji: '🐔' }, { word: 'fan', emoji: '🪭' },
  { word: 'bug', emoji: '🐛' }, { word: 'jet', emoji: '✈️' }, { word: 'van', emoji: '🚐' },
  { word: 'box', emoji: '📦' }, { word: 'pin', emoji: '📌' }, { word: 'net', emoji: '🥅' },
  { word: 'map', emoji: '🗺️' }, { word: 'ant', emoji: '🐜' }, { word: 'web', emoji: '🕸️' },
  { word: 'egg', emoji: '🥚' }, { word: 'fish', emoji: '🐟' }, { word: 'duck', emoji: '🦆' },
  { word: 'ship', emoji: '🚢' }, { word: 'kite', emoji: '🪁' }, { word: 'zebra', emoji: '🦓' },
];
export const VOCAB_WORDS = VOCAB.map((v) => v.word);

export function genPictureMatch(items, ctx = {}) {
  const band = ctx.band ?? 0;
  const lower = ctx.lowercase ?? (band >= 2);
  const target = pick(items);
  const distractors = shuffle(items.filter((v) => v.word !== target.word)).slice(0, 3);
  const choices = shuffle([target, ...distractors]).map((v) => v.word);
  return {
    kind: 'pictureMatch',
    word: target.word,
    emoji: target.emoji,
    ru: target.ru,
    result: target.word,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Picture Match', color: C.green },
        banner: 'Which word names this picture?',
        prompt: 'Tap the word that matches',
        audioPrompt: `word-${target.word}`,
        emoji: target.emoji,
        ru: target.ru,
        inputKind: 'choice',
        choices,
        lower, // capitals first; lowercase from band 2 (matches the letter stage), or overridden by ctx.lowercase
        expected: target.word,
        hint: `That's a ${target.word}.`,
        sayQ: [`word-${target.word}`],
        sayA: [`word-${target.word}`],
      },
    ],
  };
}

export const pictureMatch = {
  id: 'picture-match', title: 'Picture Match', boardKind: 'pictureMatch', bands: [0],
  generate: (band) => genPictureMatch(VOCAB, { band }),
};

// Listen-from-vocab: hear the English word, tap it among choices (no picture). Reuses the
// vocab bank + word-<w> clips, rendered by the WordChoice board — the listening counterpart
// of picture-match, ideal for foreign-language courses.
export function genVocabListen(band = 0) {
  const target = pick(VOCAB);
  const distractors = shuffle(VOCAB.filter((v) => v.word !== target.word)).slice(0, 3);
  const choices = shuffle([target, ...distractors]).map((v) => v.word);
  return {
    kind: 'vocabListen',
    word: target.word,
    emoji: target.emoji,
    result: target.word,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Listen', color: C.green },
        banner: 'Listen and choose the word',
        prompt: 'Tap the word you heard',
        playLabel: 'Play the word',
        audioPrompt: `word-${target.word}`,
        inputKind: 'choice',
        choices,
        lower: band >= 2,
        expected: target.word,
        hint: `You heard "${target.word}".`,
        sayQ: [`word-${target.word}`],
        sayA: [`word-${target.word}`],
      },
    ],
  };
}

export const vocabListen = {
  id: 'vocab-listen', title: 'Listen & Choose', boardKind: 'vocabListen', bands: [0], generate: genVocabListen,
};

// ── Sight Words ─────────────────────────────────────────────────────────────
// High-frequency words learned by sight (not all decodable). Hear the word, tap the
// matching written word. A WordChoice board (listen + word-text choices).
export const SIGHT_WORDS = ['the', 'and', 'is', 'you', 'to', 'see', 'go', 'my', 'we', 'he', 'in', 'on', 'up', 'can', 'like', 'look'];

export function genSightWords(band = 0) {
  const target = pick(SIGHT_WORDS);
  const distractors = shuffle(SIGHT_WORDS.filter((w) => w !== target)).slice(0, 3);
  const choices = shuffle([target, ...distractors]);
  return {
    kind: 'sightWord',
    word: target,
    result: target,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Sight Words', color: C.green },
        banner: 'Listen — which word is it?',
        prompt: 'Tap the word you hear',
        audioPrompt: `word-${target}`,
        inputKind: 'choice',
        choices,
        lower: band >= 2,
        expected: target,
        hint: `That word is "${target}".`,
        sayQ: [`word-${target}`],
        sayA: [`word-${target}`],
      },
    ],
  };
}

export const sightWords = {
  id: 'sight-words', title: 'Sight Words', boardKind: 'sightWord', bands: [0], generate: genSightWords,
};

// ── Same or Opposite (synonyms & antonyms) ─────────────────────────────────
// Show a word; tap the one that means the SAME (synonym) or the OPPOSITE (antonym).
export const SYNONYMS = [
  ['big', 'large'], ['happy', 'glad'], ['small', 'little'], ['fast', 'quick'],
  ['mad', 'angry'], ['cold', 'chilly'], ['nice', 'kind'], ['scared', 'afraid'],
];
export const ANTONYMS = [
  ['big', 'small'], ['hot', 'cold'], ['up', 'down'], ['fast', 'slow'], ['happy', 'sad'],
  ['day', 'night'], ['wet', 'dry'], ['old', 'new'], ['open', 'shut'], ['tall', 'short'],
  ['hard', 'soft'], ['full', 'empty'],
];
export const SAMEOPP_WORDS = [...new Set([...SYNONYMS, ...ANTONYMS].flat())];

export function genSameOpposite(band = 0) {
  const mode = Math.random() < 0.5 ? 'same' : 'opposite';
  const pair = pick(mode === 'same' ? SYNONYMS : ANTONYMS);
  const [target, correct] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
  const distractors = shuffle(SAMEOPP_WORDS.filter((w) => w !== target && w !== correct)).slice(0, 3);
  const choices = shuffle([correct, ...distractors]);
  return {
    kind: 'sameOpp',
    word: correct, // reveal/celebrate the matching word
    result: correct,
    target,
    mode,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: mode === 'same' ? 'Same Meaning' : 'Opposites', color: C.green },
        banner: mode === 'same' ? 'Which word means the SAME?' : 'Which word is the OPPOSITE?',
        prompt: mode === 'same' ? `Tap the word that means the same as "${target}"` : `Tap the opposite of "${target}"`,
        target,
        mode,
        audioPrompt: `word-${target}`,
        inputKind: 'choice',
        choices,
        lower: band >= 2,
        expected: correct,
        hint: mode === 'same' ? `"${target}" and "${correct}" mean about the same.` : `The opposite of "${target}" is "${correct}".`,
        sayQ: [mode === 'same' ? 'q-same' : 'q-opposite', `word-${target}`],
        sayA: [`word-${correct}`],
      },
    ],
  };
}

export const sameOpposite = {
  id: 'same-opposite', title: 'Same or Opposite', boardKind: 'sameOpp', bands: [0], generate: genSameOpposite,
};

// ── Context Clues ───────────────────────────────────────────────────────────
// Read a sentence with a missing word; the other words are clues. Authored cloze items
// (`___` marks the blank); answer + distractors all have word-<w> clips.
export const CONTEXT_ITEMS = [
  { s: 'I sleep in my ___.', a: 'bed', d: ['cup', 'bus', 'fish'] },
  { s: 'The ___ shines in the sky.', a: 'sun', d: ['bed', 'cat', 'box'] },
  { s: 'A ___ says woof.', a: 'dog', d: ['pig', 'fish', 'hen'] },
  { s: 'A ___ says oink.', a: 'pig', d: ['dog', 'hen', 'cat'] },
  { s: 'I wear a ___ on my head.', a: 'hat', d: ['cup', 'bus', 'net'] },
  { s: 'A ___ swims in the sea.', a: 'fish', d: ['cat', 'hen', 'jet'] },
  { s: 'Ice is very ___.', a: 'cold', d: ['hot', 'big', 'wet'] },
  { s: 'The fire is very ___.', a: 'hot', d: ['cold', 'wet', 'sad'] },
  { s: 'A tiny ___ is very small.', a: 'ant', d: ['bus', 'ship', 'zebra'] },
  { s: 'A ___ flies high in the sky.', a: 'jet', d: ['bus', 'fish', 'bed'] },
  { s: 'I drink milk from a ___.', a: 'cup', d: ['hat', 'net', 'map'] },
  { s: 'A ___ has black and white stripes.', a: 'zebra', d: ['cat', 'dog', 'pig'] },
];
export const CONTEXT_WORDS = [...new Set(CONTEXT_ITEMS.flatMap((i) => [i.a, ...i.d]))];

export function genContextClues(band = 0) {
  const item = pick(CONTEXT_ITEMS);
  const choices = shuffle([item.a, ...item.d]);
  return {
    kind: 'contextClue',
    word: item.a,
    result: item.a,
    sentence: item.s,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Context Clues', color: C.green },
        banner: 'Which word completes the sentence?',
        prompt: 'Read it and tap the word that fits',
        sentence: item.s,
        audioPrompt: 'q-fill',
        inputKind: 'choice',
        choices,
        lower: band >= 2,
        expected: item.a,
        hint: `"${item.a}" fits: ${item.s.replace('___', item.a)}`,
        sayQ: ['q-fill'],
        sayA: [`word-${item.a}`],
      },
    ],
  };
}

export const contextClues = {
  id: 'context-clues', title: 'Context Clues', boardKind: 'contextClue', bands: [0], generate: genContextClues,
};

export const VOCAB_TOPICS = [pictureMatch, sightWords, sameOpposite, contextClues];
