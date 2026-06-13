// Measure Marsh lessons. CoinTray/ClockRead/ElapsedClocks/UnitLadder draw their own
// totals & labels; narration rides them. (ms-convert reuses the units lesson.)
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const MEASURE_MARSH = {
  money: {
    title: 'Money & Change',
    sections: [
      { id: 'count', label: 'Count up', beats: [
        b('lmo-1', { kind: 'coins', key: 'c2', coins: [25, 10] }),
        b('lmo-2', { kind: 'coins', key: 'c2', coins: [25, 10] }),
      ] },
      { id: 'more', label: 'Add more', beats: [b('lmo-3', { kind: 'coins', key: 'c6', coins: [25, 10, 5, 1, 1, 1] })] },
      { id: 'go', label: 'Your turn', beats: [b('lmo-4', { kind: 'coins', key: 'c3', coins: [25, 25, 10] })] },
    ],
  },
  time: {
    title: 'Telling Time',
    sections: [
      { id: 'hands', label: 'The hands', beats: [
        b('lti-1', { kind: 'clock', key: 't3', h: 3, m: 0 }),
        b('lti-2', { kind: 'clock', key: 't3', h: 3, m: 0 }),
      ] },
      { id: 'half', label: 'Half past', beats: [b('lti-3', { kind: 'clock', key: 't330', h: 3, m: 30 })] },
      { id: 'go', label: 'Your turn', beats: [b('lti-4', { kind: 'clock', key: 't9', h: 9, m: 0 })] },
    ],
  },
  elapsed: {
    title: 'Elapsed Time',
    sections: [
      { id: 'count', label: 'Count on', beats: [
        b('lel-1', { kind: 'elapsed', key: 'e1', h1: 2, m1: 0, dh: 1, dm: 30 }),
        b('lel-2', { kind: 'elapsed', key: 'e1', h1: 2, m1: 0, dh: 1, dm: 30 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lel-3', { kind: 'elapsed', key: 'e2', h1: 4, m1: 0, dh: 2, dm: 0 })] },
    ],
  },
  units: {
    title: 'Length & Weight',
    sections: [
      { id: 'meter', label: 'Meters', beats: [
        b('lun-1', { kind: 'unitladder', key: 'um', big: 'm', small: 'cm', per: 100, n: 2 }),
        b('lun-2', { kind: 'unitladder', key: 'um', big: 'm', small: 'cm', per: 100, n: 2 }),
      ] },
      { id: 'kilo', label: 'Kilograms', beats: [b('lun-3', { kind: 'unitladder', key: 'uk', big: 'kg', small: 'g', per: 1000, n: 1 })] },
      { id: 'go', label: 'Your turn', beats: [b('lun-4', { kind: 'unitladder', key: 'um3', big: 'm', small: 'cm', per: 100, n: 3 })] },
    ],
  },
};
