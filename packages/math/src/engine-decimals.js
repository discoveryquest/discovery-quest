// ── Decimal Docks generators ────────────────────────────────────────────────
// Decimals are spoken digit-by-digit after "point" ("three point four seven")
// and every typed answer stays integer digits: place-value digits, a 1/2
// pick, whole-number results for point-hopping, or the digits after "0.".
// Column add/sub reuses the long-arithmetic board via kind 'add'/'sub' + dp.

import { numClips } from './voiceLines.js';
import { placeOf } from './engine.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const DEC_PLACES = [
  { name: 'Tenths', color: '#FB923C' },
  { name: 'Hundredths', color: '#F472B6' },
];
// place name/color for column i when there are dp decimal digits (LSB order)
export const decPlaceOf = (i, dp) => (i < dp ? DEC_PLACES[dp - 1 - i] : placeOf(i - dp));

const step1 = (over) => ({
  focus: [],
  targets: ['ans-0'],
  effects: [],
  preEffects: [],
  ...over,
});

// "three point four seven" — integer part clips, then digits one by one
export function decClips(str, final = false) {
  const [int, frac = ''] = String(str).split('.');
  const out = [...numClips(Number(int)).map((k) => (k.startsWith('e-') ? `n-${k.slice(2)}` : k))];
  if (frac.length) {
    out.push('w-point');
    [...frac].forEach((d, i) => out.push(`${final && i === frac.length - 1 ? 'e' : 'n'}-${d}`));
  } else if (final && out.length) {
    const last = out.pop();
    out.push(last.replace(/^n-/, 'e-'));
  }
  return out;
}

// ── place value: name the digit in each place ───────────────────────────────
export function genDecPlace(band) {
  const tens = band === 2 ? ri(1, 9) : 0;
  const ones = ri(1, 9);
  const tenths = ri(1, 9);
  const hundredths = band >= 1 ? ri(1, 9) : null;
  const str = `${tens ? tens : ''}${ones}.${tenths}${hundredths ?? ''}`;
  const asks = [
    band === 2 && { place: 'ones', digit: ones, col: 2, say: 'w-whichonesd', color: '#FFE066' },
    { place: 'tenths', digit: tenths, col: 1, say: 'w-whichtenths', color: '#FB923C' },
    hundredths !== null && { place: 'hundredths', digit: hundredths, col: 0, say: 'w-whichhundredths', color: '#F472B6' },
  ].filter(Boolean);
  return {
    kind: 'decplace',
    str, tens, ones, tenths, hundredths,
    result: Number(str),
    sayResult: decClips(str, true),
    equation: str,
    steps: asks.map((a) =>
      step1({
        chip: { label: `${a.place[0].toUpperCase()}${a.place.slice(1)} place`, color: a.color },
        banner: `Look at ${str}. Which digit sits in the ${a.place.toUpperCase()} place?`,
        prompt: `${a.place} digit?`,
        hint:
          a.place === 'ones'
            ? `The ones digit is just LEFT of the point — it's ${a.digit}!`
            : `Count ${a.place === 'tenths' ? 'one step' : 'two steps'} RIGHT of the point — it's ${a.digit}!`,
        expected: String(a.digit),
        targets: [`ans-${a.col}`],
        effects: [{ t: 'ans', col: a.col, val: a.digit }],
        sayQ: [a.say],
        sayA: [`e-${a.digit}`],
      }),
    ),
  };
}

// ── compare decimals: type 1 or 2 ───────────────────────────────────────────
export function genDecCompare(band) {
  let s1, s2;
  if (band === 0) {
    const int = ri(0, 9);
    let t1 = ri(1, 9);
    let t2 = ri(1, 9);
    while (t2 === t1) t2 = ri(1, 9);
    s1 = `${int}.${t1}`;
    s2 = `${int}.${t2}`;
  } else if (band === 1) {
    // the classic trap: 0.5 vs 0.45 — longer is NOT bigger
    const t = ri(2, 9);
    s1 = `0.${t}`;
    s2 = `0.${t - 1}${ri(1, 9)}`;
  } else {
    const int = ri(0, 4);
    const t = ri(1, 9);
    s1 = `${int}.0${t}`;
    s2 = `${int}.${t}`;
  }
  if (Math.random() < 0.5) [s1, s2] = [s2, s1];
  const winner = parseFloat(s1) > parseFloat(s2) ? 1 : 2;
  const w = winner === 1 ? s1 : s2;
  return {
    kind: 'decpick',
    vals: [s1, s2],
    pickLabel: 'Type 1 or 2 — which number is BIGGER?',
    winner,
    result: winner,
    equation: `${w} is bigger`,
    steps: [
      step1({
        chip: { label: 'Compare!', color: '#22D3EE' },
        banner: 'Line up the decimal points in your head. Which number is bigger — 1 or 2?',
        prompt: `${s1} or ${s2}?`,
        hint:
          band >= 1
            ? `Compare place by place after the point — extra digits don't mean bigger! ${w} wins.`
            : `Same ones digit, so compare the tenths. ${w} is bigger!`,
        expected: String(winner),
        effects: [{ t: 'ans', col: 0, val: winner }],
        sayQ: ['w-whichbigger'],
        sayA: decClips(w, true),
      }),
    ],
  };
}

// ── column add/sub with a decimal point (renders on AddSubBoard via dp) ─────
export function genDecAddSub(band) {
  const dp = band === 2 ? 2 : 1;
  const intDigits = band === 0 ? 1 : 2;
  const len = dp + intDigits;
  const op = band >= 1 && Math.random() < 0.5 ? 'sub' : 'add';
  const digits = () => Array.from({ length: len }, (_, i) => (i === len - 1 ? ri(1, 9) : ri(0, 9)));
  let A = digits();
  let B = digits();
  if (op === 'sub') {
    // digit-wise a≥b keeps borrowing out of the decimal intro (taught earlier)
    B = A.map((d) => ri(0, d));
    if (B.every((d, i) => d === A[i])) B[0] = Math.max(0, A[0] - 1);
  }
  const toNum = (D) => D.reduce((a, d, i) => a + d * 10 ** i, 0);
  const a = toNum(A);
  const b = toNum(B);
  const result = op === 'add' ? a + b : a - b;
  const show = (v) => (v / 10 ** dp).toFixed(dp);
  const sym = op === 'add' ? '+' : '−';
  const word = op === 'add' ? 'w-plus' : 'w-minus';
  const steps = [];
  let carry = 0;
  const n = len;
  const width = Math.max(String(result).length, n);
  for (let i = 0; i < n; i++) {
    const da = A[i];
    const db = B[i];
    const s = op === 'add' ? da + db + carry : da - db;
    const w = op === 'add' ? s % 10 : s;
    const c = op === 'add' ? Math.floor(s / 10) : 0;
    const isLast = i === n - 1;
    const pl = decPlaceOf(i, dp);
    const effects = [{ t: 'ans', col: i, val: w }];
    const targets = [`ans-${i}`];
    if (c) {
      if (isLast) {
        effects.push({ t: 'ans', col: i + 1, val: c });
        targets.push(`ans-${i + 1}`);
      } else {
        effects.push({ t: 'carry', col: i + 1, val: c });
        targets.push(`carry-${i + 1}`);
      }
    }
    steps.push({
      chip: { label: `${pl.name} column`, color: pl.color },
      banner: `${pl.name} column: what is ${da} ${sym} ${db}${op === 'add' && carry ? ` + the carried ${carry}` : ''}? The point just rides along!`,
      prompt: op === 'add' && carry ? `${da} + ${db} + ${carry}` : `${da} ${sym} ${db}`,
      hint:
        op === 'add' && s >= 10
          ? `${da} + ${db}${carry ? ` + ${carry}` : ''} is ${s} — write the ${w}, carry the ${c}. Type both digits!`
          : `Work the column like whole numbers — the decimal point stays put.`,
      expected: String(s),
      focus: [`a-${i}`, `b-${i}`, ...(op === 'add' && carry ? [`carry-${i}`] : [])],
      targets,
      effects,
      preEffects: [],
      sayQ: ['w-whatis', `n-${da}`, word, `n-${db}`, ...(op === 'add' && carry ? ['w-plus', `n-${carry}`] : [])],
      sayA: [`n-${da}`, word, `n-${db}`, ...(op === 'add' && carry ? ['w-plus', `n-${carry}`] : []), 'w-is', `e-${s}`],
    });
    carry = c;
  }
  return {
    kind: op,
    dp,
    a: Number(show(a)),
    b: Number(show(b)),
    aD: A,
    bD: B,
    width,
    result: Number(show(result)),
    equation: `${show(a)} ${sym} ${show(b)} = ${show(result)}`,
    sayResult: decClips(show(result), true),
    steps,
  };
}

// ── × and ÷ by 10/100: the point hops, answers stay whole ───────────────────
export function genDecPow10(band) {
  let from, factor, dir, ans;
  if (band === 0) {
    const x = ri(11, 99);
    from = (x / 10).toFixed(1);
    factor = 10;
    dir = '×';
    ans = x;
  } else if (band === 1) {
    const x = ri(101, 999);
    from = (x / 100).toFixed(2);
    factor = 100;
    dir = '×';
    ans = x;
  } else {
    factor = pick([10, 100]);
    ans = ri(2, 99);
    from = String(ans * factor);
    dir = '÷';
  }
  const hops = factor === 10 ? 1 : 2;
  return {
    kind: 'dechop',
    from, factor, dir, hops,
    result: ans,
    equation: `${from} ${dir} ${factor} = ${ans}`,
    steps: [
      step1({
        chip: { label: `${dir} ${factor}`, color: '#22D3EE' },
        banner: `${dir === '×' ? 'Multiplying' : 'Dividing'} by ${factor} makes the point hop ${hops} place${hops > 1 ? 's' : ''} to the ${dir === '×' ? 'RIGHT' : 'LEFT'}. What is ${from} ${dir} ${factor}?`,
        prompt: `${from} ${dir} ${factor}`,
        hint: `Slide the point ${hops} hop${hops > 1 ? 's' : ''} ${dir === '×' ? 'right' : 'left'}: you get ${ans}!`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: ['w-hopq'],
        sayA: numClips(ans),
      }),
    ],
  };
}

// ── fractions ↔ decimals: type the digits after "0." ────────────────────────
export function genDecConvert(band) {
  const sets = [
    [
      ...[1, 3, 7, 9].map((k) => [k, 10, String(k)]),
      [1, 2, '5'],
      ...[1, 2, 3, 4].map((k) => [k, 5, String(k * 2)]),
    ],
    [
      [1, 4, '25'],
      [3, 4, '75'],
      [1, 2, '50'],
      ...[3, 7, 9, 11, 13].map((k) => [k, 100, String(k).padStart(2, '0')]),
    ],
    [
      [1, 4, '25'],
      [3, 4, '75'],
      ...[1, 3].map((k) => [k, 20, String(k * 5).padStart(2, '0')]),
      ...[31, 47, 99].map((k) => [k, 100, String(k)]),
    ],
  ];
  const [a, b, digits] = pick(sets[band]);
  return {
    kind: 'decconv',
    a, b, digits,
    result: Number(`0.${digits}`),
    sayResult: decClips(`0.${digits}`, true),
    equation: `${a}/${b} = 0.${digits}`,
    steps: [
      step1({
        chip: { label: 'Fraction → decimal', color: '#A78BFA' },
        banner: `Write ${a} out of ${b} as a decimal: 0.something. Type the missing digit${digits.length > 1 ? 's' : ''}!`,
        prompt: `${a}/${b} = 0.?`,
        hint:
          b === 10 || b === 100
            ? `${a} out of ${b} is just ${a} ${b === 10 ? 'tenths' : 'hundredths'}: 0.${digits}!`
            : `Make the bottom 100: ${a}/${b} = ${Number(`0.${digits}`) * 100}/100 = 0.${digits}!`,
        expected: digits,
        targets: digits.length > 1 ? ['ans-1', 'ans-0'] : ['ans-0'],
        effects: [...digits].map((d, i) => ({ t: 'ans', col: digits.length - 1 - i, val: Number(d) })),
        sayQ: [`n-${a}`, 'w-outof', `n-${b}`, 'w-asdecimal'],
        sayA: decClips(`0.${digits}`, true),
      }),
    ],
  };
}
