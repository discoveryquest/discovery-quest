// ── Measure Marsh generators ────────────────────────────────────────────────
// Money (count coins, make change), telling time, elapsed time, comparing
// lengths/weights across units, and exact unit conversions. All answers are
// whole numbers; speech reuses numbers + unit-word fragments.

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

// ── money: count the coin tray; band 2 makes change from 100¢ ───────────────
export function genMoney(band) {
  if (band === 2) {
    const price = ri(3, 19) * 5;
    const change = 100 - price;
    return {
      kind: 'coins',
      mode: 'change',
      price, pay: 100,
      coins: [],
      result: change,
      equation: `100¢ − ${price}¢ = ${change}¢`,
      steps: [
        step1({
          chip: { label: 'Making change', color: '#FFE066' },
          banner: `The toy costs ${price}¢ and you pay with a 100¢ coin. How much change do you get back?`,
          prompt: `100¢ − ${price}¢`,
          hint: `Count UP from ${price} to 100: first to the next ten, then by tens. That's ${change}¢!`,
          expected: String(change),
          effects: [{ t: 'ans', col: 0, val: change }],
          sayQ: ['w-howmuchchange'],
          sayA: [...numClips(change), 'w-cents'],
        }),
      ],
    };
  }
  const denoms = band === 0 ? [10, 5, 1] : [25, 10, 5, 1];
  const coins = [];
  let total = 0;
  const target = band === 0 ? ri(12, 50) : ri(36, 99);
  for (const d of denoms) {
    while (total + d <= target && coins.length < 9) {
      const want = Math.min(Math.floor((target - total) / d), d === 1 ? 4 : 3);
      if (want <= 0) break;
      coins.push(d);
      total += d;
    }
  }
  return {
    kind: 'coins',
    mode: 'count',
    coins, price: null,
    result: total,
    equation: `${total}¢`,
    steps: [
      step1({
        chip: { label: 'Count the coins', color: '#FFE066' },
        banner: 'Count the coins — start with the biggest ones! How many cents in all?',
        prompt: 'How much money?',
        hint: `Add the big coins first, then the small ones. It comes to ${total}¢!`,
        expected: String(total),
        effects: [{ t: 'ans', col: 0, val: total }],
        sayQ: ['w-howmuchmoney'],
        sayA: [...numClips(total), 'w-cents'],
      }),
    ],
  };
}

// ── telling time on an analog clock ─────────────────────────────────────────
export function genTime(band) {
  const h = ri(1, 12);
  const m = band === 0 ? pick([0, 30]) : band === 1 ? ri(1, 11) * 5 : pick([5, 10, 20, 25, 35, 40, 50, 55]);
  return {
    kind: 'clock',
    h, m,
    result: h * 100 + m,
    sayResult: m === 0 ? [`n-${h}`, 'w-oclock'] : [`n-${h}`, `e-${m}`],
    equation: `${h}:${String(m).padStart(2, '0')}`,
    steps: [
      step1({
        chip: { label: 'The little hand', color: '#22D3EE' },
        banner: 'The SHORT hand tells the hour. What hour is it?',
        prompt: 'What hour?',
        hint: `The short hand ${m >= 30 ? 'has moved past' : 'points at (or just past)'} the ${h}. It's ${h} something!`,
        expected: String(h),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: h }],
        sayQ: ['w-whathour'],
        sayA: [`e-${h}`],
      }),
      step1({
        chip: { label: 'The big hand', color: '#F472B6' },
        banner: 'The LONG hand counts minutes — each number is 5 minutes. How many minutes?',
        prompt: 'How many minutes?',
        hint: `Count by 5s around to the long hand: ${m} minutes!`,
        expected: String(m),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: m }],
        sayQ: ['w-whatminutes'],
        sayA: [`e-${m}`],
      }),
    ],
  };
}

// ── elapsed time: start + duration → end (no wrap past 12) ──────────────────
export function genElapsed(band) {
  const m1 = band === 0 ? 0 : pick([0, 30]);
  const dh = band === 0 ? ri(1, 3) : ri(0, 2);
  const dm = band === 0 ? 0 : band === 1 ? pick([0, 30]) : pick([15, 30, 45]);
  const h1 = ri(1, 12 - dh - 1);
  let h2 = h1 + dh;
  let m2 = m1 + dm;
  if (m2 >= 60) {
    m2 -= 60;
    h2 += 1;
  }
  if (dh === 0 && dm === 0) return genElapsed(band); // never a zero-length show
  const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  const durText = `${dh ? `${dh} hour${dh > 1 ? 's' : ''}` : ''}${dh && dm ? ' and ' : ''}${dm ? `${dm} minutes` : ''}`;
  return {
    kind: 'elapsed',
    h1, m1, h2, m2, durText,
    result: h2 * 100 + m2,
    sayResult: m2 === 0 ? [`n-${h2}`, 'w-oclock'] : [`n-${h2}`, `e-${m2}`],
    equation: `${fmt(h1, m1)} + ${durText} = ${fmt(h2, m2)}`,
    steps: [
      step1({
        chip: { label: 'Hours first', color: '#22D3EE' },
        banner: `The movie starts at ${fmt(h1, m1)} and lasts ${durText}. What HOUR does it end at?`,
        prompt: 'End hour?',
        hint: `Hop the hours first${dm ? ', then see if the minutes push past the next hour' : ''}: it ends in hour ${h2}!`,
        expected: String(h2),
        targets: ['ans-1'],
        effects: [{ t: 'ans', col: 1, val: h2 }],
        sayQ: ['w-endhour'],
        sayA: [`e-${h2}`],
      }),
      step1({
        chip: { label: 'Then minutes', color: '#F472B6' },
        banner: 'And how many minutes past the hour does it end?',
        prompt: 'End minutes?',
        hint: `${m1} + ${dm} minutes ${m1 + dm >= 60 ? 'passes the hour — subtract 60' : ''}: ${m2} minutes!`,
        expected: String(m2),
        targets: ['ans-0'],
        effects: [{ t: 'ans', col: 0, val: m2 }],
        sayQ: ['w-endminutes'],
        sayA: [`e-${m2}`],
      }),
    ],
  };
}

// ── compare quantities across units: type 1 or 2 ────────────────────────────
const UNIT_PAIRS = [
  // [label1, cm-or-g value1, label2, value2, kind]
  () => {
    const m = ri(2, 5);
    const cm = ri(1, m * 100 - 20);
    return [`${m} m`, m * 100, `${cm} cm`, cm, 'longer'];
  },
  () => {
    const m = ri(1, 3);
    const cm = m * 100 + ri(10, 90);
    return [`${m} m`, m * 100, `${cm} cm`, cm, 'longer'];
  },
  () => {
    const kg = ri(1, 4);
    const g = kg * 1000 + (Math.random() < 0.5 ? -ri(100, 600) : ri(100, 900));
    return [`${kg} kg`, kg * 1000, `${g} g`, g, 'heavier'];
  },
  () => {
    const cm = ri(2, 9);
    const mm = ri(1, cm * 10 - 3);
    return [`${cm} cm`, cm * 10, `${mm} mm`, mm, 'longer'];
  },
];

export function genUnits(band) {
  const gen = band === 0 ? UNIT_PAIRS[0] : band === 1 ? pick([UNIT_PAIRS[1], UNIT_PAIRS[3]]) : pick(UNIT_PAIRS.slice(1));
  let [l1, v1, l2, v2, what] = gen();
  if (v1 === v2) return genUnits(band);
  if (Math.random() < 0.5) [l1, v1, l2, v2] = [l2, v2, l1, v1];
  const winner = v1 > v2 ? 1 : 2;
  return {
    kind: 'decpick', // reuses the two-card pick board
    vals: [l1, l2],
    pickLabel: `Type 1 or 2 — which is ${what.toUpperCase()}?`,
    winner,
    result: winner,
    equation: `${winner === 1 ? l1 : l2} is ${what}`,
    steps: [
      step1({
        chip: { label: what === 'longer' ? 'Length' : 'Weight', color: '#F472B6' },
        banner: `Convert them to the SAME unit in your head. Which is ${what} — 1 or 2?`,
        prompt: `${l1} or ${l2}?`,
        hint: `Remember: 1 m = 100 cm, 1 cm = 10 mm, 1 kg = 1000 g. Number ${winner} is ${what}!`,
        expected: String(winner),
        effects: [{ t: 'ans', col: 0, val: winner }],
        sayQ: [what === 'longer' ? 'w-whichlonger' : 'w-whichheavier'],
        sayA: [`e-${winner}`],
      }),
    ],
  };
}

// ── exact unit conversions ──────────────────────────────────────────────────
const UNIT_WORD = { m: 'w-meters', cm: 'w-centimeters', mm: 'w-millimeters', kg: 'w-kilograms', g: 'w-grams' };

export function genUnitConvert(band) {
  let n, from, to, ans;
  if (band === 0) {
    n = ri(2, 9);
    [from, to, ans] = pick([
      ['m', 'cm', n * 100],
      ['cm', 'mm', n * 10],
    ]);
  } else if (band === 1) {
    n = ri(2, 9);
    [from, to, ans] = pick([
      ['kg', 'g', n * 1000],
      ['m', 'cm', n * 100],
    ]);
  } else {
    n = ri(2, 9);
    const down = pick([
      ['cm', 'm', n * 100, n],
      ['g', 'kg', n * 1000, n],
      ['mm', 'cm', n * 10, n],
    ]);
    return {
      kind: 'convert',
      n: down[2], from: down[0], to: down[1],
      result: down[3],
      equation: `${down[2]} ${down[0]} = ${down[3]} ${down[1]}`,
      steps: [
        step1({
          chip: { label: 'Convert down', color: '#A78BFA' },
          banner: `${down[2]} ${down[0]} — how many ${down[1] === 'm' ? 'meters' : down[1] === 'kg' ? 'kilograms' : 'centimeters'} is that?`,
          prompt: `${down[2]} ${down[0]} = ? ${down[1]}`,
          hint: `Going to a BIGGER unit means fewer of them — divide! The answer is ${down[3]}.`,
          expected: String(down[3]),
          effects: [{ t: 'ans', col: 0, val: down[3] }],
          sayQ: ['w-convertq'],
          sayA: [...numClips(down[3]), UNIT_WORD[down[1]]],
        }),
      ],
    };
  }
  return {
    kind: 'convert',
    n, from, to,
    result: ans,
    equation: `${n} ${from} = ${ans} ${to}`,
    steps: [
      step1({
        chip: { label: 'Convert!', color: '#A78BFA' },
        banner: `1 ${from} = ${from === 'kg' ? 1000 : from === 'm' ? 100 : 10} ${to}. So ${n} ${from} is how many ${to}?`,
        prompt: `${n} ${from} = ? ${to}`,
        hint: `Multiply: ${n} × ${from === 'kg' ? 1000 : from === 'm' ? 100 : 10} = ${ans}!`,
        expected: String(ans),
        effects: [{ t: 'ans', col: 0, val: ans }],
        sayQ: ['w-convertq'],
        sayA: [...numClips(ans), UNIT_WORD[to]],
      }),
    ],
  };
}
