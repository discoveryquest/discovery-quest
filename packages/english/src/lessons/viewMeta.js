// Catalog metadata for English lesson VIEW kinds — the visual building blocks a lesson beat
// can use (`view: { kind, ...fields }`). One entry per `case` in views.jsx; gen-capabilities
// verifies the two stay in lockstep, so this doubles as the contributor-facing catalog AND
// the engine's documented view vocabulary. `example` values are valid props (the fixtures a
// gallery/screenshot pass will render). Note: `lower` (capital vs lowercase stage) is injected
// by the engine from the station, not authored per beat — so it's not listed as a field.
export const VIEW_META = {
  soundboard: {
    description: 'Interactive sound wall: every letter and digraph as a tappable tile — tap one to hear its sound. A whole-alphabet "explore it yourself" screen.',
    fields: [],
  },
  letters: {
    description: 'A row of letter tiles; the active one lifts and glows. Good for intro/recap beats that point at a set of letters.',
    fields: [
      { name: 'items', type: 'string[]', required: false, example: ['s', 'a', 't', 'p', 'i', 'n'] },
      { name: 'active', type: 'int', required: false, example: 2, note: 'index of the highlighted letter; -1 for none' },
    ],
  },
  phoneme: {
    description: 'One letter in focus: a big letter card plus an example word and picture, with the first letter coloured.',
    fields: [
      { name: 'letter', type: 'string', required: true, example: 's' },
      { name: 'word', type: 'string', required: true, example: 'sun' },
      { name: 'emoji', type: 'string', required: false, example: '☀️' },
    ],
  },
  blend: {
    description: 'Sounds blending into a word: letter chips appear one by one, then resolve into the whole word ("c-a-t → cat").',
    fields: [
      { name: 'letters', type: 'string[]', required: true, example: ['c', 'a', 't'] },
      { name: 'word', type: 'string', required: true, example: 'cat' },
    ],
  },
  team: {
    description: 'Two letters teaming up to make one sound (a digraph), shown as letters = sound, then an example word + picture.',
    fields: [
      { name: 'team', type: 'string', required: true, example: 'sh' },
      { name: 'sound', type: 'string', required: true, example: '/sh/' },
      { name: 'word', type: 'string', required: true, example: 'ship' },
      { name: 'emoji', type: 'string', required: false, example: '🚢' },
    ],
  },
  picture: {
    description: 'A picture above its word — the core vocabulary visual (see it, read it).',
    fields: [
      { name: 'emoji', type: 'string', required: true, example: '🐱' },
      { name: 'word', type: 'string', required: true, example: 'cat' },
    ],
  },
  pair: {
    description: 'Two words in a relationship: same meaning (=) or opposites (⇄), colour-coded with a label.',
    fields: [
      { name: 'a', type: 'string', required: true, example: 'big' },
      { name: 'b', type: 'string', required: true, example: 'large' },
      { name: 'rel', type: 'enum', required: true, example: 'same', note: "'same' | 'opposite'" },
    ],
  },
  cloze: {
    description: 'A sentence with a blank (___), optionally shown filled with the answer. For context-clue / fill-in beats.',
    fields: [
      { name: 'sentence', type: 'string', required: true, example: 'I sleep in my ___.', note: 'must contain "___" where the blank goes' },
      { name: 'answer', type: 'string', required: false, example: 'bed', note: 'omit to show the blank empty; set to reveal it' },
    ],
  },
  examples: {
    description: 'A category label plus a few example words — used to teach a part of speech (naming/doing/describing words).',
    fields: [
      { name: 'label', type: 'string', required: true, example: 'naming words' },
      { name: 'words', type: 'string[]', required: true, example: ['cat', 'hat', 'bus'] },
    ],
  },
  sentence: {
    description: 'A full sentence with the capital first letter and the end punctuation highlighted — for building/punctuation beats.',
    fields: [
      { name: 'text', type: 'string', required: true, example: 'The cat is big.', note: 'include the capital and end mark; both get highlighted' },
    ],
  },
};
