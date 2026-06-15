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
export function genVocabListen(items, ctx = {}) {
  const band = ctx.band ?? 0;
  const lower = ctx.lowercase ?? (band >= 2);
  const target = pick(items);
  const distractors = shuffle(items.filter((v) => v.word !== target.word)).slice(0, 3);
  const choices = shuffle([target, ...distractors]).map((v) => v.word);
  return {
    kind: 'vocabListen',
    word: target.word,
    emoji: target.emoji,
    ru: target.ru,
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
        lower,
        expected: target.word,
        hint: `You heard "${target.word}".`,
        sayQ: [`word-${target.word}`],
        sayA: [`word-${target.word}`],
      },
    ],
  };
}

export const vocabListen = {
  id: 'vocab-listen', title: 'Listen & Choose', boardKind: 'vocabListen', bands: [0],
  generate: (band) => genVocabListen(VOCAB, { band }),
};

// ── Sight Words ─────────────────────────────────────────────────────────────
// High-frequency words learned by sight (not all decodable). Hear the word, tap the
// matching written word. A WordChoice board (listen + word-text choices).
export const SIGHT_WORDS = ['the', 'and', 'is', 'you', 'to', 'see', 'go', 'my', 'we', 'he', 'in', 'on', 'up', 'can', 'like', 'look'];

// `items` is the sight-words string array.
export function genSightWords(items, ctx = {}) {
  const band = ctx.band ?? 0;
  const lower = ctx.lowercase ?? (band >= 2);
  const target = pick(items);
  const distractors = shuffle(items.filter((w) => w !== target)).slice(0, 3);
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
        lower,
        expected: target,
        hint: `That word is "${target}".`,
        sayQ: [`word-${target}`],
        sayA: [`word-${target}`],
      },
    ],
  };
}

export const sightWords = {
  id: 'sight-words', title: 'Sight Words', boardKind: 'sightWord', bands: [0], generate: (band) => genSightWords(SIGHT_WORDS, { band }),
};

// ── Same or Opposite (synonyms & antonyms) ─────────────────────────────────
// Show a word; tap the one that means the SAME (synonym) or the OPPOSITE (antonym).
export const SYNONYMS = [
  { word: 'big', match: 'large' }, { word: 'happy', match: 'glad' }, { word: 'small', match: 'little' }, { word: 'fast', match: 'quick' },
  { word: 'mad', match: 'angry' }, { word: 'cold', match: 'chilly' }, { word: 'nice', match: 'kind' }, { word: 'scared', match: 'afraid' },
];
export const ANTONYMS = [
  { word: 'big', match: 'small' }, { word: 'hot', match: 'cold' }, { word: 'up', match: 'down' }, { word: 'fast', match: 'slow' }, { word: 'happy', match: 'sad' },
  { word: 'day', match: 'night' }, { word: 'wet', match: 'dry' }, { word: 'old', match: 'new' }, { word: 'open', match: 'shut' }, { word: 'tall', match: 'short' },
  { word: 'hard', match: 'soft' }, { word: 'full', match: 'empty' },
];
export const SAMEOPP_WORDS = [...new Set([...SYNONYMS, ...ANTONYMS].flatMap((p) => [p.word, p.match]))];

// `content` is the multi-collection object { synonyms, antonyms } (each an array of
// {word, match} objects). The mode chooses which collection supplies the pair; distractors
// come from the union of BOTH collections' words.
export function genSameOpposite(content, ctx = {}) {
  const band = ctx.band ?? 0;
  const lower = ctx.lowercase ?? (band >= 2);
  const { synonyms, antonyms } = content;
  const mode = Math.random() < 0.5 ? 'same' : 'opposite';
  const pair = pick(mode === 'same' ? synonyms : antonyms);
  const [target, correct] = Math.random() < 0.5 ? [pair.word, pair.match] : [pair.match, pair.word];
  const allWords = [...new Set([...synonyms, ...antonyms].flatMap((p) => [p.word, p.match]))];
  const distractors = shuffle(allWords.filter((w) => w !== target && w !== correct)).slice(0, 3);
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
        lower,
        expected: correct,
        hint: mode === 'same' ? `"${target}" and "${correct}" mean about the same.` : `The opposite of "${target}" is "${correct}".`,
        sayQ: [mode === 'same' ? 'q-same' : 'q-opposite', `word-${target}`],
        sayA: [`word-${correct}`],
      },
    ],
  };
}

export const sameOpposite = {
  id: 'same-opposite', title: 'Same or Opposite', boardKind: 'sameOpp', bands: [0],
  generate: (band) => genSameOpposite({ synonyms: SYNONYMS, antonyms: ANTONYMS }, { band }),
};

// ── Context Clues ───────────────────────────────────────────────────────────
// Read a sentence with a missing word; the other words are clues. Authored cloze items
// (`___` marks the blank); answer + distractors all have word-<w> clips.
export const CONTEXT_ITEMS = [
  { sentence: 'I sleep in my ___.', answer: 'bed', distractors: ['cup', 'bus', 'fish'] },
  { sentence: 'The ___ shines in the sky.', answer: 'sun', distractors: ['bed', 'cat', 'box'] },
  { sentence: 'A ___ says woof.', answer: 'dog', distractors: ['pig', 'fish', 'hen'] },
  { sentence: 'A ___ says oink.', answer: 'pig', distractors: ['dog', 'hen', 'cat'] },
  { sentence: 'I wear a ___ on my head.', answer: 'hat', distractors: ['cup', 'bus', 'net'] },
  { sentence: 'A ___ swims in the sea.', answer: 'fish', distractors: ['cat', 'hen', 'jet'] },
  { sentence: 'Ice is very ___.', answer: 'cold', distractors: ['hot', 'big', 'wet'] },
  { sentence: 'The fire is very ___.', answer: 'hot', distractors: ['cold', 'wet', 'sad'] },
  { sentence: 'A tiny ___ is very small.', answer: 'ant', distractors: ['bus', 'ship', 'zebra'] },
  { sentence: 'A ___ flies high in the sky.', answer: 'jet', distractors: ['bus', 'fish', 'bed'] },
  { sentence: 'I drink milk from a ___.', answer: 'cup', distractors: ['hat', 'net', 'map'] },
  { sentence: 'A ___ has black and white stripes.', answer: 'zebra', distractors: ['cat', 'dog', 'pig'] },
];
export const CONTEXT_WORDS = [...new Set(CONTEXT_ITEMS.flatMap((i) => [i.answer, ...i.distractors]))];

// `items` is the context-clues array ({ sentence, answer, distractors } cloze items).
export function genContextClues(items, ctx = {}) {
  const band = ctx.band ?? 0;
  const lower = ctx.lowercase ?? (band >= 2);
  const item = pick(items);
  const choices = shuffle([item.answer, ...item.distractors]);
  return {
    kind: 'contextClue',
    word: item.answer,
    result: item.answer,
    sentence: item.sentence,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Context Clues', color: C.green },
        banner: 'Which word completes the sentence?',
        prompt: 'Read it and tap the word that fits',
        sentence: item.sentence,
        audioPrompt: 'q-fill',
        inputKind: 'choice',
        choices,
        lower,
        expected: item.answer,
        hint: `"${item.answer}" fits: ${item.sentence.replace('___', item.answer)}`,
        sayQ: ['q-fill'],
        sayA: [`word-${item.answer}`],
      },
    ],
  };
}

export const contextClues = {
  id: 'context-clues', title: 'Context Clues', boardKind: 'contextClue', bands: [0], generate: (band) => genContextClues(CONTEXT_ITEMS, { band }),
};

export const VOCAB_TOPICS = [pictureMatch, sightWords, sameOpposite, contextClues];
