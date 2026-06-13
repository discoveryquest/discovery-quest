// Number Meadow lessons — the foundation. Each is a unique warm beat script;
// captions come from LESSON_LINES[say] so spoken + shown text always match.
import { LESSON_LINES as L } from './lines.js';

// beat(say, view) — caption is the spoken line; advance happens when narration ends.
const b = (say, view) => ({ say, caption: L[say], view });

export const NUMBER_MEADOW = {
  counting: {
    title: 'Counting',
    sections: [
      { id: 'what', label: 'What counting is', beats: [b('lcount-intro', { kind: 'objects', key: 'apples', emoji: '🍎', n: 5, highlight: -1 })] },
      {
        id: 'count5', label: 'Count to 5', beats: [
          b('lc-1', { kind: 'objects', key: 'apples', emoji: '🍎', n: 5, highlight: 0 }),
          b('lc-2', { kind: 'objects', key: 'apples', emoji: '🍎', n: 5, highlight: 1 }),
          b('lc-3', { kind: 'objects', key: 'apples', emoji: '🍎', n: 5, highlight: 2 }),
          b('lc-4', { kind: 'objects', key: 'apples', emoji: '🍎', n: 5, highlight: 3 }),
          b('lc-5', { kind: 'objects', key: 'apples', emoji: '🍎', n: 5, highlight: 4 }),
        ],
      },
      { id: 'idea', label: 'How many?', beats: [b('lcount-howmany', { kind: 'objects', key: 'apples', emoji: '🍎', n: 5, highlight: 4, numeral: 5 })] },
      {
        id: 'again', label: 'Try again', beats: [
          b('lcount-again', { kind: 'objects', key: 'stars', emoji: '⭐', n: 3, highlight: -1 }),
          b('lc-1', { kind: 'objects', key: 'stars', emoji: '⭐', n: 3, highlight: 0 }),
          b('lc-2', { kind: 'objects', key: 'stars', emoji: '⭐', n: 3, highlight: 1 }),
          b('lc-3', { kind: 'objects', key: 'stars', emoji: '⭐', n: 3, highlight: 2 }),
          b('lcount-three', { kind: 'objects', key: 'stars', emoji: '⭐', n: 3, highlight: 2, numeral: 3 }),
        ],
      },
      { id: 'go', label: 'Your turn', beats: [b('lcount-star', { kind: 'objects', key: 'go', emoji: '🌟', n: 5, highlight: 4 })] },
    ],
  },

  compare: {
    title: 'Bigger or Smaller',
    sections: [
      { id: 'intro', label: 'Compare', beats: [
        b('lcmp-1', { kind: 'compare', key: 'cookies', emoji: '🍪', left: 3, right: 5 }),
        b('lcmp-2', { kind: 'compare', key: 'cookies', emoji: '🍪', left: 3, right: 5 }),
        b('lcmp-3', { kind: 'compare', key: 'cookies', emoji: '🍪', left: 3, right: 5 }),
      ] },
      { id: 'sign', label: 'The sign', beats: [
        b('lcmp-4', { kind: 'compare', key: 'cookies', emoji: '🍪', left: 3, right: 5, sign: '<' }),
        b('lcmp-5', { kind: 'compare', key: 'cookies', emoji: '🍪', left: 3, right: 5, sign: '<' }),
      ] },
      { id: 'equal', label: 'Equal', beats: [
        b('lcmp-6', { kind: 'compare', key: 'apples', emoji: '🍎', left: 4, right: 4 }),
        b('lcmp-7', { kind: 'compare', key: 'apples', emoji: '🍎', left: 4, right: 4, sign: '=' }),
      ] },
      { id: 'other', label: 'Other way', beats: [
        b('lcmp-8', { kind: 'compare', key: 'berries', emoji: '🫐', left: 6, right: 2, sign: '>' }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lcmp-9', { kind: 'compare', key: 'berries', emoji: '🫐', left: 6, right: 2, sign: '>' })] },
    ],
  },

  // The ten-frame draws "n + (10−n) = 10" itself, so beats sit on the frame (one key
  // per example so each re-animates) and Luna narrates — no separate equation echo.
  bonds: {
    title: 'Friends of 10',
    sections: [
      { id: 'what', label: 'Ten-frame', beats: [b('lbnd-1', { kind: 'tenframe', key: 'tf0', filled: 0, showEq: false })] },
      { id: 'six', label: 'Six', beats: [
        b('lbnd-2', { kind: 'tenframe', key: 'tf6', filled: 6 }),
        b('lbnd-3', { kind: 'tenframe', key: 'tf6', filled: 6 }),
        b('lbnd-4', { kind: 'tenframe', key: 'tf6', filled: 6 }),
      ] },
      { id: 'seven', label: 'Seven', beats: [
        b('lbnd-5', { kind: 'tenframe', key: 'tf7', filled: 7 }),
        b('lbnd-6', { kind: 'tenframe', key: 'tf7', filled: 7 }),
      ] },
      { id: 'two', label: 'Two', beats: [
        b('lbnd-7', { kind: 'tenframe', key: 'tf2', filled: 2 }),
        b('lbnd-8', { kind: 'tenframe', key: 'tf2', filled: 2 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lbnd-9', { kind: 'tenframe', key: 'tf10', filled: 10, showEq: false })] },
    ],
  },

  // CombineBlocks / NumberLineHint draw the equation themselves; narration rides the
  // same visual (no echoed result beat).
  addition: {
    title: 'Adding to 20',
    sections: [
      { id: 'together', label: 'Put together', beats: [
        b('ladd-1', { kind: 'combine', key: 'c43', a: 4, b: 3 }),
        b('ladd-2', { kind: 'combine', key: 'c43', a: 4, b: 3 }),
      ] },
      { id: 'bigger', label: 'A bigger one', beats: [
        b('ladd-3', { kind: 'combine', key: 'c85', a: 8, b: 5 }),
        b('ladd-4', { kind: 'combine', key: 'c85', a: 8, b: 5 }),
      ] },
      { id: 'counton', label: 'Count on', beats: [
        b('ladd-5', { kind: 'numberline', key: 'nl', hint: { kind: 'numberline', start: 9, op: 'add', delta: 4 } }),
        b('ladd-6', { kind: 'numberline', key: 'nl', hint: { kind: 'numberline', start: 9, op: 'add', delta: 4 } }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('ladd-7', { kind: 'big', key: 'plus', text: '➕', color: '#22d3ee' })] },
    ],
  },

  subtraction: {
    title: 'Taking Away',
    sections: [
      { id: 'takeaway', label: 'Take away', beats: [
        b('lsub-1', { kind: 'takeaway', key: 't83', a: 8, b: 3 }),
        b('lsub-2', { kind: 'takeaway', key: 't83', a: 8, b: 3 }),
      ] },
      { id: 'another', label: 'Another', beats: [
        b('lsub-3', { kind: 'takeaway', key: 't104', a: 10, b: 4 }),
        b('lsub-4', { kind: 'takeaway', key: 't104', a: 10, b: 4 }),
      ] },
      { id: 'hopback', label: 'Hop back', beats: [
        b('lsub-5', { kind: 'numberline', key: 'nl', hint: { kind: 'numberline', start: 12, op: 'sub', delta: 5 } }),
        b('lsub-6', { kind: 'numberline', key: 'nl', hint: { kind: 'numberline', start: 12, op: 'sub', delta: 5 } }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lsub-7', { kind: 'big', key: 'minus', text: '➖', color: '#fb923c' })] },
    ],
  },
};
