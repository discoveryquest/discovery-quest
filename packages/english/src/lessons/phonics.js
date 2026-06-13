// Phonics "Learn it" lessons (beat-based, played by the shared @discoveryquest/engine-ui/LessonScreen).
// A lesson = sections → beats; caption comes from LESSON_LINES[say] so shown == spoken.
// Same declarative format as math-quest's lessons (see the lesson-content-format doc).
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

const SET1 = ['s', 'a', 't', 'p', 'i', 'n'];

export const PHONICS_LESSONS = {
  'letter-sounds': {
    title: 'Letter Sounds',
    sections: [
      // opening: a tap-to-hear board of every sound (interactive; doesn't auto-advance)
      { id: 'sounds', label: 'All sounds', beats: [{ say: 'lph-0', caption: L['lph-0'], advance: 'hold', view: { kind: 'soundboard', key: 'board' } }] },
      { id: 'listen', label: 'Listen', beats: [b('lph-1', { kind: 'letters', key: 'intro', items: SET1 })] },
      { id: 's', label: 'S', beats: [b('lph-2', { kind: 'phoneme', key: 's', letter: 's', word: 'sun', emoji: '☀️' })] },
      { id: 'a', label: 'A', beats: [b('lph-3', { kind: 'phoneme', key: 'a', letter: 'a', word: 'ant', emoji: '🐜' })] },
      { id: 'p', label: 'P', beats: [b('lph-4', { kind: 'phoneme', key: 'p', letter: 'p', word: 'pig', emoji: '🐷' })] },
      { id: 'go', label: 'Your turn', beats: [b('lph-5', { kind: 'letters', key: 'go', items: SET1, active: 0 })] },
    ],
  },

  blending: {
    title: 'Blending',
    sections: [
      { id: 'cat', label: 'c-a-t', beats: [
        b('lbl-1', { kind: 'blend', key: 'cat', letters: ['c', 'a', 't'], word: 'cat' }),
        b('lbl-2', { kind: 'blend', key: 'cat', letters: ['c', 'a', 't'], word: 'cat' }),
      ] },
      { id: 'pig', label: 'p-i-g', beats: [
        b('lbl-3', { kind: 'blend', key: 'pig', letters: ['p', 'i', 'g'], word: 'pig' }),
        b('lbl-4', { kind: 'blend', key: 'pig', letters: ['p', 'i', 'g'], word: 'pig' }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lbl-5', { kind: 'blend', key: 'cat2', letters: ['c', 'a', 't'], word: 'cat' })] },
    ],
  },

  'word-families': {
    title: 'Word Families',
    sections: [
      { id: 'fam', label: 'The -at family', beats: [
        b('lwf-1', { kind: 'blend', key: 'cat', letters: ['c', 'a', 't'], word: 'cat' }),
        b('lwf-2', { kind: 'blend', key: 'hat', letters: ['h', 'a', 't'], word: 'hat' }),
      ] },
      { id: 'more', label: 'Again', beats: [b('lwf-3', { kind: 'blend', key: 'mat', letters: ['m', 'a', 't'], word: 'mat' })] },
      { id: 'go', label: 'Your turn', beats: [b('lwf-4', { kind: 'blend', key: 'sat', letters: ['s', 'a', 't'], word: 'sat' })] },
    ],
  },

  digraphs: {
    title: 'Tricky Teams',
    sections: [
      { id: 'sh', label: 'sh', beats: [
        b('ldg-1', { kind: 'team', key: 'sh', team: 'sh', sound: '/sh/', word: 'ship', emoji: '🚢' }),
        b('ldg-2', { kind: 'team', key: 'sh', team: 'sh', sound: '/sh/', word: 'ship', emoji: '🚢' }),
      ] },
      { id: 'ch', label: 'ch', beats: [b('ldg-3', { kind: 'team', key: 'ch', team: 'ch', sound: '/ch/', word: 'chip', emoji: '🍟' })] },
      { id: 'th', label: 'th', beats: [b('ldg-4', { kind: 'team', key: 'th', team: 'th', sound: '/th/', word: 'thumb', emoji: '👍' })] },
      { id: 'go', label: 'Your turn', beats: [b('ldg-5', { kind: 'team', key: 'ck', team: 'ck', sound: '/k/', word: 'duck', emoji: '🦆' })] },
    ],
  },
};
