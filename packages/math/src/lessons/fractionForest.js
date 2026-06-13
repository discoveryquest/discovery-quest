// Fraction Forest lessons. FractionPieBar/FractionBar/EquivFractions/CompareFractions/
// AddFractions draw their own fraction labels & operations; narration rides them.
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const FRACTION_FOREST = {
  fractions: {
    title: 'What is a Fraction?',
    sections: [
      { id: 'slice', label: 'Slices', beats: [
        b('lfr-1', { kind: 'fracpie', key: 'q14', k: 1, n: 4 }),
        b('lfr-2', { kind: 'fracpie', key: 'q34', k: 3, n: 4 }),
        b('lfr-3', { kind: 'fracpie', key: 'q34', k: 3, n: 4 }),
      ] },
      { id: 'half', label: 'One-half', beats: [b('lfr-4', { kind: 'fracpie', key: 'q12', k: 1, n: 2 })] },
      { id: 'go', label: 'Your turn', beats: [b('lfr-5', { kind: 'fracbar', key: 'fb34', n: 4, k: 3 })] },
    ],
  },

  'equivalent-fractions': {
    title: 'Equivalent Fractions',
    sections: [
      { id: 'half', label: 'Half', beats: [
        b('leq-1', { kind: 'equiv', key: 'eq12', a: 1, b: 2, m: 2 }),
        b('leq-2', { kind: 'equiv', key: 'eq12', a: 1, b: 2, m: 2 }),
        b('leq-3', { kind: 'equiv', key: 'eq12', a: 1, b: 2, m: 2 }),
      ] },
      { id: 'third', label: 'Third', beats: [b('leq-4', { kind: 'equiv', key: 'eq13', a: 1, b: 3, m: 2 })] },
      { id: 'go', label: 'Your turn', beats: [b('leq-5', { kind: 'equiv', key: 'eq12b', a: 1, b: 2, m: 3 })] },
    ],
  },

  'compare-fractions': {
    title: 'Compare Fractions',
    sections: [
      { id: 'pieces', label: 'Piece size', beats: [
        b('lcf-1', { kind: 'compfrac', key: 'c1213', k1: 1, n1: 2, k2: 1, n2: 3 }),
        b('lcf-2', { kind: 'compfrac', key: 'c1213', k1: 1, n1: 2, k2: 1, n2: 3 }),
      ] },
      { id: 'samebottom', label: 'Same bottom', beats: [b('lcf-3', { kind: 'compfrac', key: 'c3525', k1: 3, n1: 5, k2: 2, n2: 5 })] },
      { id: 'go', label: 'Your turn', beats: [b('lcf-4', { kind: 'compfrac', key: 'c1214', k1: 1, n1: 2, k2: 1, n2: 4 })] },
    ],
  },

  'add-fractions': {
    title: 'Add Fractions',
    sections: [
      { id: 'like', label: 'Same bottom', beats: [
        b('laf-1', { kind: 'addfrac', key: 'a124', a: 1, b: 2, n: 4 }),
        b('laf-2', { kind: 'addfrac', key: 'a124', a: 1, b: 2, n: 4 }),
      ] },
      { id: 'like2', label: 'Another', beats: [b('laf-3', { kind: 'addfrac', key: 'a215', a: 2, b: 1, n: 5 })] },
      { id: 'unlike', label: 'Make them match', beats: [
        b('laf-4', { kind: 'equiv', key: 'eqm', a: 1, b: 2, m: 2 }),
        b('laf-5', { kind: 'addfrac', key: 'a214', a: 2, b: 1, n: 4 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('laf-6', { kind: 'addfrac', key: 'a124b', a: 1, b: 2, n: 4 })] },
    ],
  },

  'mixed-numbers': {
    title: 'Mixed Numbers',
    sections: [
      { id: 'what', label: 'A whole + part', beats: [
        b('lmx-1', { kind: 'big', key: 'm1', text: '1½', color: '#4ade80' }),
        b('lmx-2', { kind: 'big', key: 'm1', text: '1 + ½ = 1½', color: '#4ade80' }),
      ] },
      { id: 'more', label: 'Bigger', beats: [b('lmx-3', { kind: 'big', key: 'm2', text: '2¾', color: '#4ade80' })] },
      { id: 'go', label: 'Your turn', beats: [b('lmx-4', { kind: 'fracbar', key: 'mx34', n: 4, k: 3 })] },
    ],
  },

  'frac-times-whole': {
    title: 'Fraction × Whole',
    sections: [
      { id: 'repeat', label: 'Repeated adding', beats: [
        b('lmw-1', { kind: 'big', key: 'w1', text: '3 × ¼', color: '#22d3ee' }),
        b('lmw-2', { kind: 'fracbar', key: 'fbw', n: 4, k: 3 }),
      ] },
      { id: 'result', label: 'The answer', beats: [b('lmw-3', { kind: 'big', key: 'w2', text: '3 × ¼ = ¾', color: '#22d3ee' })] },
      { id: 'go', label: 'Your turn', beats: [b('lmw-4', { kind: 'fracbar', key: 'fbw2', n: 4, k: 3 })] },
    ],
  },
};
