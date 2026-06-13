// English Quest curriculum. Four learning worlds + a cross-cutting Speaking Studio
// (design spec §4). Built step by step: Phonics Cove's Sound→Letter stations are
// PLAYABLE today; everything else is `soon: true` (shown on the map "in construction"
// so the whole journey is visible). A station unlocks when the previous one in its
// world earns a star. `lesson` points at a "Learn it" (see lessons/).
import { letterSounds } from '@discoveryquest/content-english/phonics';

const SL = letterSounds.boardKind;

export const WORLDS = [
  {
    id: 'phonics', title: 'Phonics Cove', emoji: '🐚', color: '#22D3EE',
    blurb: 'Hear it, find the letter, read your first words.',
    stations: [
      { id: 'ph-set1', title: 'First Sounds', icon: '🅰️', boardKind: SL, band: 0, sub: 's a t p i n', lesson: 'letter-sounds' },
      { id: 'ph-set2', title: 'More Sounds', icon: '🅱️', boardKind: SL, band: 1, sub: '+ m d g o c k', lesson: 'letter-sounds' },
      { id: 'ph-all', title: 'All Letter Sounds', icon: '🔤', boardKind: SL, band: 2, sub: 'every letter', lesson: 'letter-sounds' },
      { id: 'ph-blend', title: 'Blending Bay', icon: '🫧', boardKind: 'blendWord', band: 0, sub: 'blend sounds into words', lesson: 'blending' },
      { id: 'ph-families', title: 'Word Families', icon: '👨‍👩‍👧', boardKind: 'wordFamily', band: 0, sub: '-at, -an, -ig', lesson: 'word-families' },
      { id: 'ph-digraphs', title: 'Tricky Teams', icon: '🧩', boardKind: 'digraphs', band: 0, sub: 'sh, ch, th, ck', lesson: 'digraphs' },
    ],
  },
  {
    id: 'vocab', title: 'Word Woods', emoji: '🌳', color: '#4ADE80',
    blurb: 'Grow your word power — meanings, matches, and clues.',
    stations: [
      { id: 'v-match', title: 'Picture Match', icon: '🖼️', boardKind: 'pictureMatch', band: 0, sub: 'word ↔ picture', lesson: 'picture-match' },
      { id: 'v-sight', title: 'Sight Words', icon: '👀', boardKind: 'sightWord', band: 0, sub: 'the, and, is, you…', lesson: 'sight-words' },
      { id: 'v-synant', title: 'Same or Opposite', icon: '🔁', boardKind: 'sameOpp', band: 0, sub: 'synonyms & antonyms', lesson: 'same-opposite' },
      { id: 'v-context', title: 'Context Clues', icon: '🔍', boardKind: 'contextClue', band: 0, sub: 'guess from the sentence', lesson: 'context-clues' },
    ],
  },
  {
    id: 'grammar', title: 'Grammar Grove', emoji: '🌿', color: '#A78BFA',
    blurb: 'Words have jobs — build sentences that work.',
    stations: [
      { id: 'g-nouns', title: 'Naming Words', icon: '🏷️', boardKind: 'grammarNoun', band: 0, sub: 'nouns', lesson: 'nouns' },
      { id: 'g-verbs', title: 'Doing Words', icon: '🏃', boardKind: 'grammarVerb', band: 0, sub: 'verbs', lesson: 'verbs' },
      { id: 'g-adj', title: 'Describing Words', icon: '🎨', boardKind: 'grammarAdj', band: 0, sub: 'adjectives', lesson: 'adjectives' },
      { id: 'g-build', title: 'Build a Sentence', icon: '🧱', boardKind: 'sentence', band: 0, sub: 'word order', lesson: 'build-sentence' },
      { id: 'g-caps', title: 'Capitals & Periods', icon: '🔠', boardKind: 'punctuation', band: 0, sub: 'punctuation', lesson: 'punctuation' },
    ],
  },
  {
    id: 'reading', title: 'Story Harbor', emoji: '⚓', color: '#F472B6', soon: true,
    blurb: 'Read little stories and find the answers inside them.',
    stations: [
      { id: 'r-first', title: 'First Readers', icon: '📖', sub: 'tiny decodable stories', soon: true },
      { id: 'r-main', title: 'Main Idea', icon: '💡', sub: 'what is it about?', soon: true },
      { id: 'r-detail', title: 'Find the Detail', icon: '🔎', sub: 'answer from the text', soon: true },
      { id: 'r-infer', title: 'Read Between the Lines', icon: '🤔', sub: 'inference', soon: true },
    ],
  },
  {
    id: 'speaking', title: 'Speaking Studio', emoji: '🎙️', color: '#FB923C', soon: true,
    blurb: 'Talk with Luna — real conversations, just for practice.',
    stations: [
      { id: 's-intro', title: 'Introduce Yourself', icon: '👋', sub: 'say hello & your name', soon: true },
      { id: 's-cafe', title: 'Order at a Café', icon: '🧁', sub: 'role-play', soon: true },
      { id: 's-pet', title: 'Describe Your Pet', icon: '🐶', sub: 'talk about something', soon: true },
      { id: 's-story', title: 'Tell a Story', icon: '📚', sub: 'speak in sentences', soon: true },
    ],
  },
];

// flat list (used by the lesson smoke + station lookups)
export const STATIONS = WORLDS.flatMap((w) => w.stations);
export const PLAYABLE = STATIONS.filter((s) => !s.soon);

export const starsOf = (save, id) => save.stations?.[id]?.stars || 0;

// A station is open if it's playable AND (first in its world OR the previous station
// in that world earned a star). `soon` stations are never open.
export function isStationOpen(save, world, index) {
  const st = world.stations[index];
  if (st.soon) return false;
  if (index === 0) return true;
  const prev = world.stations[index - 1];
  return !prev.soon && starsOf(save, prev.id) > 0;
}

export const totalStars = (save) => PLAYABLE.reduce((a, s) => a + starsOf(save, s.id), 0);
export const MAX_STARS = PLAYABLE.length * 3;
