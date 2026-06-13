// Grammar Grove "Learn it" lessons (parts of speech). Same beat format; shared engine.
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const GRAMMAR_LESSONS = {
  nouns: {
    title: 'Naming Words',
    sections: [
      { id: 'what', label: 'Nouns', beats: [b('lgn-1', { kind: 'examples', key: 'n', label: 'naming words', words: ['cat', 'hat', 'bus'] })] },
      { id: 'go', label: 'Your turn', beats: [b('lgn-2', { kind: 'examples', key: 'n2', label: 'naming words', words: ['dog', 'box', 'sun'] })] },
    ],
  },
  verbs: {
    title: 'Doing Words',
    sections: [
      { id: 'what', label: 'Verbs', beats: [b('lgv-1', { kind: 'examples', key: 'v', label: 'doing words', words: ['run', 'jump', 'eat'] })] },
      { id: 'go', label: 'Your turn', beats: [b('lgv-2', { kind: 'examples', key: 'v2', label: 'doing words', words: ['hop', 'swim', 'sing'] })] },
    ],
  },
  adjectives: {
    title: 'Describing Words',
    sections: [
      { id: 'what', label: 'Adjectives', beats: [b('lga-1', { kind: 'examples', key: 'a', label: 'describing words', words: ['big', 'hot', 'happy'] })] },
      { id: 'go', label: 'Your turn', beats: [b('lga-2', { kind: 'examples', key: 'a2', label: 'describing words', words: ['small', 'cold', 'soft'] })] },
    ],
  },
  'build-sentence': {
    title: 'Build a Sentence',
    sections: [
      { id: 'order', label: 'Word order', beats: [b('lgb-1', { kind: 'sentence', key: 's1', text: 'The cat is big.' })] },
      { id: 'go', label: 'Your turn', beats: [b('lgb-2', { kind: 'sentence', key: 's2', text: 'I see a dog.' })] },
    ],
  },
  punctuation: {
    title: 'Capitals & Periods',
    sections: [
      { id: 'rule', label: 'The rule', beats: [b('lgc-1', { kind: 'sentence', key: 'c1', text: 'The dog can run.' })] },
      { id: 'go', label: 'Your turn', beats: [b('lgc-2', { kind: 'sentence', key: 'c2', text: 'The sun is hot.' })] },
    ],
  },
};
