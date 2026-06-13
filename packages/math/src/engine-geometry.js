// ── Geometry Galaxy generators ──────────────────────────────────────────────
// Shapes (count sides), symmetry (pick the mirror-foldable one), angles
// (degrees of right/straight/full turns; angles on a line), perimeter & area
// on unit grids, and volume as cube layers. All answers whole numbers.

import { numClips } from './voiceLines.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const step1 = (over) => ({
  focus: [],
  targets: ['ans-0'],
  effects: [],
  preEffects: [],
  ...over,
});

// ── shapes: how many sides? ─────────────────────────────────────────────────
const SHAPES = [
  { name: 'triangle', sides: 3, band: 0 },
  { name: 'square', sides: 4, band: 0 },
  { name: 'rectangle', sides: 4, band: 0, stretch: true },
  { name: 'pentagon', sides: 5, band: 1 },
  { name: 'hexagon', sides: 6, band: 1 },
  { name: 'octagon', sides: 8, band: 2 },
  { name: 'decagon', sides: 10, band: 2 },
];

export function genShape(band) {
  const sh = pick(SHAPES.filter((s) => s.band === band));
  return {
    kind: 'shape',
    name: sh.name,
    sides: sh.sides,
    stretch: !!sh.stretch,
    result: sh.sides,
    equation: `${sh.name}: ${sh.sides} sides`,
    steps: [
      step1({
        chip: { label: 'Count the sides', color: '#A78BFA' },
        banner: `This is a ${sh.name.toUpperCase()}. Trace it with your eyes — how many sides does it have?`,
        prompt: 'How many sides?',
        hint: `Count each straight edge once, all the way around: ${sh.sides}!`,
        expected: String(sh.sides),
        effects: [{ t: 'ans', col: 0, val: sh.sides }],
        sayQ: ['w-howmanysides'],
        sayA: [`e-${sh.sides}`],
      }),
    ],
  };
}

// ── symmetry: which folds in half? (SVG path pairs) ─────────────────────────
const SYM_SHAPES = [
  { d: 'M50 15 C35 0 10 10 10 32 C10 55 50 85 50 85 C50 85 90 55 90 32 C90 10 65 0 50 15 Z', label: 'heart' },
  { d: 'M50 8 L90 85 L10 85 Z', label: 'triangle' },
  { d: 'M50 6 L61 38 L95 38 L68 58 L78 92 L50 71 L22 92 L32 58 L5 38 L39 38 Z', label: 'star' },
  { d: 'M20 20 H80 V80 H20 Z', label: 'square' },
];
const ASYM_SHAPES = [
  { d: 'M20 10 H75 V25 H38 V45 H68 V60 H38 V90 H20 Z', label: 'flag' },
  { d: 'M12 85 L40 12 L88 70 Z', label: 'leaning triangle' },
  { d: 'M15 70 C20 20 55 10 70 28 C88 50 70 60 78 84 C60 95 25 92 15 70 Z', label: 'blob' },
  { d: 'M25 15 L80 25 L65 50 L85 80 L30 88 L40 50 Z', label: 'zigzag' },
];

export function genSymmetry() {
  const sym = pick(SYM_SHAPES);
  const asym = pick(ASYM_SHAPES);
  const flip = Math.random() < 0.5;
  const shapes = flip ? [asym, sym] : [sym, asym];
  const winner = flip ? 2 : 1;
  return {
    kind: 'sympick',
    shapes,
    winner,
    result: winner,
    equation: `the ${sym.label} is symmetric`,
    steps: [
      step1({
        chip: { label: 'Mirror magic', color: '#F472B6' },
        banner: 'Imagine folding each shape down the middle. Which one folds PERFECTLY in half — 1 or 2?',
        prompt: 'Shape 1 or 2?',
        hint: `Picture a mirror line down the middle: the ${sym.label} matches itself — that's number ${winner}!`,
        expected: String(winner),
        effects: [{ t: 'ans', col: 0, val: winner }],
        sayQ: ['w-whichsym'],
        sayA: [`e-${winner}`],
      }),
    ],
  };
}

// ── angles: degrees of turns; angles on a line ──────────────────────────────
export function genAngle(band) {
  if (band === 2) {
    const a = ri(2, 16) * 10;
    const b = 180 - a;
    return {
      kind: 'angle',
      mode: 'line',
      shown: a,
      result: b,
      equation: `${a}° + ${b}° = 180°`,
      steps: [
        step1({
          chip: { label: 'Angles on a line', color: '#22D3EE' },
          banner: `Two angles share a straight line, and a straight line is 180°. One angle is ${a}° — what is the other?`,
          prompt: `180 − ${a}`,
          hint: `180 − ${a} = ${b}!`,
          expected: String(b),
          effects: [{ t: 'ans', col: 0, val: b }],
          sayQ: ['w-anglesq'],
          sayA: [...numClips(b), 'w-degreesw'],
        }),
      ],
    };
  }
  const opts =
    band === 0
      ? [
          { mode: 'right', ans: 90, text: 'a RIGHT angle (a perfect corner)' },
          { mode: 'straight', ans: 180, text: 'a STRAIGHT line' },
        ]
      : [
          { mode: 'straight', ans: 180, text: 'a STRAIGHT line' },
          { mode: 'full', ans: 360, text: 'a FULL turn (all the way around)' },
          { mode: 'right', ans: 90, text: 'a quarter turn' },
        ];
  const o = pick(opts);
  return {
    kind: 'angle',
    mode: o.mode,
    shown: null,
    result: o.ans,
    equation: `${o.text} = ${o.ans}°`,
    steps: [
      step1({
        chip: { label: 'Degrees', color: '#22D3EE' },
        banner: `How many degrees in ${o.text}?`,
        prompt: 'How many degrees?',
        hint: `Remember: right angle 90°, straight line 180°, full turn 360°. This one is ${o.ans}°!`,
        expected: String(o.ans),
        effects: [{ t: 'ans', col: 0, val: o.ans }],
        sayQ: ['w-anglesq'],
        sayA: [...numClips(o.ans), 'w-degreesw'],
      }),
    ],
  };
}

// ── perimeter & area on a unit grid ─────────────────────────────────────────
export function genRectMeasure(mode, band) {
  const hi = band === 0 ? 5 : band === 1 ? 7 : 9;
  const w = ri(2, hi);
  let h = ri(2, Math.min(hi, 6));
  if (mode === 'perimeter' && band === 2 && Math.random() < 0.4) h = w; // squares too
  const ans = mode === 'perimeter' ? 2 * (w + h) : w * h;
  return {
    kind: 'rectgrid',
    w, h, mode,
    result: ans,
    equation: mode === 'perimeter' ? `2 × (${w} + ${h}) = ${ans}` : `${w} × ${h} = ${ans}`,
    steps: [
      step1({
        chip: { label: mode === 'perimeter' ? 'All the way around' : 'Cover it up', color: mode === 'perimeter' ? '#FFE066' : '#4ADE80' },
        banner:
          mode === 'perimeter'
            ? `The rectangle is ${w} long and ${h} tall. Walk all the way around it — what is the perimeter?`
            : `The rectangle is ${w} long and ${h} tall. How many little squares cover it? (That's the area!)`,
        prompt: mode === 'perimeter' ? `2 × (${w} + ${h})` : `${w} × ${h}`,
        hint:
          mode === 'perimeter'
            ? `Add all four sides: ${w} + ${h} + ${w} + ${h} = ${ans}!`
            : `It's ${h} rows of ${w} squares — multiply: ${w} × ${h} = ${ans}!`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: [mode === 'perimeter' ? 'w-perimq' : 'w-areaq'],
        sayA: numClips(ans),
      }),
    ],
  };
}

// ── volume: layers of cubes ─────────────────────────────────────────────────
export function genVolume(band) {
  const l = ri(2, band === 0 ? 4 : 4);
  const w = ri(2, 3);
  const h = band === 0 ? 1 : band === 1 ? 2 : 3;
  const layer = l * w;
  const total = layer * h;
  const steps = [];
  if (h > 1) {
    steps.push(
      step1({
        chip: { label: 'One layer', color: '#FFE066' },
        banner: `Look at the bottom layer: ${l} cubes by ${w} cubes. How many cubes in ONE layer?`,
        prompt: `${l} × ${w}`,
        hint: `${l} × ${w} = ${layer}!`,
        expected: String(layer),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: layer }],
        sayQ: ['w-whatis', `n-${l}`, 'w-times', `n-${w}`],
        sayA: [`n-${l}`, 'w-times', `n-${w}`, 'w-is', `e-${layer}`],
      }),
    );
  }
  steps.push(
    step1({
      chip: { label: 'Fill the box', color: '#A78BFA' },
      banner:
        h > 1
          ? `There are ${h} layers of ${layer} cubes. How many cubes fill the whole box?`
          : `The box holds ${w} rows of ${l} cubes. How many cubes is that?`,
      prompt: h > 1 ? `${h} × ${layer}` : `${l} × ${w}`,
      hint: h > 1 ? `${h} × ${layer} = ${total}!` : `${l} × ${w} = ${total}!`,
      expected: String(total),
      targets: ['ans-0'],
      effects: [{ t: 'ans', col: 0, val: total }],
      sayQ: ['w-volq'],
      sayA: numClips(total),
    }),
  );
  return {
    kind: 'cubes',
    l, w, h, layer,
    result: total,
    equation: `${l} × ${w} × ${h} = ${total}`,
    steps,
  };
}
