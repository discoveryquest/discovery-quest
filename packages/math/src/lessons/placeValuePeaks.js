// Place Value Peaks lessons. (pv-2digit reuses the Number Meadow `addition` lesson.)
// BaseTenBlocks draws "t tens + o ones = N"; SkipHops animates the hops; EvenOddDots
// shows the pairing + EVEN/ODD verdict — so narration rides those, no echoed result.
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const PLACE_VALUE_PEAKS = {
  'place-value': {
    title: 'Tens & Ones',
    sections: [
      { id: 'build', label: 'Build 23', beats: [
        b('lpv-1', { kind: 'baseten', key: 'bt23', t: 2, o: 3 }),
        b('lpv-2', { kind: 'baseten', key: 'bt23', t: 2, o: 3 }),
        b('lpv-3', { kind: 'baseten', key: 'bt23', t: 2, o: 3 }),
      ] },
      { id: 'forty', label: 'Forty', beats: [
        b('lpv-4', { kind: 'baseten', key: 'bt40', t: 4, o: 0 }),
        b('lpv-5', { kind: 'baseten', key: 'bt40', t: 4, o: 0 }),
      ] },
      { id: 'seven', label: 'Just ones', beats: [b('lpv-6', { kind: 'baseten', key: 'bt7', t: 0, o: 7 })] },
      { id: 'go', label: 'Your turn', beats: [b('lpv-7', { kind: 'baseten', key: 'bt35', t: 3, o: 5 })] },
    ],
  },

  hundreds: {
    title: 'Hundreds',
    sections: [
      { id: 'bundle', label: 'Make 100', beats: [b('lhun-1', { kind: 'baseten', key: 'bt100', t: 10, o: 0 })] },
      { id: 'read', label: 'Read 345', beats: [
        b('lhun-2', { kind: 'placedigits', key: 'pd345', value: 345 }),
        b('lhun-3', { kind: 'placedigits', key: 'pd345', value: 345 }),
        b('lhun-4', { kind: 'placedigits', key: 'pd345', value: 345 }),
      ] },
      { id: 'zero', label: 'Zero holder', beats: [b('lhun-5', { kind: 'placedigits', key: 'pd208', value: 208 })] },
      { id: 'go', label: 'Your turn', beats: [b('lhun-6', { kind: 'placedigits', key: 'pd345b', value: 345 })] },
    ],
  },

  'skip-counting': {
    title: 'Skip Counting',
    sections: [
      { id: 'fives', label: 'By 5s', beats: [
        b('lskip-1', { kind: 'skip', key: 's5', step: 5, count: 4 }),
        b('lskip-2', { kind: 'skip', key: 's5', step: 5, count: 4 }),
      ] },
      { id: 'twos', label: 'By 2s', beats: [
        b('lskip-3', { kind: 'skip', key: 's2', step: 2, count: 5 }),
        b('lskip-4', { kind: 'skip', key: 's2', step: 2, count: 5 }),
      ] },
      { id: 'tens', label: 'By 10s', beats: [
        b('lskip-5', { kind: 'skip', key: 's10', step: 10, count: 5 }),
        b('lskip-6', { kind: 'skip', key: 's10', step: 10, count: 5 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lskip-7', { kind: 'skip', key: 's5b', step: 5, count: 4 })] },
    ],
  },

  'even-odd': {
    title: 'Even or Odd',
    sections: [
      { id: 'even8', label: 'Even', beats: [
        b('leo-1', { kind: 'evenodd', key: 'e8', n: 8 }),
        b('leo-2', { kind: 'evenodd', key: 'e8', n: 8 }),
      ] },
      { id: 'odd7', label: 'Odd', beats: [
        b('leo-3', { kind: 'evenodd', key: 'e7', n: 7 }),
        b('leo-4', { kind: 'evenodd', key: 'e7', n: 7 }),
      ] },
      { id: 'even6', label: 'Even again', beats: [b('leo-5', { kind: 'evenodd', key: 'e6', n: 6 })] },
      { id: 'go', label: 'Your turn', beats: [b('leo-6', { kind: 'evenodd', key: 'e6b', n: 6 })] },
    ],
  },
};
