// ── Fraction Forest generators ──────────────────────────────────────────────
// Fractions are spoken kid-style as "a out of b", which lets the whole
// concatenative number vocabulary do the work. All answers stay numeric
// (numerators, part counts, or a 1/2 pick), so the keypad never changes.

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

const sayFrac = (k, n, final = false) => [`n-${k}`, 'w-outof', final ? `e-${n}` : `n-${n}`];

// ── concept: one pie, count the parts then the shaded ones ──────────────────
export function genFracConcept(band) {
  const n = band === 0 ? pick([2, 3, 4]) : band === 1 ? pick([5, 6, 8]) : pick([7, 9, 10, 12]);
  const k = ri(1, n - 1);
  return {
    kind: 'pie',
    n, k,
    result: k,
    equation: `${k}/${n} shaded`,
    steps: [
      step1({
        chip: { label: 'Equal parts', color: C.cyan },
        banner: 'Look at the pie! How many EQUAL parts is it cut into?',
        prompt: 'How many parts?',
        hint: `Count every slice, shaded or not — there are ${n}!`,
        expected: String(n),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: n }],
        sayQ: ['w-howmanyparts'],
        sayA: [`e-${n}`],
      }),
      step1({
        chip: { label: 'Shaded parts', color: C.green },
        banner: `And how many of the ${n} parts are shaded?`,
        prompt: 'How many shaded?',
        hint: `Count only the colored slices — ${k}! That makes the fraction ${k} out of ${n}.`,
        expected: String(k),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: k }],
        sayQ: ['w-howmanyshaded'],
        sayA: sayFrac(k, n, true),
      }),
    ],
  };
}

// ── equivalent fractions: a/b = ?/(b·m) with two pies ───────────────────────
export function genFracEquiv(band) {
  const b = pick([2, 3, 4]);
  const a = ri(1, b - 1);
  const m = band === 0 ? 2 : band === 1 ? pick([2, 3]) : pick([3, 4]);
  const B = b * m;
  const A = a * m;
  return {
    kind: 'fracequiv',
    a, b, A, B,
    result: A,
    equation: `${a}/${b} = ${A}/${B}`,
    steps: [
      step1({
        chip: { label: 'Same size!', color: C.purple },
        banner: `${a} out of ${b} covers the same amount as how many out of ${B}?`,
        prompt: `${a}/${b} = ?/${B}`,
        hint: `Each of the ${b} big slices became ${m} small ones — so multiply the top by ${m} too: ${A}!`,
        expected: String(A),
        effects: [{ t: 'ans', col: 0, val: A }],
        sayQ: [`n-${a}`, 'w-outof', `n-${b}`, 'w-samehow', `e-${B}`],
        sayA: [...sayFrac(a, b), 'w-is', ...sayFrac(A, B, true)],
      }),
    ],
  };
}

// ── compare: two pies, type 1 or 2 ──────────────────────────────────────────
export function genFracCompare(band) {
  let f1, f2;
  if (band === 0) {
    const n = pick([3, 4, 5, 6, 8]);
    let k1 = ri(1, n - 1);
    let k2 = ri(1, n - 1);
    while (k2 === k1) k2 = ri(1, n - 1);
    f1 = { k: k1, n };
    f2 = { k: k2, n };
  } else if (band === 1) {
    // same numerator, different denominators — more slices means smaller!
    const [n1, n2] = pick([[2, 4], [3, 6], [4, 8], [3, 4], [4, 6], [6, 8]]);
    const k = ri(1, Math.min(n1, n2) - 1);
    f1 = { k, n: n1 };
    f2 = { k, n: n2 };
  } else {
    do {
      f1 = { n: pick([3, 4, 5, 6]), k: 0 };
      f1.k = ri(1, f1.n - 1);
      f2 = { n: pick([4, 6, 8, 10]), k: 0 };
      f2.k = ri(1, f2.n - 1);
    } while (f1.k * f2.n === f2.k * f1.n); // no ties
  }
  if (Math.random() < 0.5) [f1, f2] = [f2, f1];
  const winner = f1.k / f1.n > f2.k / f2.n ? 1 : 2;
  const w = winner === 1 ? f1 : f2;
  return {
    kind: 'fracpick',
    fracs: [f1, f2],
    winner,
    result: winner,
    equation: `${w.k}/${w.n} is bigger`,
    steps: [
      step1({
        chip: { label: 'Which is more?', color: C.yellow },
        banner: 'Look at how much of each pie is shaded. Type 1 or 2 — which shows MORE?',
        prompt: 'Pie 1 or pie 2?',
        hint:
          band === 1
            ? `Careful — more slices means each slice is SMALLER! Pie ${winner} (${w.k} out of ${w.n}) covers more.`
            : `Compare the shaded areas with your eyes — pie ${winner} (${w.k} out of ${w.n}) covers more!`,
        expected: String(winner),
        effects: [{ t: 'ans', col: 0, val: winner }],
        sayQ: ['w-whichmore'],
        sayA: sayFrac(w.k, w.n, true),
      }),
    ],
  };
}

// ── unlike denominators: convert, then add (two teaching steps) ─────────────
export function genFracAddUnlike(band) {
  const pairs = (band === 0 ? [[2, 2], [3, 2], [4, 2]] : band === 1 ? [[2, 3], [3, 3], [4, 3], [2, 4]] : [[3, 4], [4, 3], [2, 5], [3, 3], [4, 2]])
    .filter(([b, m]) => b * m <= 12);
  const [b, m] = pick(pairs);
  const d = b * m;
  const a = ri(1, b - 1);
  const A = a * m;
  const c = ri(1, d - 1 - A);
  const sum = A + c;
  return {
    kind: 'fracunlike',
    a, b, c, d, A, sum, m,
    result: sum,
    equation: `${a}/${b} + ${c}/${d} = ${sum}/${d}`,
    steps: [
      step1({
        chip: { label: 'Make them match', color: C.purple },
        banner: `The slices don't match! First: ${a} out of ${b} is the same as how many out of ${d}?`,
        prompt: `${a}/${b} = ?/${d}`,
        hint: `Each of the ${b} slices became ${m} smaller ones — multiply the top by ${m}: ${A}!`,
        expected: String(A),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: A }],
        sayQ: [`n-${a}`, 'w-outof', `n-${b}`, 'w-samehow', `e-${d}`],
        sayA: [...sayFrac(a, b), 'w-is', ...sayFrac(A, d, true)],
      }),
      step1({
        chip: { label: 'Now add!', color: C.green },
        banner: `Now the slices match! What is ${A} out of ${d} plus ${c} out of ${d}?`,
        prompt: `${A}/${d} + ${c}/${d}`,
        hint: `Same-size slices now — just add the tops: ${A} + ${c} = ${sum}!`,
        expected: String(sum),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: sum }],
        sayQ: ['w-whatis', ...sayFrac(A, d), 'w-plus', ...sayFrac(c, d)],
        sayA: [...sayFrac(A, d), 'w-plus', ...sayFrac(c, d), 'w-is', ...sayFrac(sum, d, true)],
      }),
    ],
  };
}

// ── mixed numbers: turn an improper fraction into wholes + leftover ─────────
export function genFracMixed(band) {
  const n = band === 0 ? pick([2, 3, 4]) : band === 1 ? pick([3, 4, 5, 6]) : pick([4, 6, 8]);
  const w = band === 0 ? 1 : band === 1 ? ri(1, 2) : ri(2, 3);
  const r = ri(1, n - 1);
  const p = w * n + r;
  return {
    kind: 'fracmixed',
    p, n, w, r,
    result: w,
    equation: `${p}/${n} = ${w} whole${w > 1 ? 's' : ''} + ${r}/${n}`,
    steps: [
      step1({
        chip: { label: 'Whole pies', color: C.yellow },
        banner: `You have ${p} slices, and ${n} slices make a whole pie. How many WHOLE pies can you build?`,
        prompt: `${p} slices of 1/${n}`,
        hint: `Count by ${n}s: every ${n} slices snap into one pie. ${p} slices make ${w} whole pie${w > 1 ? 's' : ''}!`,
        expected: String(w),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: w }],
        sayQ: ['w-howmanywhole'],
        sayA: [`e-${w}`],
      }),
      step1({
        chip: { label: 'Leftover slices', color: C.pink },
        banner: `And after building ${w} whole pie${w > 1 ? 's' : ''}, how many slices are left over?`,
        prompt: 'Slices left?',
        hint: `${w} whole pie${w > 1 ? 's' : ''} used ${w * n} slices. ${p} − ${w * n} = ${r} left!`,
        expected: String(r),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: r }],
        sayQ: ['w-leftover'],
        sayA: sayFrac(r, n, true),
      }),
    ],
  };
}

// ── fraction × whole number ─────────────────────────────────────────────────
export function genFracMulWhole(band) {
  let k, n, m;
  if (band === 0) {
    n = pick([3, 4, 5, 6, 8]);
    k = 1;
    m = ri(2, n - 1);
  } else if (band === 1) {
    n = pick([6, 8, 10, 12]);
    k = ri(1, 3);
    let mMax = Math.floor((n - 1) / k);
    if (mMax < 2) {
      k = 1; // keep the result a proper fraction at this band
      mMax = n - 1;
    }
    m = ri(2, mMax);
  } else {
    n = pick([3, 4, 6]);
    k = ri(1, n - 1);
    m = ri(2, 4); // may pass a whole — that's the lesson
  }
  const res = k * m;
  return {
    kind: 'fracmul',
    k, n, m, res,
    result: res,
    equation: `${m} × ${k}/${n} = ${res}/${n}`,
    steps: [
      step1({
        chip: { label: 'Copies of a fraction', color: C.cyan },
        banner: `${m} copies of ${k} out of ${n}. Multiply only the top: what is ${m} × ${k}?${res >= n ? " (It's more than one whole pie!)" : ''}`,
        prompt: `${m} × ${k}/${n}`,
        hint: `${m} groups of ${k} slices: ${m} × ${k} = ${res}. The slice size (${n}) doesn't change!`,
        expected: String(res),
        effects: [{ t: 'ans', col: 0, val: res }],
        sayQ: ['w-whatis', `n-${m}`, 'w-times', ...sayFrac(k, n)],
        sayA: [`n-${m}`, 'w-times', ...sayFrac(k, n), 'w-is', ...sayFrac(res, n, true)],
      }),
    ],
  };
}

// ── add (and at band 2, subtract) fractions with the same denominator ───────
export function genFracAddLike(band) {
  const n = band === 0 ? pick([3, 4]) : band === 1 ? pick([5, 6, 8]) : pick([8, 10, 12]);
  const sub = band === 2 && Math.random() < 0.5;
  let a, b, res;
  if (sub) {
    a = ri(2, n - 1);
    b = ri(1, a - 1);
    res = a - b;
  } else {
    a = ri(1, n - 2);
    b = ri(1, n - 1 - a);
    res = a + b;
  }
  const sym = sub ? '−' : '+';
  const word = sub ? 'w-minus' : 'w-plus';
  return {
    kind: 'fracadd',
    a, b, n, res, sub,
    result: res,
    equation: `${a}/${n} ${sym} ${b}/${n} = ${res}/${n}`,
    steps: [
      step1({
        chip: { label: sub ? 'Take away slices' : 'Add the slices', color: sub ? C.pink : C.green },
        banner: `The slices are the same size, so just ${sub ? 'take away' : 'add'} the tops! What is ${a} ${sym} ${b}? The bottom stays ${n}.`,
        prompt: `${a}/${n} ${sym} ${b}/${n}`,
        hint: `Same-size slices: only the top numbers ${sub ? 'subtract' : 'add'}. ${a} ${sym} ${b} = ${res}, so it's ${res} out of ${n}!`,
        expected: String(res),
        effects: [{ t: 'ans', col: 0, val: res }],
        sayQ: ['w-whatis', ...sayFrac(a, n), word, ...sayFrac(b, n)],
        sayA: [...sayFrac(a, n), word, ...sayFrac(b, n), 'w-is', ...sayFrac(res, n, true)],
      }),
    ],
  };
}
