// Catalog metadata for math lesson VIEW kinds — the visual building blocks a lesson beat can
// use (`view: { kind, ...fields }`). One entry per `case` in views.jsx; gen-capabilities
// verifies the two stay in lockstep, so this doubles as the contributor-facing catalog AND
// the engine's documented view vocabulary. `example` values are valid props (the fixtures a
// gallery/screenshot pass will render). Most kinds reuse the game's interactive-hint visuals.
export const VIEW_META = {
  objects: {
    description: 'A row of countable objects; counted-so-far light up one by one, with a running numeral. The counting/addition staple.',
    fields: [
      { name: 'emoji', type: 'string', required: false, example: '🍎' },
      { name: 'n', type: 'int', required: true, example: 5 },
      { name: 'highlight', type: 'int', required: false, example: 2, note: 'count up to this index; -1 for none' },
      { name: 'numeral', type: 'int', required: false, example: 5, note: 'show a big total below; null to hide' },
    ],
  },
  compare: {
    description: 'Two groups of objects with a < > = "hungry mouth" sign that eats the bigger amount.',
    fields: [
      { name: 'emoji', type: 'string', required: false, example: '🍪' },
      { name: 'left', type: 'int', required: true, example: 3 },
      { name: 'right', type: 'int', required: true, example: 5 },
      { name: 'sign', type: 'enum', required: false, example: '<', note: "'<' | '>' | '=' ; null to hide" },
    ],
  },
  column: {
    description: 'Vertical column arithmetic (add/sub/mul). The author sets each beat\'s state to walk a worked example column by column.',
    fields: [
      { name: 'top', type: 'int|string', required: true, example: 27 },
      { name: 'bottom', type: 'int|string', required: true, example: 35 },
      { name: 'op', type: 'enum', required: false, example: '+', note: "'+' | '−' | '×'" },
      { name: 'result', type: 'string', required: false, example: '62', note: 'digits; use spaces for not-yet-filled places' },
      { name: 'carry', type: 'object', required: false, example: { 1: '1' }, note: '{ columnFromRight: digit } shown above' },
      { name: 'active', type: 'int', required: false, example: 0, note: 'column-from-right to highlight' },
    ],
  },
  story: {
    description: 'A word problem read aloud; words reveal as Luna reads, with numbers and action words colour-coded.',
    fields: [
      { name: 'words', type: 'object[]', required: true, example: [{ t: 'Sam', kind: null }, { t: '3', kind: 'num' }, { t: 'more', kind: 'add' }], note: 'each { t: text, kind?: "num"|"add"|"sub" }' },
      { name: 'revealed', type: 'int', required: false, example: 3, note: 'how many words shown so far' },
    ],
  },
  table: {
    description: 'A times table for n, revealing one fact at a time (skip-counting up the column).',
    fields: [
      { name: 'n', type: 'int', required: true, example: 2 },
      { name: 'reveal', type: 'int', required: false, example: 4, note: 'how many rows revealed (1..10)' },
    ],
  },
  big: {
    description: 'A single big numeral or label, for emphasis / answer-reveal beats.',
    fields: [
      { name: 'text', type: 'string', required: true, example: '42' },
      { name: 'color', type: 'string', required: false, example: '#fde047' },
    ],
  },
  placedigits: {
    description: 'A number split into place-value columns (Ones | Tens | Hundreds…) plus its expanded form.',
    fields: [{ name: 'value', type: 'int', required: true, example: 345 }],
  },
  longdiv: {
    description: 'A long-division bracket walked step by step (Divide–Multiply–Subtract–Bring down).',
    fields: [
      { name: 'divisor', type: 'string', required: true, example: '4' },
      { name: 'dividend', type: 'string', required: true, example: '84' },
      { name: 'quotient', type: 'string', required: true, example: '21' },
      { name: 'quoSteps', type: 'int[]', required: false, example: [1, 3], note: 'step at which each quotient digit appears' },
      { name: 'rows', type: 'object[]', required: false, example: [{ s: '8', c: 'rose', step: 2 }], note: 'working rows: { s: digits, c: "rose"|"line", step }' },
      { name: 'step', type: 'int', required: false, example: 99, note: 'reveal everything up to this step' },
    ],
  },
  tenframe: {
    description: 'A ten-frame filled with counters — the bridge to making tens.',
    fields: [
      { name: 'filled', type: 'int', required: true, example: 6 },
      { name: 'showEq', type: 'bool', required: false, example: true },
    ],
  },
  combine: {
    description: 'Two groups of blocks sliding together to show addition as combining.',
    fields: [
      { name: 'a', type: 'int', required: true, example: 3 },
      { name: 'b', type: 'int', required: true, example: 2 },
    ],
  },
  takeaway: {
    description: 'A group of blocks with some removed to show subtraction as taking away.',
    fields: [
      { name: 'a', type: 'int', required: true, example: 5 },
      { name: 'b', type: 'int', required: true, example: 2 },
    ],
  },
  numberline: {
    description: 'A number line that hops from a start value — add/subtract or bond-up to a target.',
    fields: [{ name: 'hint', type: 'object', required: true, example: { start: 5, op: 'add', delta: 3 }, note: "{ start, op: 'add'|'sub'|'bondup', delta? , target? }" }],
  },
  baseten: {
    description: 'Base-ten blocks: tens-rods and ones-cubes for two-digit place value.',
    fields: [
      { name: 't', type: 'int', required: true, example: 3, note: 'tens' },
      { name: 'o', type: 'int', required: true, example: 4, note: 'ones' },
    ],
  },
  comparecards: {
    description: 'Two number cards side by side to compare magnitudes.',
    fields: [
      { name: 'a', type: 'int', required: true, example: 34 },
      { name: 'b', type: 'int', required: true, example: 28 },
    ],
  },
  evenodd: {
    description: 'Dots paired up to show whether a number is even (all paired) or odd (one left over).',
    fields: [{ name: 'n', type: 'int', required: true, example: 7 }],
  },
  skip: {
    description: 'Skip-counting hops along a track (count by 2s, 5s, 10s).',
    fields: [
      { name: 'step', type: 'int', required: true, example: 2 },
      { name: 'count', type: 'int', required: true, example: 5 },
    ],
  },
  array: {
    description: 'A rectangular array of dots — multiplication as rows × columns.',
    fields: [
      { name: 'a', type: 'int', required: true, example: 3 },
      { name: 'b', type: 'int', required: true, example: 4 },
    ],
  },
  groups: {
    description: 'A total shared into equal groups — division as sharing.',
    fields: [
      { name: 'total', type: 'int', required: true, example: 12 },
      { name: 'groups', type: 'int', required: true, example: 3 },
    ],
  },
  repeatadd: {
    description: 'Repeated addition building toward a product (a + a + … = a × b).',
    fields: [
      { name: 'a', type: 'int', required: true, example: 3 },
      { name: 'b', type: 'int', required: true, example: 4 },
      { name: 'run', type: 'int', required: false, example: 0, note: 'bump to replay the animation' },
    ],
  },
  multable: {
    description: 'A multiplication grid that sweeps to the answer cell (row × col).',
    fields: [{ name: 'hint', type: 'object', required: true, example: { row: 3, col: 4, mode: 'row' }, note: '{ row, col, mode }' }],
  },
  fracpie: {
    description: 'A fraction as a pie and a bar: k of n parts shaded.',
    fields: [
      { name: 'k', type: 'int', required: true, example: 1, note: 'shaded parts (numerator)' },
      { name: 'n', type: 'int', required: true, example: 4, note: 'total parts (denominator)' },
    ],
  },
  fracbar: {
    description: 'A fraction bar split into n parts with k shaded.',
    fields: [
      { name: 'n', type: 'int', required: true, example: 4, note: 'total parts' },
      { name: 'k', type: 'int', required: true, example: 3, note: 'shaded parts' },
    ],
  },
  equiv: {
    description: 'Equivalent fractions: a/b scaled by m to show why they are equal.',
    fields: [
      { name: 'a', type: 'int', required: true, example: 1 },
      { name: 'b', type: 'int', required: true, example: 2 },
      { name: 'm', type: 'int', required: true, example: 2, note: 'multiplier' },
    ],
  },
  compfrac: {
    description: 'Two fractions side by side (k1/n1 vs k2/n2) for comparing.',
    fields: [
      { name: 'k1', type: 'int', required: true, example: 1 },
      { name: 'n1', type: 'int', required: true, example: 2 },
      { name: 'k2', type: 'int', required: true, example: 2 },
      { name: 'n2', type: 'int', required: true, example: 3 },
    ],
  },
  addfrac: {
    description: 'Adding fractions with a like denominator: a/n + b/n.',
    fields: [
      { name: 'a', type: 'int', required: true, example: 1 },
      { name: 'b', type: 'int', required: true, example: 2 },
      { name: 'n', type: 'int', required: true, example: 5, note: 'shared denominator' },
    ],
  },
  roundline: {
    description: 'A number line showing which nearby multiple a value rounds to.',
    fields: [
      { name: 'v', type: 'int', required: true, example: 47 },
      { name: 'unit', type: 'int', required: true, example: 10, note: 'round to nearest this (10, 100…)' },
    ],
  },
  decgrid: {
    description: 'A hundred-grid shading a decimal value (tenths/hundredths).',
    fields: [{ name: 'value', type: 'number', required: true, example: 0.45 }],
  },
  compdec: {
    description: 'Two decimals aligned by place value for comparing.',
    fields: [
      { name: 'a', type: 'number', required: true, example: 0.4 },
      { name: 'b', type: 'number', required: true, example: 0.38 },
    ],
  },
  adddec: {
    description: 'Adding two decimals, lined up on the decimal point.',
    fields: [
      { name: 'a', type: 'number', required: true, example: 1.2 },
      { name: 'b', type: 'number', required: true, example: 0.45 },
    ],
  },
  dechop: {
    description: 'Multiplying/dividing a decimal by 10/100 — the point hops places.',
    fields: [
      { name: 'from', type: 'number', required: true, example: 3.4 },
      { name: 'factor', type: 'int', required: true, example: 10 },
      { name: 'op', type: 'enum', required: false, example: '×', note: "'×' | '÷'" },
    ],
  },
  coins: {
    description: 'A tray of coins to count a money amount / make change.',
    fields: [{ name: 'coins', type: 'int[]', required: true, example: [25, 10], note: 'coin values in cents' }],
  },
  clock: {
    description: 'An analog clock set to a time, for telling time.',
    fields: [
      { name: 'h', type: 'int', required: true, example: 3 },
      { name: 'm', type: 'int', required: true, example: 30 },
    ],
  },
  elapsed: {
    description: 'Two clocks (start and end) showing elapsed time.',
    fields: [
      { name: 'h1', type: 'int', required: true, example: 2 },
      { name: 'm1', type: 'int', required: true, example: 15 },
      { name: 'dh', type: 'int', required: true, example: 1, note: 'hours elapsed' },
      { name: 'dm', type: 'int', required: true, example: 30, note: 'minutes elapsed' },
    ],
  },
  unitladder: {
    description: 'A unit-conversion ladder (big ↔ small, e.g. m ↔ cm) showing the ×/÷ factor.',
    fields: [
      { name: 'big', type: 'string', required: true, example: 'm' },
      { name: 'small', type: 'string', required: true, example: 'cm' },
      { name: 'per', type: 'int', required: true, example: 100, note: 'small units per big unit' },
      { name: 'n', type: 'int', required: true, example: 2, note: 'the quantity to convert' },
    ],
  },
  shape: {
    description: 'A polygon with its sides counted and named.',
    fields: [
      { name: 'sides', type: 'int', required: true, example: 3 },
      { name: 'name', type: 'string', required: true, example: 'triangle' },
    ],
  },
  symmetry: {
    description: 'A shape/emoji folding along its line of symmetry.',
    fields: [{ name: 'emoji', type: 'string', required: true, example: '🦋' }],
  },
  angle: {
    description: 'An angle sweeping open to a given number of degrees.',
    fields: [{ name: 'deg', type: 'int', required: true, example: 90 }],
  },
  perimeter: {
    description: 'A rectangle with its border traced to teach perimeter.',
    fields: [
      { name: 'w', type: 'int', required: true, example: 4 },
      { name: 'h', type: 'int', required: true, example: 3 },
    ],
  },
  area: {
    description: 'A rectangle filling with unit squares to teach area.',
    fields: [
      { name: 'w', type: 'int', required: true, example: 4 },
      { name: 'h', type: 'int', required: true, example: 3 },
    ],
  },
  volume: {
    description: 'A box stacking unit cubes layer by layer to teach volume.',
    fields: [
      { name: 'l', type: 'int', required: true, example: 3 },
      { name: 'w', type: 'int', required: true, example: 2 },
      { name: 'h', type: 'int', required: true, example: 2 },
    ],
  },
};
