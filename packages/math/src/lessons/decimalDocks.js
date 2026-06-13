// Decimal Docks lessons. DecimalGrid/CompareDecimals/AddDecimals/DecimalHop draw their
// own values & results; narration rides them. (dd-mulwhole is a "coming soon" station.)
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const DECIMAL_DOCKS = {
  'decimal-place': {
    title: 'Decimal Places',
    sections: [
      { id: 'tenths', label: 'Tenths', beats: [
        b('ldp-1', { kind: 'decgrid', key: 'd03', value: 0.3 }),
        b('ldp-2', { kind: 'decgrid', key: 'd03', value: 0.3 }),
      ] },
      { id: 'hundredths', label: 'Hundredths', beats: [b('ldp-3', { kind: 'decgrid', key: 'd045', value: 0.45 })] },
      { id: 'convert', label: 'Same as ½', beats: [b('ldp-4', { kind: 'decgrid', key: 'd05', value: 0.5 })] },
      { id: 'go', label: 'Your turn', beats: [b('ldp-5', { kind: 'decgrid', key: 'd03b', value: 0.3 })] },
    ],
  },
  'compare-decimals': {
    title: 'Compare Decimals',
    sections: [
      { id: 'which', label: 'Which is bigger', beats: [
        b('lcd-1', { kind: 'compdec', key: 'c5045', a: 0.5, b: 0.45 }),
        b('lcd-2', { kind: 'compdec', key: 'c5045', a: 0.5, b: 0.45 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lcd-3', { kind: 'compdec', key: 'c7068', a: 0.7, b: 0.68 })] },
    ],
  },
  'add-decimals': {
    title: 'Add & Subtract',
    sections: [
      { id: 'lineup', label: 'Line up points', beats: [
        b('lad-1', { kind: 'adddec', key: 'a1234', a: 1.2, b: 3.4 }),
        b('lad-2', { kind: 'adddec', key: 'a1234', a: 1.2, b: 3.4 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lad-3', { kind: 'adddec', key: 'a2513', a: 2.5, b: 1.3 })] },
    ],
  },
  'decimal-pow10': {
    title: '× and ÷ by 10, 100',
    sections: [
      { id: 'times', label: '× 10', beats: [
        b('lpw-1', { kind: 'dechop', key: 'hx', from: 3.4, factor: 10, op: '×' }),
        b('lpw-2', { kind: 'dechop', key: 'hx', from: 3.4, factor: 10, op: '×' }),
      ] },
      { id: 'divide', label: '÷ 10', beats: [b('lpw-3', { kind: 'dechop', key: 'hd', from: 3.4, factor: 10, op: '÷' })] },
      { id: 'go', label: 'Your turn', beats: [b('lpw-4', { kind: 'dechop', key: 'hx100', from: 3.4, factor: 100, op: '×' })] },
    ],
  },
};
