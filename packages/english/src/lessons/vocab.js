// Word Woods "Learn it" lessons (vocabulary). Same beat format as phonics; played by the
// shared @discoveryquest/engine-ui/LessonScreen. See docs/specs/2026-06-13-lesson-content-format.md.
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const VOCAB_LESSONS = {
  'picture-match': {
    title: 'Picture Match',
    sections: [
      { id: 'cat', label: 'cat', beats: [b('lpm-1', { kind: 'picture', key: 'cat', emoji: '🐱', word: 'cat' })] },
      { id: 'dog', label: 'dog', beats: [b('lpm-2', { kind: 'picture', key: 'dog', emoji: '🐶', word: 'dog' })] },
      { id: 'go', label: 'Your turn', beats: [b('lpm-3', { kind: 'picture', key: 'fish', emoji: '🐟', word: 'fish' })] },
    ],
  },

  'sight-words': {
    title: 'Sight Words',
    sections: [
      { id: 'the', label: 'the', beats: [b('lsw-1', { kind: 'picture', key: 'the', emoji: '👀', word: 'the' })] },
      { id: 'and', label: 'and', beats: [b('lsw-2', { kind: 'picture', key: 'and', emoji: '👀', word: 'and' })] },
      { id: 'go', label: 'Your turn', beats: [b('lsw-3', { kind: 'picture', key: 'you', emoji: '👀', word: 'you' })] },
    ],
  },

  'same-opposite': {
    title: 'Same or Opposite',
    sections: [
      { id: 'same', label: 'Same', beats: [b('lso-1', { kind: 'pair', key: 'same', a: 'big', b: 'large', rel: 'same' })] },
      { id: 'opp', label: 'Opposite', beats: [b('lso-2', { kind: 'pair', key: 'opp', a: 'hot', b: 'cold', rel: 'opposite' })] },
      { id: 'go', label: 'Your turn', beats: [b('lso-3', { kind: 'pair', key: 'go', a: 'up', b: 'down', rel: 'opposite' })] },
    ],
  },

  'context-clues': {
    title: 'Context Clues',
    sections: [
      { id: 'clue', label: 'The clue', beats: [
        b('lcc-1', { kind: 'cloze', key: 'bed', sentence: 'I sleep in my ___.' }),
        b('lcc-2', { kind: 'cloze', key: 'bed', sentence: 'I sleep in my ___.', answer: 'bed' }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lcc-3', { kind: 'cloze', key: 'sun', sentence: 'The ___ shines in the sky.' })] },
    ],
  },
};
