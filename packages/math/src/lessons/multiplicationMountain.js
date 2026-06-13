// Multiplication Mountain lessons. long-multiply (×1 digit) and long-multiply2 (×2 digit
// partial products) and long-division (DMSB) are NEW (review: these stations wrongly
// shared the Groups-&-Arrays concept). mm-multi reuses the Story Problems lesson.
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });
const col = (key, p) => ({ kind: 'column', key, op: '×', result: '', carry: {}, active: null, ...p });

export const MULTIPLICATION_MOUNTAIN = {
  'long-multiply': {
    title: 'Multiply ×1 Digit',
    sections: [
      { id: 'setup', label: 'Set it up', beats: [b('llm-1', col('m1', { top: 23, bottom: 4 }))] },
      { id: 'ones', label: 'Ones', beats: [b('llm-2', col('m1', { top: 23, bottom: 4, result: '2', carry: { 1: '1' }, active: 0 }))] },
      { id: 'tens', label: 'Tens', beats: [
        b('llm-3', col('m1', { top: 23, bottom: 4, result: '92', carry: { 1: '1' }, active: 1 })),
        b('llm-4', col('m1', { top: 23, bottom: 4, result: '92', carry: { 1: '1' } })),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('llm-5', col('m1', { top: 23, bottom: 4, result: '92', carry: { 1: '1' } }))] },
    ],
  },

  'long-multiply2': {
    title: 'Multiply ×2 Digits',
    sections: [
      { id: 'split', label: 'Split it', beats: [b('llm2-1', { kind: 'big', key: 's', text: '23 × 14', color: '#a78bfa' })] },
      { id: 'byfour', label: '× 4', beats: [b('llm2-2', { kind: 'big', key: 'p1', text: '23 × 4 = 92', color: '#22d3ee' })] },
      { id: 'byten', label: '× 10', beats: [b('llm2-3', { kind: 'big', key: 'p2', text: '23 × 10 = 230', color: '#22d3ee' })] },
      { id: 'add', label: 'Add parts', beats: [
        b('llm2-4', { kind: 'column', key: 'addp', op: '+', top: 92, bottom: 230, result: '', active: null }),
        b('llm2-5', { kind: 'column', key: 'addp', op: '+', top: 92, bottom: 230, result: '322' }),
      ] },
    ],
  },

  'long-division': {
    title: 'Long Division',
    sections: [
      { id: 'setup', label: 'Set it up', beats: [b('lld-1', ld(0))] },
      { id: 'd1', label: 'Divide', beats: [b('lld-2', ld(1))] },
      { id: 'm1', label: 'Multiply', beats: [b('lld-3', ld(2))] },
      { id: 's1', label: 'Subtract & bring', beats: [b('lld-4', ld(4))] },
      { id: 'd2', label: 'Divide again', beats: [b('lld-5', ld(5))] },
      { id: 'finish', label: 'Finish', beats: [b('lld-6', ld(8))] },
      { id: 'go', label: 'Your turn', beats: [b('lld-7', ld(8))] },
    ],
  },
};

// 84 ÷ 4 = 21, walked by step. quotient digits appear at steps [1,5]; working rows
// (multiply / line / bring-down / multiply / line / remainder) appear at their steps.
function ld(step) {
  return {
    kind: 'longdiv', key: 'd84', step,
    divisor: '4', dividend: '84', quotient: '21', quoSteps: [1, 5],
    rows: [
      { s: '-8', step: 2, c: 'rose' },
      { s: '--', step: 3, c: 'line' },
      { s: '04', step: 4 },
      { s: '-4', step: 6, c: 'rose' },
      { s: '--', step: 7, c: 'line' },
      { s: ' 0', step: 8 },
    ],
  };
}
