// ── Luna's Math Quest · step engine ─────────────────────────────────────────
// Pure logic: generates a problem plus an ordered list of single-input steps.
// Each step asks the child for one small answer (1–2 digits) and carries
// declarative "effects" describing what lands on the worksheet when correct.
//
// Step shape:
//   {
//     chip:    { label, color }        // banner tag (place value or DMSB phase)
//     banner:  string                  // kid-friendly guide text
//     prompt:  string                  // the bare question, e.g. "7 + 6 + 1"
//     hint:    string                  // companion hint after 2 misses
//     expected:string                  // exact digits the child must type
//     focus:   [cellId]                // cells to highlight while active
//     targets: [cellId]                // cells the answer will land in
//     effects: [op]                    // applied when answered correctly
//     preEffects:[op]                  // applied the moment the step activates
//     phase?:  'D'|'M'|'S'             // division DMSB phase
//     bring?:  true                    // divide step preceded by a bring-down
//     sayQ:    [clipKey]               // spoken question ("What is 8 plus 3")
//     sayA:    [clipKey]               // spoken explanation after a correct
//                                      // answer ("8 plus 3 is 11, write the
//                                      // 1 and carry the 1")
//   }
//
// Clip keys reference the concatenative fragments in public/voice/<voice>/:
// `n-X`/`e-X` are the number X (mid-sentence / sentence-final intonation),
// `w-name` are the phrase fragments in FRAGMENT_WORDS (src/voiceLines.js).

export const PLACES = [
  { name: 'Ones', color: '#FFE066' },
  { name: 'Tens', color: '#22D3EE' },
  { name: 'Hundreds', color: '#A78BFA' },
  { name: 'Thousands', color: '#F472B6' },
  { name: 'Ten-Thousands', color: '#4ADE80' },
  { name: 'Hundred-Thousands', color: '#FB923C' },
];

export const placeOf = (i) => PLACES[Math.min(Math.max(i, 0), PLACES.length - 1)];

export const PHASES = {
  D: { label: 'Divide', color: '#22D3EE' },
  M: { label: 'Multiply', color: '#A78BFA' },
  S: { label: 'Subtract', color: '#FFE066' },
  B: { label: 'Bring down', color: '#F472B6' },
};

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const numLen = (n) => String(n).length;
const lsb = (n) => String(n).split('').map(Number).reverse(); // index = place value
const msb = (n) => String(n).split('').map(Number);

function randNDigits(len, biasHigh = false) {
  let s = '' + ri(biasHigh ? 5 : 1, 9);
  for (let k = 1; k < len; k++) s += String(biasHigh ? ri(4, 9) : ri(0, 9));
  return parseInt(s, 10);
}

export const EMPTY_BOARD = {
  ans: {},      // {col: digit}            answer row (add/sub, 1-row mul)
  carry: {},    // {col: digit}            little carries above the top row
  adj: {},      // {col: value}            subtraction: value after borrowing
  cross: {},    // {col: true}             subtraction: crossed-out digit
  badge: {},    // {col: true}             subtraction: travelling "-1" chip
  quot: {},     // {col: digit}            division quotient (col = MSB index)
  total: {},    // {col: digit}            multiplication grand total row
  partial: {},  // {"row-col": {val,dim}}  multiplication partial products
  work: {},     // {"row-col": {val,bring}} division working rows
  workMeta: {}, // {row: {neg,from,to}}    division: minus sign + underline span
};

export function applyEffects(board, effects) {
  if (!effects || effects.length === 0) return board;
  const b = {
    ans: { ...board.ans },
    carry: { ...board.carry },
    adj: { ...board.adj },
    cross: { ...board.cross },
    badge: { ...board.badge },
    quot: { ...board.quot },
    total: { ...board.total },
    partial: { ...board.partial },
    work: { ...board.work },
    workMeta: { ...board.workMeta },
  };
  for (const e of effects) {
    switch (e.t) {
      case 'ans': b.ans[e.col] = e.val; break;
      case 'carry': b.carry[e.col] = e.val; break;
      case 'clearCarries': b.carry = {}; break;
      case 'adj': b.adj[e.col] = e.val; break;
      case 'cross': b.cross[e.col] = true; break;
      case 'badge': b.badge[e.col] = true; break;
      case 'clearBadge': delete b.badge[e.col]; break;
      case 'quot': b.quot[e.col] = e.val; break;
      case 'total': b.total[e.col] = e.val; break;
      case 'partial': b.partial[`${e.row}-${e.col}`] = { val: e.val, dim: !!e.dim }; break;
      case 'work': b.work[`${e.row}-${e.col}`] = { val: e.val, bring: !!e.bring }; break;
      case 'workMeta': b.workMeta[e.row] = { neg: !!e.neg, from: e.from, to: e.to }; break;
      default: break;
    }
  }
  return b;
}

// ── Long addition ───────────────────────────────────────────────────────────

function genAddition(diff) {
  const len = { easy: 2, medium: 3, hard: 4 }[diff];
  const bias = diff === 'hard';
  const a = randNDigits(len, bias);
  const b = randNDigits(len, bias);
  const A = lsb(a);
  const B = lsb(b);
  const n = Math.max(A.length, B.length);
  const width = numLen(a + b);
  const steps = [];
  let carry = 0;

  for (let i = 0; i < n; i++) {
    const da = A[i] ?? 0;
    const db = B[i] ?? 0;
    const s = da + db + carry;
    const w = s % 10;
    const c = Math.floor(s / 10);
    const isLast = i === n - 1;
    const pl = placeOf(i);

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
    const focus = [`a-${i}`, `b-${i}`];
    if (carry) focus.push(`carry-${i}`);

    steps.push({
      chip: { label: `${pl.name} column`, color: pl.color },
      banner: carry
        ? `${pl.name} column: add ${da} + ${db}, plus the little ${carry} carried on top!`
        : `Let's look at the ${pl.name.toLowerCase()} column: what is ${da} + ${db}?`,
      prompt: carry ? `${da} + ${db} + ${carry}` : `${da} + ${db}`,
      hint:
        s >= 10
          ? `${da} + ${db}${carry ? ` + ${carry}` : ''} makes ${s} — a two-digit answer! Type ${Math.floor(s / 10)} then ${w}: the ${w} stays here, and the ${Math.floor(s / 10)} floats up to the next column.`
          : `Try counting up! Start at ${Math.max(da, db)} and count ${Math.min(da, db) + carry} more on your fingers.`,
      expected: String(s),
      focus,
      targets,
      effects,
      preEffects: [],
      sayQ: ['w-whatis', `n-${da}`, 'w-plus', `n-${db}`, ...(carry ? ['w-plus', `n-${carry}`] : [])],
      sayA: [
        `n-${da}`, 'w-plus', `n-${db}`, ...(carry ? ['w-plus', `n-${carry}`] : []), 'w-is',
        ...(c && !isLast
          ? [`n-${s}`, 'w-writethe', `n-${w}`, 'w-carrythe', `e-${c}`]
          : [`e-${s}`]),
      ],
    });
    carry = c;
  }

  return {
    kind: 'add',
    a, b,
    aD: A, bD: B,
    width,
    result: a + b,
    equation: `${a} + ${b} = ${a + b}`,
    steps,
  };
}

// ── Long subtraction (borrowing / regrouping) ───────────────────────────────

function borrowCount(a, b) {
  const A = lsb(a);
  const B = lsb(b);
  let lend = 0;
  let count = 0;
  for (let i = 0; i < A.length; i++) {
    const t = A[i] - lend;
    const db = B[i] ?? 0;
    if (t < db) {
      count++;
      lend = 1;
    } else {
      lend = 0;
    }
  }
  return count;
}

function genSubtraction(diff) {
  const len = { easy: 2, medium: 3, hard: 4 }[diff];
  const wantBorrows = { easy: 0, medium: 1, hard: 2 }[diff];
  let a, b;
  let guard = 0;
  do {
    a = randNDigits(len);
    b = randNDigits(len);
    if (b > a) [a, b] = [b, a];
    guard++;
  } while (
    guard < 500 &&
    (a === b ||
      numLen(a - b) !== numLen(a) || // avoid an awkward leading zero in the answer
      (wantBorrows === 0 ? borrowCount(a, b) !== 0 : borrowCount(a, b) < wantBorrows))
  );

  const A = lsb(a);
  const B = lsb(b);
  const width = A.length;
  const steps = [];
  let lend = 0;

  for (let i = 0; i < A.length; i++) {
    const db = B[i] ?? 0;
    const t = A[i] - lend;
    const borrow = t < db;
    const eff = borrow ? t + 10 : t;
    const res = eff - db;
    const pl = placeOf(i);
    const nextPl = placeOf(i + 1);

    const preEffects = [];
    if (lend || borrow) {
      preEffects.push({ t: 'cross', col: i }, { t: 'adj', col: i, val: eff });
      if (lend) preEffects.push({ t: 'clearBadge', col: i });
    }
    if (borrow) preEffects.push({ t: 'badge', col: i + 1 });

    let banner;
    if (borrow) {
      banner = `Uh oh — ${t} is smaller than ${db}! Borrow 10 from the ${nextPl.name.toLowerCase()} column. Now it's ${eff} − ${db}!`;
    } else if (lend) {
      banner = `Careful: this ${A[i]} lent 1 away, so it's really ${eff}. What is ${eff} − ${db}?`;
    } else {
      banner = `${pl.name} column: what is ${A[i]} − ${db}?`;
    }

    steps.push({
      chip: { label: `${pl.name} column`, color: pl.color },
      banner,
      prompt: `${eff} − ${db}`,
      hint: borrow
        ? `We borrowed 10, so the top number became ${eff}. Now count down: start at ${eff} and hop back ${db} steps.`
        : `Count down! Start at ${eff} and hop back ${db} steps on your fingers.`,
      expected: String(res),
      focus: [`a-${i}`, `b-${i}`],
      targets: [`ans-${i}`],
      effects: [{ t: 'ans', col: i, val: res }],
      preEffects,
      sayQ: [...(borrow ? ['w-borrow'] : []), 'w-whatis', `n-${eff}`, 'w-minus', `n-${db}`],
      sayA: [`n-${eff}`, 'w-minus', `n-${db}`, 'w-is', `e-${res}`],
    });
    lend = borrow ? 1 : 0;
  }

  return {
    kind: 'sub',
    a, b,
    aD: A, bD: B,
    width,
    result: a - b,
    equation: `${a} − ${b} = ${a - b}`,
    steps,
  };
}

// ── Long multiplication (partial products) ──────────────────────────────────

function genMultiplication(diff) {
  const cfg = { easy: [2, 1], medium: [3, 1], hard: [2, 2] }[diff];
  const [mLen, qLen] = cfg;
  const m = randNDigits(mLen);
  let q;
  let guard = 0;
  do {
    q = qLen === 1 ? ri(2, 9) : randNDigits(qLen);
    guard++;
  } while (guard < 200 && qLen > 1 && lsb(q).some((d) => d < 2)); // every digit ≥ 2 keeps rows interesting

  const M = lsb(m);
  const Q = lsb(q);
  const R = Q.length;
  const total = m * q;
  const width = numLen(total);
  const steps = [];

  // Phase 1 — build each partial product, digit by digit.
  for (let j = 0; j < R; j++) {
    const qd = Q[j];
    let carry = 0;
    for (let i = 0; i < M.length; i++) {
      const p = qd * M[i] + carry;
      const isLastD = i === M.length - 1;
      const pl = placeOf(i);
      const write = (col, val, extra = {}) =>
        R === 1 ? { t: 'ans', col, val, ...extra } : { t: 'partial', row: j, col, val, ...extra };
      const cellId = (col) => (R === 1 ? `ans-${col}` : `p${j}-${col}`);

      const preEffects = [];
      if (i === 0 && j > 0) {
        preEffects.push({ t: 'clearCarries' });
        for (let z = 0; z < j; z++) preEffects.push({ t: 'partial', row: j, col: z, val: 0, dim: true });
      }

      const effects = [];
      const targets = [];
      if (isLastD) {
        effects.push(write(i + j, p % 10));
        targets.push(cellId(i + j));
        if (p >= 10) {
          effects.push(write(i + j + 1, Math.floor(p / 10)));
          targets.push(cellId(i + j + 1));
        }
      } else {
        effects.push(write(i + j, p % 10));
        targets.push(cellId(i + j));
        const nc = Math.floor(p / 10);
        if (nc) {
          effects.push({ t: 'carry', col: i + 1, val: nc });
          targets.push(`carry-${i + 1}`);
        }
      }

      const focus = [`q-${j}`, `m-${i}`];
      if (carry) focus.push(`carry-${i}`);

      steps.push({
        chip: { label: `${pl.name} digit`, color: pl.color },
        banner:
          carry > 0
            ? `Multiply ${qd} × ${M[i]}, then add the carried ${carry} on top!`
            : `Multiply time! What is ${qd} × ${M[i]}?`,
        prompt: carry > 0 ? `${qd} × ${M[i]} + ${carry}` : `${qd} × ${M[i]}`,
        hint:
          p >= 10 && !isLastD
            ? `${qd} × ${M[i]} is ${qd * M[i]}${carry ? `, plus ${carry} makes ${p}` : ''}. Type both digits: write the ${p % 10}, carry the ${Math.floor(p / 10)}!`
            : `Skip-count by ${M[i]}: ${[1, 2, 3].map((k) => M[i] * k).join(', ')}... do it ${qd} times${carry ? `, then add ${carry}` : ''}.`,
        expected: String(p),
        focus,
        targets,
        effects,
        preEffects,
        sayQ: ['w-whatis', `n-${qd}`, 'w-times', `n-${M[i]}`, ...(carry ? ['w-plus', `n-${carry}`] : [])],
        sayA: [
          `n-${qd}`, 'w-times', `n-${M[i]}`, ...(carry ? ['w-plus', `n-${carry}`] : []), 'w-is',
          ...(p >= 10 && !isLastD
            ? [`n-${p}`, 'w-writethe', `n-${p % 10}`, 'w-carrythe', `e-${Math.floor(p / 10)}`]
            : [`e-${p}`]),
        ],
        interactiveHint: qd && M[i] ? { kind: 'multable', row: qd, col: M[i] } : undefined,
      });
      carry = isLastD ? 0 : Math.floor(p / 10);
    }
  }

  // Phase 2 — add the partial products together (only when 2+ rows).
  if (R > 1) {
    const pDs = Q.map((qd) => lsb(m * qd)); // each row's digits, LSB
    const digitAt = (j, c) => (c - j >= 0 && c - j < pDs[j].length ? pDs[j][c - j] : 0);
    let carry = 0;
    for (let c = 0; c < width; c++) {
      const terms = Q.map((_, j) => digitAt(j, c));
      const s = terms.reduce((x, y) => x + y, 0) + carry;
      const w = s % 10;
      const cc = Math.floor(s / 10);
      const isLast = c === width - 1;
      const pl = placeOf(c);

      const effects = [{ t: 'total', col: c, val: w }];
      const targets = [`tot-${c}`];
      if (cc) {
        if (isLast) {
          effects.push({ t: 'total', col: c + 1, val: cc });
          targets.push(`tot-${c + 1}`);
        } else {
          effects.push({ t: 'carry', col: c + 1, val: cc });
          targets.push(`carry-${c + 1}`);
        }
      }
      const focus = Q.map((_, j) => `p${j}-${c}`);
      if (carry) focus.push(`carry-${c}`);

      steps.push({
        chip: { label: `Add · ${pl.name}`, color: pl.color },
        banner: `Last job: add the rows! ${pl.name} column: ${terms.join(' + ')}${carry ? ` + ${carry} (carry)` : ''}.`,
        prompt: `${terms.join(' + ')}${carry ? ` + ${carry}` : ''}`,
        hint:
          s >= 10
            ? `That makes ${s} — type ${Math.floor(s / 10)} then ${w}. The ${w} stays, the ${Math.floor(s / 10)} carries on!`
            : `Add them slowly, one at a time. You'll land on ${terms[0]} + ${terms.slice(1).join(' + ')}${carry ? ` + ${carry}` : ''}.`,
        expected: String(s),
        focus,
        targets,
        effects,
        preEffects: c === 0 ? [{ t: 'clearCarries' }] : [],
        sayQ: [
          'w-whatis',
          ...terms.flatMap((d, k) => (k === 0 ? [`n-${d}`] : ['w-plus', `n-${d}`])),
          ...(carry ? ['w-plus', `n-${carry}`] : []),
        ],
        sayA: [
          ...terms.flatMap((d, k) => (k === 0 ? [`n-${d}`] : ['w-plus', `n-${d}`])),
          ...(carry ? ['w-plus', `n-${carry}`] : []),
          'w-is',
          ...(cc && !isLast
            ? [`n-${s}`, 'w-writethe', `n-${w}`, 'w-carrythe', `e-${cc}`]
            : [`e-${s}`]),
        ],
      });
      carry = cc;
    }
  }

  return {
    kind: 'mul',
    m, q,
    mD: M, qD: Q,
    R,
    width,
    result: total,
    equation: `${m} × ${q} = ${total}`,
    steps,
  };
}

// ── Long division (DMSB loop) ───────────────────────────────────────────────

function genDivision(diff) {
  const targetLen = { easy: 2, medium: 3, hard: 4 }[diff];
  let d, q, dividend;
  let guard = 0;
  do {
    d = ri(2, 9);
    const lo = Math.max(2, Math.ceil(Math.pow(10, targetLen - 1) / d));
    const hi = Math.floor((Math.pow(10, targetLen) - 1) / d);
    q = ri(lo, hi);
    dividend = d * q;
    guard++;
  } while (guard < 500 && numLen(dividend) !== targetLen);

  const D = msb(dividend);
  const L = D.length;
  const steps = [];

  let i = 0;
  let cur = 0;
  let row = 0;
  let firstIter = true;
  let pendingBring = null; // preEffects for the next Divide step
  let bringFlag = false;
  let curCells = [];
  let curLen = 0;
  let lastRemRow = 0;

  // Take the smallest leading chunk the divisor fits into.
  while (cur < d && i < L) {
    cur = cur * 10 + D[i];
    i++;
  }
  curLen = i;
  curCells = Array.from({ length: i }, (_, k) => `dvd-${k}`);

  for (;;) {
    const col = i - 1;
    const qd = Math.floor(cur / d);
    const prod = qd * d;
    const rem = cur - prod;

    // D — Divide
    steps.push({
      phase: 'D',
      bring: bringFlag,
      chip: PHASES.D,
      banner: bringFlag
        ? `Bring down the ${D[i - 1]}! Now divide: how many times does ${d} go into ${cur}?`
        : `Divide: how many times does ${d} go into ${cur}?`,
      prompt: `${cur} ÷ ${d}`,
      hint: `Count by ${d}s: ${d}, ${d * 2}, ${d * 3}... How many jumps before you pass ${cur}? ${qd === 0 ? `${d} is bigger than ${cur}, so it fits 0 times!` : ''}`,
      expected: String(qd),
      focus: [...curCells, 'dsr'],
      targets: [`q-${col}`],
      effects: [{ t: 'quot', col, val: qd }],
      preEffects: pendingBring || [],
      sayQ: ['w-howmany', `n-${d}`, 'w-gointo', `n-${cur}`],
      sayA: ['w-itfits', `n-${qd}`, 'w-timesx'],
    });
    pendingBring = null;
    bringFlag = false;

    // M — Multiply
    const prodDigits = msb(prod);
    const pStart = col - prodDigits.length + 1;
    const lineFrom = Math.min(pStart, col - curLen + 1);
    steps.push({
      phase: 'M',
      chip: PHASES.M,
      banner: `Multiply: ${qd} × ${d}. Write it right under the ${cur}.`,
      prompt: `${qd} × ${d}`,
      hint: `${qd} groups of ${d}. Skip-count by ${d}, ${qd} times — and if it's a two-digit answer, type both digits!`,
      expected: String(prod),
      focus: [`q-${col}`, 'dsr'],
      targets: prodDigits.map((_, k) => `w${row}-${pStart + k}`),
      effects: [
        ...prodDigits.map((dv, k) => ({ t: 'work', row, col: pStart + k, val: dv })),
        { t: 'workMeta', row, neg: true, from: lineFrom, to: col },
      ],
      preEffects: [],
      sayQ: ['w-whatis', `n-${qd}`, 'w-times', `n-${d}`],
      sayA: [`n-${qd}`, 'w-times', `n-${d}`, 'w-is', `e-${prod}`],
    });

    // S — Subtract
    const remRow = row + 1;
    lastRemRow = remRow;
    steps.push({
      phase: 'S',
      chip: PHASES.S,
      banner: `Subtract: ${cur} − ${prod}. What's left over?`,
      prompt: `${cur} − ${prod}`,
      hint: `Count down from ${cur} by ${prod}... or count up from ${prod} to ${cur}. The leftover is always smaller than ${d}!`,
      expected: String(rem),
      focus: [...curCells, ...prodDigits.map((_, k) => `w${row}-${pStart + k}`)],
      targets: [`w${remRow}-${col}`],
      effects: [{ t: 'work', row: remRow, col, val: rem }],
      preEffects: [],
      sayQ: ['w-whatis', `n-${cur}`, 'w-minus', `n-${prod}`],
      sayA: [`n-${cur}`, 'w-minus', `n-${prod}`, 'w-is', `e-${rem}`],
    });

    if (i < L) {
      // B — Bring down (animates when the next Divide step activates)
      pendingBring = [{ t: 'work', row: remRow, col: col + 1, val: D[i], bring: true }];
      bringFlag = true;
      curCells = [`w${remRow}-${col}`, `w${remRow}-${col + 1}`];
      curLen = 2;
      cur = rem * 10 + D[i];
      i++;
      row = remRow + 1;
      firstIter = false;
    } else {
      break;
    }
  }

  return {
    kind: 'div',
    dividend,
    divisor: d,
    D,
    L,
    workRows: lastRemRow + 1, // total working rows, known upfront for stable layout
    result: q,
    equation: `${dividend} ÷ ${d} = ${q}`,
    steps,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

export function makeProblem(mode, diff) {
  switch (mode) {
    case 'add': return genAddition(diff);
    case 'sub': return genSubtraction(diff);
    case 'mul': return genMultiplication(diff);
    case 'div': return genDivision(diff);
    default: return genAddition(diff);
  }
}
