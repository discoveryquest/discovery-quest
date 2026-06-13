// ── Facts wave generators (Worlds 1–2) ──────────────────────────────────────
// Early-elementary question types: counting, comparison, number bonds,
// add/sub facts, tens & ones, two-digit no-regroup, skip counting, even/odd.
// Same step contract as engine.js (prompt/expected/hint/effects/sayQ/sayA),
// so the quest flow, narration, and hints all work unchanged.

import { numClips } from './voiceLines.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const C = { green: '#4ADE80', cyan: '#22D3EE', yellow: '#FFE066', purple: '#A78BFA', pink: '#F472B6' };

const step1 = (over) => ({
  focus: [],
  targets: ['ans-0'],
  effects: [],
  preEffects: [],
  ...over,
});

// ── counting: a field of dots, "How many?" ──────────────────────────────────
export function genCounting(band) {
  const n = band === 0 ? ri(3, 10) : band === 1 ? ri(11, 20) : ri(21, 30);
  return {
    kind: 'dots',
    n,
    result: n,
    equation: `${n} dots!`,
    steps: [
      step1({
        chip: { label: 'Counting', color: C.green },
        banner: band === 0 ? 'Count the dots — point at each one!' : 'Count the dots! The rows have 5 each — count by fives!',
        prompt: 'How many dots?',
        hint: `Count one row at a time: 5, 10, 15... then add the extra ones. There are ${n}!`,
        expected: String(n),
        effects: [{ t: 'ans', col: 0, val: n }],
        sayQ: ['w-howmanydots'],
        sayA: [`e-${n}`],
      }),
    ],
  };
}

// ── compare: which is bigger / smaller ──────────────────────────────────────
export function genCompare(band) {
  const hi = band === 0 ? 10 : band === 1 ? 50 : 100;
  let a = ri(1, hi);
  let b = ri(1, hi);
  while (b === a) b = ri(1, hi);
  if (band === 2) {
    // tricky near-misses like 67 vs 76
    a = ri(12, 98);
    const swapped = Number(String(a).split('').reverse().join(''));
    b = swapped !== a && swapped <= 100 ? swapped : Math.min(100, a + ri(1, 9));
  }
  const bigger = Math.random() < 0.5;
  const ans = bigger ? Math.max(a, b) : Math.min(a, b);
  const tensDiffer = Math.floor(a / 10) !== Math.floor(b / 10);
  const hint =
    a >= 10 || b >= 10
      ? tensDiffer
        ? `Compare the tens first: ${Math.max(a, b)} has more tens, so it's bigger. The ${bigger ? 'bigger' : 'smaller'} one is ${ans}!`
        : `The tens are the same, so compare the ONES: ${Math.max(a, b)} has more ones. The ${bigger ? 'bigger' : 'smaller'} one is ${ans}!`
      : `Count up — the later number is bigger! The ${bigger ? 'bigger' : 'smaller'} one is ${ans}.`;
  return {
    kind: 'pick',
    vals: [a, b],
    pickLabel: bigger ? 'Type the BIGGER number!' : 'Type the SMALLER number!',
    result: ans,
    equation: `${ans} is ${bigger ? 'bigger' : 'smaller'}!`,
    steps: [
      step1({
        chip: { label: bigger ? 'Bigger!' : 'Smaller!', color: C.cyan },
        banner: `Look at both numbers. Which one is ${bigger ? 'BIGGER' : 'SMALLER'}? Type it!`,
        prompt: `${a} or ${b}?`,
        hint,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: [bigger ? 'w-whichbigger' : 'w-whichsmaller', `n-${a}`, `n-${b}`],
        sayA: [`e-${ans}`],
      }),
    ],
  };
}

// ── bonds: a + ? = target (10 / 20 / 100 by tens) ───────────────────────────
export function genBonds(band) {
  const target = band === 0 ? 10 : band === 1 ? 20 : 100;
  const a = band === 2 ? ri(1, 9) * 10 : ri(1, target - 1);
  const need = target - a;
  return {
    kind: 'bond',
    a,
    target,
    result: need,
    equation: `${a} + ${need} = ${target}`,
    steps: [
      step1({
        chip: { label: `Friends of ${target}`, color: C.yellow },
        banner: `${a} plus what makes ${target}? Fill the magic box!`,
        prompt: `${a} + ? = ${target}`,
        hint: `Count up from ${a} until you reach ${target}. How many hops did you take?`,
        expected: String(need),
        effects: [{ t: 'ans', col: 0, val: need }],
        sayQ: [`n-${a}`, 'w-pluswhat', `n-${target}`],
        sayA: [`n-${a}`, 'w-plus', `n-${need}`, 'w-is', `e-${target}`],
        interactiveHint: target <= 20 ? { kind: 'numberline', start: a, op: 'bondup', target } : undefined,
      }),
    ],
  };
}

// ── add/sub facts within 20 ─────────────────────────────────────────────────
export function genFact(op, band) {
  let a, b;
  if (op === 'add') {
    if (band === 0) {
      a = ri(1, 9);
      b = ri(1, 10 - a);
    } else if (band === 1) {
      a = ri(2, 10);
      b = ri(2, Math.min(10, 20 - a));
    } else {
      a = ri(6, 9);
      b = ri(11 - a, 9); // always crosses ten
    }
  } else {
    if (band === 0) {
      a = ri(2, 10);
      b = ri(1, a - 1);
    } else if (band === 1) {
      a = ri(11, 20);
      b = ri(1, a - 11); // stays above 10, no crossing
    } else {
      a = ri(11, 18);
      b = ri(a - 9, 9); // crosses back below ten
    }
  }
  const ans = op === 'add' ? a + b : a - b;
  const sym = op === 'add' ? '+' : '−';
  return {
    kind: 'fact',
    a,
    b,
    op,
    result: ans,
    equation: `${a} ${sym} ${b} = ${ans}`,
    steps: [
      step1({
        chip: { label: op === 'add' ? 'Adding' : 'Taking away', color: op === 'add' ? C.green : C.pink },
        banner: `What is ${a} ${sym} ${b}?`,
        prompt: `${a} ${sym} ${b}`,
        hint:
          op === 'add'
            ? `Start at ${a} and count up ${b} on your fingers!`
            : `Start at ${a} and hop back ${b} steps!`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: ['w-whatis', `n-${a}`, op === 'add' ? 'w-plus' : 'w-minus', `n-${b}`],
        sayA: [`n-${a}`, op === 'add' ? 'w-plus' : 'w-minus', `n-${b}`, 'w-is', `e-${ans}`],
        interactiveHint: { kind: 'numberline', start: a, op, delta: b },
      }),
    ],
  };
}

// ── tens & ones (and hundreds at band 2) with block visuals ─────────────────
export function genPlaceValue(band) {
  const h = band === 2 ? ri(1, 9) : 0;
  const t = band === 0 ? ri(1, 3) : ri(1, 9);
  const o = band === 0 ? ri(1, 9) : ri(0, 9);
  const n = h * 100 + t * 10 + o;
  const steps = [];
  if (h) {
    steps.push(
      step1({
        chip: { label: 'Hundreds', color: C.purple },
        banner: 'Count the big hundred squares!',
        prompt: 'How many hundreds?',
        hint: `Each big square is 100. There are ${h}!`,
        expected: String(h),
        targets: ['ans-2'],
        effects: [{ t: 'ans', col: 2, val: h }],
        sayQ: ['w-howmanyhundreds'],
        sayA: [`e-${h}`],
      }),
    );
  }
  steps.push(
    step1({
      chip: { label: 'Tens', color: C.cyan },
      banner: 'Count the tall ten-rods!',
      prompt: 'How many tens?',
      hint: `Each tall rod is 10. Count the rods — there are ${t}!`,
      expected: String(t),
      targets: ['ans-1'],
      effects: [{ t: 'ans', col: 1, val: t }],
      sayQ: ['w-howmanytens'],
      sayA: [`e-${t}`],
    }),
    step1({
      chip: { label: 'Ones', color: C.yellow },
      banner: 'Count the little one-blocks!',
      prompt: 'How many ones?',
      hint: `Count the small squares one by one — there are ${o}!`,
      expected: String(o),
      targets: ['ans-0'],
      effects: [{ t: 'ans', col: 0, val: o }],
      sayQ: ['w-howmanyones'],
      sayA: [`e-${o}`],
    }),
    step1({
      chip: { label: 'All together', color: C.green },
      banner: `${h ? `${h} hundreds, ` : ''}${t} tens and ${o} ones — what number is that?`,
      prompt: 'What number?',
      hint: `${h ? `${h} hundreds is ${h * 100}, ` : ''}${t} tens is ${t * 10}, plus ${o} ones... ${n}!`,
      expected: String(n),
      targets: ['tot-0'],
      effects: [{ t: 'total', col: 0, val: n }],
      sayQ: ['w-whatnumber'],
      sayA: numClips(n),
    }),
  );
  return { kind: 'pv', h, t, o, n, result: n, equation: `${n}!`, steps };
}

// ── two-digit add/sub without regrouping (renders on the long boards) ───────
export function genTwoDigitNR(band) {
  const op = band === 0 ? 'add' : band === 1 ? 'sub' : pick(['add', 'sub']);
  let a1, a0, b1, b0;
  if (op === 'add') {
    a1 = ri(1, 8);
    b1 = ri(1, 9 - a1);
    a0 = ri(0, 9);
    b0 = ri(0, 9 - a0);
  } else {
    a1 = ri(2, 9);
    b1 = ri(1, a1 - 1);
    a0 = ri(1, 9);
    b0 = ri(0, a0);
  }
  const a = a1 * 10 + a0;
  const b = b1 * 10 + b0;
  const sym = op === 'add' ? '+' : '−';
  const word = op === 'add' ? 'w-plus' : 'w-minus';
  const cols = [
    { i: 0, da: a0, db: b0, name: 'Ones', color: C.yellow },
    { i: 1, da: a1, db: b1, name: 'Tens', color: C.cyan },
  ];
  const steps = cols.map(({ i, da, db, name, color }) => {
    const res = op === 'add' ? da + db : da - db;
    return {
      chip: { label: `${name} column`, color },
      banner: `${name} column: what is ${da} ${sym} ${db}?`,
      prompt: `${da} ${sym} ${db}`,
      hint: op === 'add' ? `Count up from ${da} by ${db}.` : `Count down from ${da} by ${db}.`,
      expected: String(res),
      focus: [`a-${i}`, `b-${i}`],
      targets: [`ans-${i}`],
      effects: [{ t: 'ans', col: i, val: res }],
      preEffects: [],
      sayQ: ['w-whatis', `n-${da}`, word, `n-${db}`],
      sayA: [`n-${da}`, word, `n-${db}`, 'w-is', `e-${res}`],
    };
  });
  const result = op === 'add' ? a + b : a - b;
  return {
    kind: op, // reuses the long-arithmetic AddSubBoard
    a, b,
    aD: [a0, a1], bD: [b0, b1],
    width: 2,
    result,
    equation: `${a} ${sym} ${b} = ${result}`,
    steps,
  };
}

// ── skip counting ───────────────────────────────────────────────────────────
export function genSkip(band) {
  const s = band === 0 ? pick([2, 5, 10]) : band === 1 ? pick([3, 4]) : pick([6, 7, 8, 9]);
  const start = s * ri(1, Math.max(1, Math.floor((100 - 5 * s) / s)));
  const seq = [0, 1, 2, 3].map((k) => start + k * s);
  const next = start + 4 * s;
  return {
    kind: 'skip',
    seq,
    stepSize: s,
    result: next,
    equation: `...${seq[2]}, ${seq[3]}, ${next}!`,
    steps: [
      step1({
        chip: { label: `Counting by ${s}s`, color: C.purple },
        banner: `These stones count by ${s}s. What number comes next?`,
        prompt: `${seq.join(', ')}, ?`,
        hint: `Each hop adds ${s}. What is ${seq[3]} + ${s}?`,
        expected: String(next),
        effects: [{ t: 'ans', col: 0, val: next }],
        sayQ: ['w-comesnext'],
        sayA: [`n-${seq[3]}`, 'w-plus', `n-${s}`, 'w-is', `e-${next}`],
      }),
    ],
  };
}

// ── multiplication concept: rows × columns array ────────────────────────────
export function genMulConcept(band) {
  const r = band === 0 ? ri(2, 3) : band === 1 ? ri(2, 5) : ri(3, 6);
  const c = band === 0 ? ri(2, 5) : band === 1 ? ri(2, 5) : ri(4, 9);
  const total = r * c;
  return {
    kind: 'array',
    r, c,
    result: total,
    equation: `${r} × ${c} = ${total}`,
    steps: [
      step1({
        chip: { label: 'Rows', color: C.cyan },
        banner: 'Look at the dot grid. How many ROWS are there?',
        prompt: 'How many rows?',
        hint: `Count going down — there are ${r} rows!`,
        expected: String(r),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: r }],
        sayQ: ['w-howmanyrows'],
        sayA: [`e-${r}`],
      }),
      step1({
        chip: { label: 'In each row', color: C.yellow },
        banner: 'And how many dots are IN each row?',
        prompt: 'How many in each row?',
        hint: `Count across one row — ${c} in each!`,
        expected: String(c),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: c }],
        sayQ: ['w-howmanyeach'],
        sayA: [`e-${c}`],
      }),
      step1({
        chip: { label: 'Multiply!', color: C.purple },
        banner: `${r} rows of ${c}: that's ${r} × ${c}. How many dots in all?`,
        prompt: `${r} × ${c}`,
        hint: `Count by ${c}s, ${r} times: ${Array.from({ length: r }, (_, k) => c * (k + 1)).join(', ')}!`,
        expected: String(total),
        targets: ['tot-0'],
        effects: [{ t: 'total', col: 0, val: total }],
        sayQ: ['w-whatis', `n-${r}`, 'w-times', `n-${c}`],
        sayA: [`n-${r}`, 'w-times', `n-${c}`, 'w-is', `e-${total}`],
        interactiveHint: { kind: 'multable', row: r, col: c },
      }),
    ],
  };
}

// ── times tables: band selects the table set ────────────────────────────────
export const TABLE_SETS = [
  [2, 5, 10],
  [3, 4, 6],
  [7, 8, 9],
];

export function genTables(band) {
  const a = pick(TABLE_SETS[band]);
  const b = ri(2, 10);
  const ans = a * b;
  const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
  return {
    kind: 'fact',
    a: x, b: y,
    op: 'mul',
    result: ans,
    equation: `${x} × ${y} = ${ans}`,
    steps: [
      step1({
        chip: { label: `${a} times table`, color: C.purple },
        banner: `What is ${x} × ${y}?`,
        prompt: `${x} × ${y}`,
        hint: `Skip-count by ${a}: ${Array.from({ length: Math.min(b, 5) }, (_, k) => a * (k + 1)).join(', ')}... do it ${b} times!`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: ['w-whatis', `n-${x}`, 'w-times', `n-${y}`],
        sayA: [`n-${x}`, 'w-times', `n-${y}`, 'w-is', `e-${ans}`],
        interactiveHint: { kind: 'multable', row: x, col: y },
      }),
    ],
  };
}

// ── division facts: the same tables, backwards ──────────────────────────────
export function genDivFacts(band) {
  const d = pick(TABLE_SETS[band]);
  const q = ri(2, 10);
  const dividend = d * q;
  return {
    kind: 'fact',
    a: dividend, b: d,
    op: 'div',
    result: q,
    equation: `${dividend} ÷ ${d} = ${q}`,
    steps: [
      step1({
        chip: { label: 'Division facts', color: C.pink },
        banner: `How many times does ${d} go into ${dividend}?`,
        prompt: `${dividend} ÷ ${d}`,
        hint: `Think backwards: ${d} × what makes ${dividend}? It's ${q}!`,
        expected: String(q),
        effects: [{ t: 'ans', col: 0, val: q }],
        sayQ: ['w-howmany', `n-${d}`, 'w-gointo', `n-${dividend}`],
        sayA: ['w-itfits', `n-${q}`, 'w-timesx'],
        interactiveHint: { kind: 'multable', row: d, col: q, mode: 'div' },
      }),
    ],
  };
}

// ── rounding on a number line ───────────────────────────────────────────────
export function genRounding(band) {
  const unit = band === 0 ? 10 : band === 1 ? 100 : 1000;
  let v;
  do {
    v = band === 0 ? ri(11, 89) : band === 1 ? ri(110, 890) : ri(1100, 8900);
  } while (v % unit === 0);
  const lo = Math.floor(v / unit) * unit;
  const hi = lo + unit;
  const ans = Math.round(v / unit) * unit;
  const unitWord = unit === 10 ? 'ten' : unit === 100 ? 'hundred' : 'thousand';
  const ruleDigit = unit === 10 ? 'ones' : unit === 100 ? 'tens' : 'hundreds';
  return {
    kind: 'numberline',
    v, lo, hi, unit,
    result: ans,
    equation: `${v} ≈ ${ans}`,
    steps: [
      step1({
        chip: { label: `Nearest ${unitWord}`, color: C.cyan },
        banner: `${v} sits between ${lo} and ${hi}. Round it to the nearest ${unitWord}!`,
        prompt: `Round ${v}`,
        hint: `Look at the ${ruleDigit} digit: 5 or more rounds UP, 4 or less rounds DOWN. ${v} rounds to ${ans}!`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: [`w-round${unitWord}`],
        sayA: numClips(ans),
      }),
    ],
  };
}

// ── one-step story problems ─────────────────────────────────────────────────
const NAMES = ['Mia', 'Leo', 'Zoe', 'Max', 'Ava', 'Sam'];
const ITEMS = [
  ['apples', '🍎'], ['stickers', '⭐'], ['marbles', '🔵'], ['cookies', '🍪'],
  ['balloons', '🎈'], ['books', '📚'], ['shells', '🐚'], ['crayons', '🖍️'],
];

export function genStory(band) {
  const name = pick(NAMES);
  let name2 = pick(NAMES);
  while (name2 === name) name2 = pick(NAMES);
  const [item, emoji] = pick(ITEMS);
  const op = band === 2 ? pick(['mul', 'div']) : pick(['add', 'sub']);
  let a, b, ans, text, sayA;
  if (op === 'add') {
    a = band === 0 ? ri(3, 12) : ri(15, 60);
    b = band === 0 ? ri(2, Math.min(8, 20 - a)) : ri(11, 39);
    ans = a + b;
    text = `${name} has ${a} ${item}. ${name2} gives ${name} ${b} more. How many ${item} does ${name} have now?`;
    sayA = [`n-${a}`, 'w-plus', `n-${b}`, 'w-is', ...numClips(ans)];
  } else if (op === 'sub') {
    a = band === 0 ? ri(6, 20) : ri(30, 99);
    b = band === 0 ? ri(2, a - 2) : ri(11, a - 5);
    ans = a - b;
    text = `${name} has ${a} ${item}. ${name} gives ${b} away to ${name2}. How many ${item} are left?`;
    sayA = [`n-${a}`, 'w-minus', `n-${b}`, 'w-is', ...numClips(ans)];
  } else if (op === 'mul') {
    a = ri(3, 9);
    b = ri(3, 9);
    ans = a * b;
    text = `${name} has ${a} bags with ${b} ${item} in each bag. How many ${item} in all?`;
    sayA = [`n-${a}`, 'w-times', `n-${b}`, 'w-is', `e-${ans}`];
  } else {
    b = ri(2, 9);
    ans = ri(3, 9);
    a = b * ans;
    text = `${name} shares ${a} ${item} fairly between ${b} friends. How many ${item} does each friend get?`;
    sayA = ['w-itfits', `n-${ans}`, 'w-timesx'];
  }
  const sym = { add: '+', sub: '−', mul: '×', div: '÷' }[op];
  return {
    kind: 'story',
    text, emoji,
    result: ans,
    equation: `${a} ${sym} ${b} = ${ans}`,
    steps: [
      step1({
        chip: { label: 'Story problem', color: C.green },
        banner: 'Read the story — what is it really asking?',
        prompt: 'How many?',
        hint: `The story is really asking: what is ${a} ${sym} ${b}? That's ${ans}!`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: ['w-storytime'],
        sayA,
      }),
    ],
  };
}

// ── two-step story problems (capstone) ──────────────────────────────────────
export function genStory2(band) {
  const name = pick(NAMES);
  const [item, emoji] = pick(ITEMS);
  const t = band === 0 ? 'buy' : band === 1 ? 'groups' : pick(['give', 'groups', 'buy']);
  let text, mid, final, slotLabels, steps;
  if (t === 'buy') {
    const x = ri(15, 45);
    const y = ri(10, 90 - x);
    mid = x + y;
    final = 100 - mid;
    text = `${name} buys a toy for ${x}¢ and a snack for ${y}¢, and pays with a 100¢ coin.`;
    slotLabels = ['together', 'change'];
    steps = [
      step1({
        chip: { label: 'Step 1: add it up', color: C.green },
        banner: `${text} First: how much do the toy and snack cost TOGETHER?`,
        prompt: `${x} + ${y}`,
        hint: `Add the two prices: ${x} + ${y} = ${mid}¢.`,
        expected: String(mid),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: mid }],
        sayQ: ['w-whatis', `n-${x}`, 'w-plus', `n-${y}`],
        sayA: [`n-${x}`, 'w-plus', `n-${y}`, 'w-is', `e-${mid}`],
      }),
      step1({
        chip: { label: 'Step 2: the change', color: C.yellow },
        banner: `They cost ${mid}¢ together and ${name} pays 100¢. How much change?`,
        prompt: `100 − ${mid}`,
        hint: `Count up from ${mid} to 100: that's ${final}¢ back!`,
        expected: String(final),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: final }],
        sayQ: ['w-howmuchchange'],
        sayA: [...numClips(final), 'w-cents'],
      }),
    ];
  } else if (t === 'groups') {
    const a = ri(2, 6);
    const b = ri(3, 9);
    const c = ri(2, 9);
    mid = a * b;
    final = mid + c;
    text = `${name} has ${a} bags with ${b} ${item} in each, plus ${c} loose ${item}.`;
    slotLabels = ['in bags', 'in all'];
    steps = [
      step1({
        chip: { label: 'Step 1: the bags', color: C.purple },
        banner: `${text} First: how many ${item} are in the bags?`,
        prompt: `${a} × ${b}`,
        hint: `${a} bags of ${b}: ${a} × ${b} = ${mid}.`,
        expected: String(mid),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: mid }],
        sayQ: ['w-whatis', `n-${a}`, 'w-times', `n-${b}`],
        sayA: [`n-${a}`, 'w-times', `n-${b}`, 'w-is', `e-${mid}`],
      }),
      step1({
        chip: { label: 'Step 2: add the loose ones', color: C.green },
        banner: `${mid} in the bags plus the ${c} loose ones — how many in all?`,
        prompt: `${mid} + ${c}`,
        hint: `${mid} + ${c} = ${final}!`,
        expected: String(final),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: final }],
        sayQ: ['w-whatis', `n-${mid}`, 'w-plus', `n-${c}`],
        sayA: [`n-${mid}`, 'w-plus', `n-${c}`, 'w-is', `e-${final}`],
      }),
    ];
  } else {
    const a = ri(25, 70);
    const b = ri(8, a - 10);
    const c = ri(5, 25);
    mid = a - b;
    final = mid + c;
    text = `${name} has ${a} ${item}, gives ${b} away, then earns ${c} more.`;
    slotLabels = ['after giving', 'at the end'];
    steps = [
      step1({
        chip: { label: 'Step 1: give some away', color: C.pink },
        banner: `${text} First: how many after giving ${b} away?`,
        prompt: `${a} − ${b}`,
        hint: `${a} − ${b} = ${mid}.`,
        expected: String(mid),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: mid }],
        sayQ: ['w-whatis', `n-${a}`, 'w-minus', `n-${b}`],
        sayA: [`n-${a}`, 'w-minus', `n-${b}`, 'w-is', `e-${mid}`],
      }),
      step1({
        chip: { label: 'Step 2: earn more', color: C.green },
        banner: `Then ${name} earns ${c} more. How many at the end?`,
        prompt: `${mid} + ${c}`,
        hint: `${mid} + ${c} = ${final}!`,
        expected: String(final),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: final }],
        sayQ: ['w-whatis', `n-${mid}`, 'w-plus', `n-${c}`],
        sayA: [`n-${mid}`, 'w-plus', `n-${c}`, 'w-is', `e-${final}`],
      }),
    ];
  }
  return {
    kind: 'story2',
    text, emoji, slotLabels, mid,
    result: final,
    equation: `→ ${final}`,
    steps,
  };
}

// ── even or odd: find the matching number of a pair ─────────────────────────
export function genEvenOdd(band) {
  const hi = band === 0 ? 10 : band === 1 ? 50 : 100;
  const wantEven = Math.random() < 0.5;
  let even = 2 * ri(1, Math.floor(hi / 2));
  let odd = 2 * ri(1, Math.floor((hi - 1) / 2)) - 1;
  const ans = wantEven ? even : odd;
  const vals = Math.random() < 0.5 ? [even, odd] : [odd, even];
  return {
    kind: 'pick',
    vals,
    pickLabel: wantEven ? 'Type the EVEN number!' : 'Type the ODD number!',
    result: ans,
    equation: `${ans} is ${wantEven ? 'even' : 'odd'}!`,
    steps: [
      step1({
        chip: { label: wantEven ? 'Even!' : 'Odd!', color: C.pink },
        banner: `One of these is ${wantEven ? 'EVEN (makes pairs with none left over)' : 'ODD (one is always left out)'}. Type it!`,
        prompt: `${vals[0]} or ${vals[1]}?`,
        hint: `Look at the LAST digit! 0, 2, 4, 6, 8 mean even — 1, 3, 5, 7, 9 mean odd. The ${wantEven ? 'even' : 'odd'} one is ${ans}.`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: [wantEven ? 'w-typeeven' : 'w-typeodd', `n-${vals[0]}`, `n-${vals[1]}`],
        sayA: [`e-${ans}`],
      }),
    ],
  };
}
