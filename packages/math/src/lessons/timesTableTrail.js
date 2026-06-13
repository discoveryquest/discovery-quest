// Times Table Trail lessons. The three Tables stations get DISTINCT lessons (review:
// they used to show the same Groups-&-Arrays video): 2/5/10 teaches what a times table
// is, 3/4/6 the doubling tricks, 7/8/9 the nine-trick + commutativity. RepeatedAddition
// / ArrayModel / ShareGroups / MulTableHint draw their own results; TableRow reveals a
// table row at a time.
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const TIMES_TABLE_TRAIL = {
  multiply: {
    title: 'Groups & Arrays',
    sections: [
      { id: 'groups', label: 'Equal groups', beats: [
        b('lmul-1', { kind: 'repeatadd', key: 'ra34', a: 3, b: 4 }),
        b('lmul-2', { kind: 'repeatadd', key: 'ra34', a: 3, b: 4 }),
      ] },
      { id: 'array', label: 'A rectangle', beats: [
        b('lmul-3', { kind: 'array', key: 'ar34', a: 3, b: 4 }),
        b('lmul-4', { kind: 'array', key: 'ar34', a: 3, b: 4 }),
      ] },
      { id: 'fast', label: 'Another', beats: [
        b('lmul-5', { kind: 'repeatadd', key: 'ra25', a: 2, b: 5 }),
        b('lmul-6', { kind: 'repeatadd', key: 'ra25', a: 2, b: 5 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lmul-7', { kind: 'array', key: 'ar25', a: 2, b: 5 })] },
    ],
  },

  'times-2510': {
    title: 'Tables 2, 5, 10',
    sections: [
      { id: 'what', label: 'The table', beats: [b('ltt-1', { kind: 'table', key: 't5', n: 5, reveal: 3 })] },
      { id: 'fives', label: 'Fives', beats: [
        b('ltt-2', { kind: 'table', key: 't5', n: 5, reveal: 6 }),
        b('ltt-3', { kind: 'table', key: 't5', n: 5, reveal: 10 }),
      ] },
      { id: 'twos', label: 'Twos', beats: [b('ltt-4', { kind: 'table', key: 't2', n: 2, reveal: 4 })] },
      { id: 'tens', label: 'Tens', beats: [
        b('ltt-5', { kind: 'table', key: 't10', n: 10, reveal: 3 }),
        b('ltt-6', { kind: 'big', key: 'tt100', text: '10 × 10 = 100', color: '#22d3ee' }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('ltt-7', { kind: 'table', key: 't5b', n: 5, reveal: 10 })] },
    ],
  },

  'times-346': {
    title: 'Tables 3, 4, 6',
    sections: [
      { id: 'intro', label: 'Tricks', beats: [b('lt36-1', { kind: 'table', key: 't3', n: 3, reveal: 10 })] },
      { id: 'threes', label: 'Threes', beats: [b('lt36-2', { kind: 'table', key: 't3', n: 3, reveal: 4 })] },
      { id: 'fours', label: 'Fours', beats: [b('lt36-3', { kind: 'table', key: 't4', n: 4, reveal: 6 })] },
      { id: 'sixes', label: 'Sixes', beats: [b('lt36-4', { kind: 'table', key: 't6', n: 6, reveal: 4 })] },
      { id: 'go', label: 'Your turn', beats: [b('lt36-5', { kind: 'table', key: 't6b', n: 6, reveal: 10 })] },
    ],
  },

  'times-789': {
    title: 'Tables 7, 8, 9',
    sections: [
      { id: 'intro', label: 'Tricky ones', beats: [b('lt79-1', { kind: 'table', key: 't9', n: 9, reveal: 10 })] },
      { id: 'nine1', label: 'Nine magic', beats: [b('lt79-2', { kind: 'table', key: 't9', n: 9, reveal: 5 })] },
      { id: 'nine2', label: 'Nine trick', beats: [b('lt79-3', { kind: 'big', key: 'n94', text: '9 × 4 = 36', color: '#a78bfa' })] },
      { id: 'eightseven', label: 'Eights & sevens', beats: [b('lt79-4', { kind: 'table', key: 't8', n: 8, reveal: 5 })] },
      { id: 'go', label: 'Your turn', beats: [b('lt79-5', { kind: 'table', key: 't7', n: 7, reveal: 10 })] },
    ],
  },

  division: {
    title: 'Division Facts',
    sections: [
      { id: 'share', label: 'Share fairly', beats: [
        b('ldiv-1', { kind: 'groups', key: 'g123', total: 12, groups: 3 }),
        b('ldiv-2', { kind: 'groups', key: 'g123', total: 12, groups: 3 }),
      ] },
      { id: 'opposite', label: 'Opposite of ×', beats: [b('ldiv-3', { kind: 'multable', key: 'mt34', hint: { kind: 'multable', row: 3, col: 4, mode: 'div' } })] },
      { id: 'use', label: 'Use the table', beats: [
        b('ldiv-4', { kind: 'groups', key: 'g153', total: 15, groups: 5 }),
        b('ldiv-5', { kind: 'groups', key: 'g153', total: 15, groups: 5 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('ldiv-6', { kind: 'multable', key: 'mt53', hint: { kind: 'multable', row: 5, col: 3, mode: 'div' } })] },
    ],
  },
};
