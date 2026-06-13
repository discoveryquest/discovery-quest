// Grammar — English Quest World 3 (Grammar Grove). First topics classify words by part of
// speech: tap the naming word (noun), doing word (verb), or describing word (adjective).
// One generator parameterised by category; per-subject contract as usual.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const C = { purple: '#A78BFA' };

// kid-level words, each clearly ONE part of speech for this exercise
const NOUNS = ['cat', 'dog', 'sun', 'hat', 'bus', 'cup', 'fish', 'box', 'bed', 'ball', 'hen', 'jet', 'van', 'ant', 'pig', 'map', 'leg', 'queen', 'zebra', 'duck'];
const VERBS = ['run', 'jump', 'sit', 'hop', 'eat', 'swim', 'sing', 'read', 'ride', 'fly', 'dig', 'sleep', 'look', 'go'];
const ADJECTIVES = ['big', 'small', 'hot', 'cold', 'wet', 'dry', 'old', 'new', 'tall', 'soft', 'hard', 'happy', 'sad', 'nice'];
const BANK = { noun: NOUNS, verb: VERBS, adjective: ADJECTIVES };
export const POS_LABEL = { noun: 'naming word', verb: 'doing word', adjective: 'describing word' };
export const GRAMMAR_WORDS = [...new Set([...NOUNS, ...VERBS, ...ADJECTIVES])];

export function genWordSort(category, band = 0) {
  const target = pick(BANK[category]);
  const others = Object.keys(BANK).filter((k) => k !== category).flatMap((k) => BANK[k]);
  const distractors = shuffle(others).slice(0, 3);
  const choices = shuffle([target, ...distractors]);
  return {
    kind: 'grammarSort',
    category,
    word: target,
    result: target,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: POS_LABEL[category], color: C.purple },
        banner: `Tap the ${POS_LABEL[category]}`,
        prompt: `Which one is a ${POS_LABEL[category]}?`,
        category,
        audioPrompt: `q-${category}`,
        inputKind: 'choice',
        choices,
        lower: band >= 2,
        expected: target,
        hint: `"${target}" is a ${POS_LABEL[category]}.`,
        sayQ: [`q-${category}`],
        sayA: [`word-${target}`],
      },
    ],
  };
}

export const nouns = { id: 'nouns', title: 'Naming Words', boardKind: 'grammarNoun', bands: [0], generate: (b) => genWordSort('noun', b) };
export const verbs = { id: 'verbs', title: 'Doing Words', boardKind: 'grammarVerb', bands: [0], generate: (b) => genWordSort('verb', b) };
export const adjectives = { id: 'adjectives', title: 'Describing Words', boardKind: 'grammarAdj', bands: [0], generate: (b) => genWordSort('adjective', b) };

// ── Build a Sentence (word order) ───────────────────────────────────────────
// Scrambled word tiles → tap them in order to make the sentence. Proper sentence case
// (capital first word, period at the end) — this also previews Capitals & Periods.
export const SENTENCES = [
  'The cat is big.', 'I see a dog.', 'The sun is hot.', 'A pig can run.', 'I like my hat.',
  'The fish is wet.', 'We go to bed.', 'The bus is big.', 'I see the sun.', 'The dog can run.',
];

export function genBuildSentence() {
  const sentence = pick(SENTENCES);
  const tokens = sentence.split(' ');
  return {
    kind: 'sentence',
    word: sentence, // reveal the finished sentence
    result: sentence,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Build a Sentence', color: C.purple },
        banner: 'Put the words in the right order',
        prompt: 'Tap the words to build the sentence',
        tokens: shuffle(tokens),
        inputKind: 'build',
        lower: true, // tokens already carry proper case; never re-case them
        expected: sentence,
        hint: `It reads: ${sentence}`,
        sayQ: ['q-order'],
        sayA: [],
      },
    ],
  };
}

export const buildSentence = {
  id: 'build-sentence', title: 'Build a Sentence', boardKind: 'sentence', bands: [0], generate: genBuildSentence,
};

// ── Capitals & Periods ──────────────────────────────────────────────────────
// Pick the correctly-written sentence (capital start + period). Distractors drop the
// capital and/or the period.
export const PUNCT_CORES = ['the cat is big', 'i see a dog', 'the sun is hot', 'a pig can run', 'we go to bed', 'the dog can run'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function genPunctuation() {
  const core = pick(PUNCT_CORES);
  const correct = `${cap(core)}.`;
  const wrongs = [`${core}.`, cap(core), core]; // no-cap / no-period / neither
  const choices = shuffle([correct, ...wrongs]);
  return {
    kind: 'punctuation',
    word: correct,
    result: correct,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Capitals & Periods', color: C.purple },
        banner: 'Which sentence is written correctly?',
        prompt: 'A sentence starts with a capital and ends with a period',
        audioPrompt: 'q-correct',
        inputKind: 'choice',
        choices,
        lower: true, // sentences keep their own case
        expected: correct,
        hint: `Correct: ${correct} — capital start, period at the end.`,
        sayQ: ['q-correct'],
        sayA: [],
      },
    ],
  };
}

export const punctuation = {
  id: 'punctuation', title: 'Capitals & Periods', boardKind: 'punctuation', bands: [0], generate: genPunctuation,
};

export const GRAMMAR_TOPICS = [nouns, verbs, adjectives, buildSentence, punctuation];
