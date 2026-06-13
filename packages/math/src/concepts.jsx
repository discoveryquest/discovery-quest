// "Learn it" concept screens — multiple representations of one idea, shown
// before practice and replayable. Reuses the interactive-hint components as
// building blocks (the same animated, voiced aids serve both surfaces).
// Generic: add a concept here and point a curriculum station at its id.

import EngineConceptScreen from '@discoveryquest/engine-ui/ConceptScreen';
import {
  MulTableHint, RepeatedAddition, ArrayModel, NumberLineHint,
  CountDots, TenFrame, CombineBlocks, TakeAwayBlocks, ShareGroups,
  BaseTenBlocks, CompareCards, EvenOddDots, SkipHops,
  FractionPieBar, FractionBar, EquivFractions, CompareFractions, AddFractions,
  RoundingLine, WordReveal,
  DecimalGrid, CompareDecimals, AddDecimals, DecimalHop,
  CoinTray, ClockRead, ElapsedClocks, UnitLadder,
  ShapeSides, SymmetryFold, AngleSweep, PerimeterTrace, AreaFill, VolumeLayers,
} from './interactiveHints.jsx';

// Each rep: a label, a Luna voice clip, and a render(example, run) → node.
export const CONCEPTS = {
  multiply: {
    title: 'What is multiplying?',
    intro: 'conceptmul-0',
    example: { a: 3, b: 4 },
    reps: [
      { id: 'repadd', label: '➕ Repeated adding', voice: 'repaddmul-0', render: (e, run) => <RepeatedAddition a={e.a} b={e.b} run={run} /> },
      { id: 'array', label: '🟪 Rows & columns', voice: 'arraymul-0', render: (e) => <ArrayModel a={e.a} b={e.b} /> },
      { id: 'table', label: '🔢 Times table', voice: 'hintmul-0', render: (e) => <MulTableHint hint={{ kind: 'multable', row: e.a, col: e.b }} /> },
    ],
  },
  addition: {
    title: 'What is adding?',
    intro: 'conceptadd-0',
    example: { a: 5, b: 3 },
    reps: [
      { id: 'combine', label: '🧱 Put together', voice: 'combineblocks-0', render: (e) => <CombineBlocks a={e.a} b={e.b} /> },
      { id: 'line', label: '📏 Hop forward', voice: 'hintline-0', render: (e) => <NumberLineHint hint={{ kind: 'numberline', start: e.a, op: 'add', delta: e.b }} /> },
    ],
  },
  subtraction: {
    title: 'What is subtracting?',
    intro: 'conceptsub-0',
    example: { a: 8, b: 3 },
    reps: [
      { id: 'takeaway', label: '🧱 Take away', voice: 'takeaway-0', render: (e) => <TakeAwayBlocks a={e.a} b={e.b} /> },
      { id: 'line', label: '📏 Hop back', voice: 'hintline-0', render: (e) => <NumberLineHint hint={{ kind: 'numberline', start: e.a, op: 'sub', delta: e.b }} /> },
    ],
  },
  division: {
    title: 'What is dividing?',
    intro: 'conceptdiv-0',
    example: { total: 12, groups: 3 },
    reps: [
      { id: 'share', label: '🧺 Share fairly', voice: 'sharegroups-0', render: (e) => <ShareGroups total={e.total} groups={e.groups} /> },
      { id: 'table', label: '🔢 Times table', voice: 'hintdiv-0', render: (e) => <MulTableHint hint={{ kind: 'multable', row: e.groups, col: e.total / e.groups, mode: 'div' }} /> },
    ],
  },
  counting: {
    title: 'What is counting?',
    intro: 'conceptcount-0',
    example: { n: 5 },
    reps: [{ id: 'dots', label: '🔢 Count along', voice: 'countdots-0', render: (e) => <CountDots n={e.n} /> }],
  },
  bonds: {
    title: 'What are number bonds?',
    intro: 'conceptbonds-0',
    example: { a: 6, target: 10 },
    reps: [
      { id: 'frame', label: '🔲 Ten-frame', voice: 'tenframe-0', render: (e) => <TenFrame filled={e.a} /> },
      { id: 'line', label: '📏 Hop to ten', voice: 'hintline-0', render: (e) => <NumberLineHint hint={{ kind: 'numberline', start: e.a, op: 'bondup', target: e.target }} /> },
      { id: 'frame2', label: '🔲 Another: 7 + 3', voice: 'tenframe-0', render: () => <TenFrame filled={7} /> },
    ],
  },
  'place-value': {
    title: 'Tens & ones',
    intro: 'conceptpv-0',
    example: { t: 2, o: 3 },
    reps: [{ id: 'blocks', label: '🧱 Base-ten blocks', voice: 'baseten-0', render: (e) => <BaseTenBlocks t={e.t} o={e.o} /> }],
  },
  'compare-numbers': {
    title: 'Bigger or smaller?',
    intro: 'conceptcompare-0',
    example: { a: 42, b: 28 },
    reps: [{ id: 'cards', label: '📊 Compare bars', voice: 'comparecards-0', render: (e) => <CompareCards a={e.a} b={e.b} /> }],
  },
  'even-odd': {
    title: 'Even or odd?',
    intro: 'conceptevenodd-0',
    example: { n: 8 },
    reps: [
      { id: 'even', label: '🟣 Even (pairs)', voice: 'evenodddots-0', render: () => <EvenOddDots n={8} /> },
      { id: 'odd', label: '🩷 Odd (1 left over)', voice: 'evenodddots-0', render: () => <EvenOddDots n={7} /> },
    ],
  },
  'skip-counting': {
    title: 'Skip counting',
    intro: 'conceptskip-0',
    example: { step: 5, count: 4 },
    reps: [{ id: 'hops', label: '📏 Hop & count', voice: 'skiphops-0', render: (e) => <SkipHops step={e.step} count={e.count} /> }],
  },
  fractions: {
    title: 'What is a fraction?',
    intro: 'conceptfrac-0',
    example: { k: 3, n: 4 },
    reps: [
      { id: 'pie', label: '🥧 Pie', voice: 'fracpie-0', render: (e) => <FractionPieBar k={e.k} n={e.n} /> },
      { id: 'bar', label: '▬ Bar', voice: 'fracbar-0', render: (e) => <FractionBar n={e.n} k={e.k} /> },
    ],
  },
  'equivalent-fractions': {
    title: 'Equivalent fractions',
    intro: 'conceptequiv-0',
    example: { a: 1, b: 2, m: 2 },
    reps: [{ id: 'pies', label: '🥧 Same size', voice: 'equivpies-0', render: (e) => <EquivFractions a={e.a} b={e.b} m={e.m} /> }],
  },
  'compare-fractions': {
    title: 'Compare fractions',
    intro: 'conceptcompfrac-0',
    example: { k1: 1, n1: 2, k2: 1, n2: 3 },
    reps: [{ id: 'pies', label: '⚖️ Which is more?', voice: 'compfracs-0', render: (e) => <CompareFractions k1={e.k1} n1={e.n1} k2={e.k2} n2={e.n2} /> }],
  },
  'add-fractions': {
    title: 'Adding fractions',
    intro: 'conceptaddfrac-0',
    example: { a: 1, b: 2, n: 4 },
    reps: [{ id: 'pies', label: '🥧 Add the slices', voice: 'addfracs-0', render: (e) => <AddFractions a={e.a} b={e.b} n={e.n} /> }],
  },
  rounding: {
    title: 'What is rounding?',
    intro: 'conceptround-0',
    example: { v: 47, unit: 10 },
    reps: [{ id: 'line', label: '📏 Nearest ten', voice: 'roundline-0', render: (e) => <RoundingLine v={e.v} unit={e.unit} /> }],
  },
  'word-problems': {
    title: 'Story problems',
    intro: 'conceptword-0',
    example: {},
    reps: [{ id: 'reveal', label: '📖 Find the math', voice: 'wordhide-0', render: () => <WordReveal /> }],
  },
  'decimal-place': {
    title: 'What is a decimal?',
    intro: 'conceptdecplace-0',
    example: { value: 0.3 },
    reps: [{ id: 'grid', label: '⬜ Tenths grid', voice: 'decgrid-0', render: (e) => <DecimalGrid value={e.value} size={180} /> }],
  },
  'compare-decimals': {
    title: 'Compare decimals',
    intro: 'conceptcompdec-0',
    example: { a: 0.5, b: 0.45 },
    reps: [{ id: 'grids', label: '⚖️ Which is more?', voice: 'compdec-0', render: (e) => <CompareDecimals a={e.a} b={e.b} /> }],
  },
  'add-decimals': {
    title: 'Adding decimals',
    intro: 'conceptadddec-0',
    example: { a: 1.2, b: 3.4 },
    reps: [{ id: 'cols', label: '➕ Line up points', voice: 'adddec-0', render: (e) => <AddDecimals a={e.a} b={e.b} /> }],
  },
  'decimal-pow10': {
    title: '× and ÷ by 10',
    intro: 'conceptpow10-0',
    example: { from: 3.4, factor: 10, op: '×' },
    reps: [{ id: 'hop', label: '➡️ Point hops', voice: 'pow10hop-0', render: (e) => <DecimalHop from={e.from} factor={e.factor} op={e.op} /> }],
  },
  // measure wave
  money: {
    title: 'Counting money',
    intro: 'conceptmoney-0',
    example: { coins: [25, 10] },
    reps: [{ id: 'tray', label: '🪙 Coin tray', voice: 'moneycount-0', render: (e) => <CoinTray coins={e.coins} /> }],
  },
  time: {
    title: 'Telling time',
    intro: 'concepttime-0',
    example: { h: 3, m: 30 },
    reps: [{ id: 'clock', label: '🕒 Read the clock', voice: 'clockread-0', render: (e) => <ClockRead h={e.h} m={e.m} /> }],
  },
  elapsed: {
    title: 'Elapsed time',
    intro: 'conceptelapsed-0',
    example: { h1: 2, m1: 0, dh: 1, dm: 30 },
    reps: [{ id: 'clocks', label: '⏳ Start to end', voice: 'elapsedread-0', render: (e) => <ElapsedClocks h1={e.h1} m1={e.m1} dh={e.dh} dm={e.dm} /> }],
  },
  units: {
    title: 'Measuring units',
    intro: 'conceptunits-0',
    example: { big: 'm', small: 'cm', per: 100, n: 2 },
    reps: [{ id: 'ladder', label: '📐 Unit ladder', voice: 'unitladder-0', render: (e) => <UnitLadder big={e.big} small={e.small} per={e.per} n={e.n} /> }],
  },
  // geometry wave
  shapes: {
    title: 'Naming shapes',
    intro: 'conceptshapes-0',
    example: { sides: 4, name: 'square' },
    reps: [{ id: 'sides', label: '🔷 Count the sides', voice: 'shapesides-0', render: (e) => <ShapeSides sides={e.sides} name={e.name} /> }],
  },
  symmetry: {
    title: 'Symmetry',
    intro: 'conceptsym-0',
    example: { emoji: '🦋' },
    reps: [{ id: 'fold', label: '🦋 Fold in half', voice: 'symfold-0', render: (e) => <SymmetryFold emoji={e.emoji} /> }],
  },
  angles: {
    title: 'What is an angle?',
    intro: 'conceptangle-0',
    example: { deg: 90 },
    reps: [{ id: 'sweep', label: '📐 Open the arm', voice: 'angleturn-0', render: (e) => <AngleSweep deg={e.deg} /> }],
  },
  perimeter: {
    title: 'Perimeter',
    intro: 'conceptperim-0',
    example: { w: 3, h: 2 },
    reps: [{ id: 'trace', label: '🧵 Trace the edge', voice: 'perimtrace-0', render: (e) => <PerimeterTrace w={e.w} h={e.h} /> }],
  },
  area: {
    title: 'Area',
    intro: 'conceptarea-0',
    example: { w: 3, h: 2 },
    reps: [{ id: 'fill', label: '🟩 Fill the squares', voice: 'areafill-0', render: (e) => <AreaFill w={e.w} h={e.h} /> }],
  },
  volume: {
    title: 'Volume',
    intro: 'conceptvol-0',
    example: { l: 3, w: 2, h: 2 },
    reps: [{ id: 'layers', label: '📦 Stack the cubes', voice: 'vollayers-0', render: (e) => <VolumeLayers l={e.l} w={e.w} h={e.h} /> }],
  },
};

export const conceptIdFor = (station) => station?.concept || null;

// The modal itself is the shared @discoveryquest/engine-ui/ConceptScreen; this wrapper just
// resolves a math concept id to its entry so callers keep passing `conceptId`.
export default function ConceptScreen({ conceptId, onDone }) {
  return <EngineConceptScreen concept={CONCEPTS[conceptId]} onDone={onDone} />;
}
