// Carry Canyon lessons. long-add / long-sub are NEW column-method walkthroughs (the
// review flagged that these stations wrongly shared the basic add/sub concept). They
// use the ColumnGrid view, revealing one column at a time with carry/borrow. Rounding
// rides RoundingLine; Story Problems use StoryWords (per-phrase reveal, colored keywords).
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

// column({ top, bottom, op, result, carry, active }) — result is the right-aligned
// partial answer (spaces = blank cells); carry maps colFromRight → annotation.
const col = (key, p) => ({ kind: 'column', key, op: '+', result: '', carry: {}, active: null, ...p });

// story word arrays (numbers → cyan, +action → green, −action → orange)
const STORY_ADD = [
  { t: 'Maya' }, { t: 'has' }, { t: '3', kind: 'num' }, { t: 'apples.' },
  { t: 'She' }, { t: 'gets' }, { t: '5', kind: 'num' }, { t: 'more.', kind: 'add' },
  { t: 'How' }, { t: 'many' }, { t: 'now?' },
];
const STORY_SUB = [
  { t: 'Sam' }, { t: 'had' }, { t: '8', kind: 'num' }, { t: 'stickers.' },
  { t: 'He' }, { t: 'gave', kind: 'sub' }, { t: 'away', kind: 'sub' }, { t: '3.', kind: 'num' },
  { t: 'How' }, { t: 'many' }, { t: 'left?', kind: 'sub' },
];
const story = (key, words, revealed) => ({ kind: 'story', key, words, revealed });

export const CARRY_CANYON = {
  'long-add': {
    title: 'Long Addition',
    sections: [
      { id: 'lineup', label: 'Stack them', beats: [b('lla-1', col('a1', { top: 34, bottom: 12 }))] },
      { id: 'nocarry', label: 'Add columns', beats: [
        b('lla-2', col('a1', { top: 34, bottom: 12, result: '6', active: 0 })),
        b('lla-3', col('a1', { top: 34, bottom: 12, result: '46', active: 1 })),
        b('lla-4', col('a1', { top: 34, bottom: 12, result: '46' })),
      ] },
      { id: 'carry', label: 'Carrying', beats: [
        b('lla-5', col('a2', { top: 27, bottom: 48 })),
        b('lla-6', col('a2', { top: 27, bottom: 48, result: '5', carry: { 1: '1' }, active: 0 })),
        b('lla-7', col('a2', { top: 27, bottom: 48, result: '75', carry: { 1: '1' }, active: 1 })),
        b('lla-8', col('a2', { top: 27, bottom: 48, result: '75', carry: { 1: '1' } })),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lla-9', col('a2', { top: 27, bottom: 48, result: '75', carry: { 1: '1' } }))] },
    ],
  },

  'long-sub': {
    title: 'Long Subtraction',
    sections: [
      { id: 'lineup', label: 'Stack them', beats: [b('lls-1', col('s1', { top: 48, bottom: 23, op: '−' }))] },
      { id: 'noborrow', label: 'Subtract', beats: [
        b('lls-2', col('s1', { top: 48, bottom: 23, op: '−', result: '5', active: 0 })),
        b('lls-3', col('s1', { top: 48, bottom: 23, op: '−', result: '25', active: 1 })),
        b('lls-4', col('s1', { top: 48, bottom: 23, op: '−', result: '25' })),
      ] },
      { id: 'borrow', label: 'Borrowing', beats: [
        b('lls-5', col('s2', { top: 52, bottom: 27, op: '−' })),
        b('lls-6', col('s2', { top: 52, bottom: 27, op: '−', carry: { 1: '4', 0: '12' }, active: 0 })),
        b('lls-7', col('s2', { top: 52, bottom: 27, op: '−', result: '5', carry: { 1: '4', 0: '12' }, active: 0 })),
        b('lls-8', col('s2', { top: 52, bottom: 27, op: '−', result: '25', carry: { 1: '4', 0: '12' }, active: 1 })),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lls-9', col('s2', { top: 52, bottom: 27, op: '−', result: '25', carry: { 1: '4', 0: '12' } }))] },
    ],
  },

  rounding: {
    title: 'Rounding',
    sections: [
      { id: 'what', label: 'Round numbers', beats: [b('lrnd-1', { kind: 'big', key: 'rn', text: '10  20  30  40', color: '#22d3ee' })] },
      { id: 'up', label: 'Round up', beats: [
        b('lrnd-2', { kind: 'roundline', key: 'r47', v: 47, unit: 10 }),
        b('lrnd-3', { kind: 'roundline', key: 'r47', v: 47, unit: 10 }),
      ] },
      { id: 'down', label: 'Round down', beats: [b('lrnd-4', { kind: 'roundline', key: 'r43', v: 43, unit: 10 })] },
      { id: 'half', label: 'Halfway', beats: [b('lrnd-5', { kind: 'roundline', key: 'r45', v: 45, unit: 10 })] },
      { id: 'go', label: 'Your turn', beats: [b('lrnd-6', { kind: 'roundline', key: 'r47b', v: 47, unit: 10 })] },
    ],
  },

  'word-problems': {
    title: 'Story Problems',
    sections: [
      { id: 'readA', label: 'Read it', beats: [
        b('lwp-1', story('wA', STORY_ADD, 4)),
        b('lwp-2', story('wA', STORY_ADD, 8)),
        b('lwp-3', story('wA', STORY_ADD, 11)),
      ] },
      { id: 'solveA', label: 'Find the math', beats: [
        b('lwp-4', { kind: 'big', key: 'eqA', text: '3 + 5 = 8', color: '#4ade80' }),
        b('lwp-5', { kind: 'big', key: 'eqA', text: '3 + 5 = 8', color: '#4ade80' }),
      ] },
      { id: 'readB', label: 'Another', beats: [
        b('lwp-6', story('wB', STORY_SUB, 4)),
        b('lwp-7', story('wB', STORY_SUB, 8)),
        b('lwp-8', story('wB', STORY_SUB, 11)),
      ] },
      { id: 'solveB', label: 'Subtract', beats: [b('lwp-9', { kind: 'big', key: 'eqB', text: '8 − 3 = 5', color: '#fb923c' })] },
      { id: 'go', label: 'Your turn', beats: [b('lwp-10', story('wB', STORY_SUB, 11))] },
    ],
  },
};
