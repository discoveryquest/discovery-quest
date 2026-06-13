// Curriculum: worlds & stations (GDD §4) plus unlock logic (map data only —
// no React here). A station with a `qt` is playable through the QuestionType
// registry at bands [floor..cap]; without one it renders as "coming soon"
// and never gates progression.

export const WORLDS = [
  {
    id: 'number-meadow', title: 'Number Meadow', emoji: '🌼', color: '#4ADE80',
    stations: [
      { id: 'nm-counting', title: 'Counting', icon: '🔢', qt: 'counting', floor: 0, cap: 2 , concept: 'counting', lesson: 'counting' },
      { id: 'nm-compare', title: 'Bigger or Smaller', icon: '⚖️', qt: 'compare', floor: 0, cap: 2 , concept: 'compare-numbers', lesson: 'compare' },
      { id: 'nm-bonds10', title: 'Friends of 10', icon: '🤝', qt: 'bonds', floor: 0, cap: 2 , concept: 'bonds', lesson: 'bonds' },
      { id: 'nm-add20', title: 'Adding to 20', icon: '➕', qt: 'fact-add', floor: 0, cap: 2 , concept: 'addition', lesson: 'addition' },
      { id: 'nm-sub20', title: 'Taking Away', icon: '➖', qt: 'fact-sub', floor: 0, cap: 2 , concept: 'subtraction', lesson: 'subtraction' },
    ],
  },
  {
    id: 'place-value-peaks', title: 'Place Value Peaks', emoji: '🏔️', color: '#22D3EE',
    stations: [
      { id: 'pv-tens-ones', title: 'Tens & Ones', icon: '🧱', qt: 'tens-ones', floor: 0, cap: 1 , concept: 'place-value', lesson: 'place-value' },
      { id: 'pv-hundreds', title: 'Hundreds', icon: '💯', qt: 'tens-ones', floor: 2, cap: 2 , concept: 'place-value', lesson: 'hundreds' },
      { id: 'pv-2digit', title: 'Two-Digit + and −', icon: '🔣', qt: 'twodigit-nr', floor: 0, cap: 2 , concept: 'addition', lesson: 'addition' },
      { id: 'pv-skip', title: 'Skip Counting', icon: '🦘', qt: 'skip', floor: 0, cap: 2 , concept: 'skip-counting', lesson: 'skip-counting' },
      { id: 'pv-evenodd', title: 'Even or Odd', icon: '🎭', qt: 'even-odd', floor: 0, cap: 2 , concept: 'even-odd', lesson: 'even-odd' },
    ],
  },
  {
    id: 'carry-canyon', title: 'Carry Canyon', emoji: '🏜️', color: '#FFE066',
    stations: [
      { id: 'cc-add', title: 'Long Addition', icon: '➕', qt: 'long-add', floor: 0, cap: 2 , concept: 'addition', lesson: 'long-add' },
      { id: 'cc-sub', title: 'Long Subtraction', icon: '➖', qt: 'long-sub', floor: 0, cap: 2 , concept: 'subtraction', lesson: 'long-sub' },
      { id: 'cc-round', title: 'Rounding', icon: '🎯', qt: 'rounding', floor: 0, cap: 2 , concept: 'rounding', lesson: 'rounding' },
      { id: 'cc-words', title: 'Story Problems', icon: '📖', qt: 'word-1step', floor: 0, cap: 2 , concept: 'word-problems', lesson: 'word-problems' },
    ],
  },
  {
    id: 'times-table-trail', title: 'Times Table Trail', emoji: '🛤️', color: '#FB923C',
    stations: [
      { id: 'tt-concept', title: 'Groups & Arrays', icon: '🟪', qt: 'mul-concept', floor: 0, cap: 2, concept: 'multiply', lesson: 'multiply' },
      { id: 'tt-2510', title: 'Tables 2, 5, 10', icon: '✌️', qt: 'tables', floor: 0, cap: 0 , concept: 'multiply', lesson: 'times-2510' },
      { id: 'tt-346', title: 'Tables 3, 4, 6', icon: '🎲', qt: 'tables', floor: 1, cap: 1 , concept: 'multiply', lesson: 'times-346' },
      { id: 'tt-789', title: 'Tables 7, 8, 9', icon: '🎪', qt: 'tables', floor: 2, cap: 2 , concept: 'multiply', lesson: 'times-789' },
      { id: 'tt-divfacts', title: 'Division Facts', icon: '➗', qt: 'div-facts', floor: 0, cap: 2 , concept: 'division', lesson: 'division' },
    ],
  },
  {
    id: 'multiplication-mountain', title: 'Multiplication Mountain', emoji: '⛰️', color: '#A78BFA',
    stations: [
      { id: 'mm-mul1', title: 'Multiply ×1 Digit', icon: '✖️', qt: 'long-mul', floor: 0, cap: 1 , concept: 'multiply', lesson: 'long-multiply' },
      { id: 'mm-mul2', title: 'Multiply ×2 Digits', icon: '🧮', qt: 'long-mul', floor: 2, cap: 2 , concept: 'multiply', lesson: 'long-multiply2' },
      { id: 'mm-div', title: 'Long Division', icon: '➗', qt: 'long-div', floor: 0, cap: 2 , concept: 'division', lesson: 'long-division' },
      { id: 'mm-multi', title: 'Multi-Step Puzzles', icon: '🧩', qt: 'word-2step', floor: 0, cap: 2, concept: 'word-problems', lesson: 'word-problems' },
    ],
  },
  {
    id: 'fraction-forest', title: 'Fraction Forest', emoji: '🌳', color: '#4ADE80',
    stations: [
      { id: 'ff-concept', title: 'What is a Fraction?', icon: '🍕', qt: 'frac-concept', floor: 0, cap: 2 , concept: 'fractions', lesson: 'fractions' },
      { id: 'ff-equiv', title: 'Equivalent Fractions', icon: '🪞', qt: 'frac-equiv', floor: 0, cap: 2 , concept: 'equivalent-fractions', lesson: 'equivalent-fractions' },
      { id: 'ff-compare', title: 'Compare Fractions', icon: '⚖️', qt: 'frac-compare', floor: 0, cap: 2 , concept: 'compare-fractions', lesson: 'compare-fractions' },
      { id: 'ff-addlike', title: 'Add Alike Fractions', icon: '➕', qt: 'frac-addlike', floor: 0, cap: 2 , concept: 'add-fractions', lesson: 'add-fractions' },
      { id: 'ff-addunlike', title: 'Mixed Denominators', icon: '🔀', qt: 'frac-unlike', floor: 0, cap: 2 , concept: 'add-fractions', lesson: 'add-fractions' },
      { id: 'ff-mixed', title: 'Mixed Numbers', icon: '🥪', qt: 'frac-mixed', floor: 0, cap: 2 , concept: 'fractions', lesson: 'mixed-numbers' },
      { id: 'ff-mulwhole', title: 'Fraction × Whole', icon: '✖️', qt: 'frac-mulwhole', floor: 0, cap: 2 , concept: 'fractions', lesson: 'frac-times-whole' },
    ],
  },
  {
    id: 'decimal-docks', title: 'Decimal Docks', emoji: '⚓', color: '#22D3EE',
    stations: [
      { id: 'dd-place', title: 'Decimal Places', icon: '🔬', qt: 'dec-place', floor: 0, cap: 2 , concept: 'decimal-place', lesson: 'decimal-place' },
      { id: 'dd-compare', title: 'Compare Decimals', icon: '⚖️', qt: 'dec-compare', floor: 0, cap: 2 , concept: 'compare-decimals', lesson: 'compare-decimals' },
      { id: 'dd-addsub', title: 'Add & Subtract', icon: '➕', qt: 'dec-addsub', floor: 0, cap: 2 , concept: 'add-decimals', lesson: 'add-decimals' },
      { id: 'dd-pow10', title: '× and ÷ by 10, 100', icon: '🚀', qt: 'dec-pow10', floor: 0, cap: 2 , concept: 'decimal-pow10', lesson: 'decimal-pow10' },
      { id: 'dd-mulwhole', title: 'Decimal × Whole', icon: '✖️' },
      { id: 'dd-convert', title: 'Fractions ↔ Decimals', icon: '🔁', qt: 'dec-convert', floor: 0, cap: 2 , concept: 'decimal-place', lesson: 'decimal-place' },
    ],
  },
  {
    id: 'measure-marsh', title: 'Measure Marsh', emoji: '📏', color: '#F472B6',
    stations: [
      { id: 'ms-money', title: 'Money & Change', icon: '💰', qt: 'money', floor: 0, cap: 2, concept: 'money', lesson: 'money' },
      { id: 'ms-time', title: 'Telling Time', icon: '🕒', qt: 'time', floor: 0, cap: 2, concept: 'time', lesson: 'time' },
      { id: 'ms-elapsed', title: 'Elapsed Time', icon: '⏳', qt: 'elapsed', floor: 0, cap: 2, concept: 'elapsed', lesson: 'elapsed' },
      { id: 'ms-units', title: 'Length & Weight', icon: '⚖️', qt: 'units', floor: 0, cap: 2, concept: 'units', lesson: 'units' },
      { id: 'ms-convert', title: 'Unit Conversions', icon: '🔁', qt: 'unit-convert', floor: 0, cap: 2, concept: 'units', lesson: 'units' },
    ],
  },
  {
    id: 'geometry-galaxy', title: 'Geometry Galaxy', emoji: '🌌', color: '#A78BFA',
    stations: [
      { id: 'gg-shapes', title: 'Name the Shapes', icon: '🔷', qt: 'shapes', floor: 0, cap: 2, concept: 'shapes', lesson: 'shapes' },
      { id: 'gg-symmetry', title: 'Symmetry', icon: '🦋', qt: 'symmetry', floor: 0, cap: 2, concept: 'symmetry', lesson: 'symmetry' },
      { id: 'gg-angles', title: 'Angles', icon: '📐', qt: 'angles', floor: 0, cap: 2, concept: 'angles', lesson: 'angles' },
      { id: 'gg-perimeter', title: 'Perimeter', icon: '🧵', qt: 'perimeter', floor: 0, cap: 2, concept: 'perimeter', lesson: 'perimeter' },
      { id: 'gg-area', title: 'Area', icon: '🟩', qt: 'area', floor: 0, cap: 2, concept: 'area', lesson: 'area' },
      { id: 'gg-volume', title: 'Volume', icon: '📦', qt: 'volume', floor: 0, cap: 2, concept: 'volume', lesson: 'volume' },
    ],
  },
  {
    id: 'word-problem-wilds', title: 'Word Problem Wilds', emoji: '🦁', color: '#FB923C',
    stations: [
      { id: 'wp-onestep', title: 'One-Step Stories', icon: '📗', qt: 'word-1step', floor: 1, cap: 2 , concept: 'word-problems' },
      { id: 'wp-twostep', title: 'Two-Step Stories', icon: '📘', qt: 'word-2step', floor: 0, cap: 2 , concept: 'word-problems' },
      { id: 'wp-master', title: 'Grand Challenge', icon: '🏆', qt: 'word-master', floor: 0, cap: 2 , concept: 'word-problems' },
    ],
  },
];

export const DEFAULT_START_WORLD = 2; // Carry Canyon — first playable world today

export function worldOfStation(stationId) {
  const idx = WORLDS.findIndex((w) => w.stations.some((s) => s.id === stationId));
  return idx === -1 ? null : { world: WORLDS[idx], idx };
}

export const STATION_BY_ID = Object.fromEntries(
  WORLDS.flatMap((w) => w.stations.map((s) => [s.id, s])),
);

export const isPlayable = (station) => !!station.qt;
export const worldHasPlayable = (world) => world.stations.some(isPlayable);

const starsOf = (save, stationId) => save.stations[stationId]?.stars || 0;

export function worldStars(save, world) {
  return world.stations.filter(isPlayable).reduce((a, s) => a + starsOf(save, s.id), 0);
}

// Dev/local review aid: on localhost with `?unlock` in the URL, every station is
// treated as open so you can review any "Learn it" screen — WITHOUT touching the
// saved progress (normal local progress testing is unaffected, and this never
// activates on the deployed domain).
export const DEV_UNLOCK =
  typeof location !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname) &&
  new URLSearchParams(location.search).has('unlock');

export function isWorldUnlocked(save, wIdx) {
  if (DEV_UNLOCK) return true;
  const start = save.profile.startWorld ?? DEFAULT_START_WORLD;
  if (wIdx <= start) return true;
  // gate on the nearest earlier world that has anything playable: enough
  // stars overall, OR the whole path walked (≥1 star at every station) so a
  // one-star-at-a-time player is never dead-ended
  for (let i = wIdx - 1; i >= 0; i--) {
    const playable = WORLDS[i].stations.filter(isPlayable);
    if (playable.length === 0) continue;
    return (
      worldStars(save, WORLDS[i]) >= Math.ceil(playable.length * 3 * 0.6) ||
      playable.every((s) => (save.stations[s.id]?.stars || 0) >= 1)
    );
  }
  return true;
}

// 'soon' | 'locked' | 'open' (open includes already-starred stations)
export function stationState(save, wIdx, sIdx) {
  const station = WORLDS[wIdx].stations[sIdx];
  if (!isPlayable(station)) return 'soon';
  if (DEV_UNLOCK) return 'open';
  if (!isWorldUnlocked(save, wIdx)) return 'locked';
  // gated by the nearest earlier playable station in the same world
  for (let i = sIdx - 1; i >= 0; i--) {
    const prev = WORLDS[wIdx].stations[i];
    if (!isPlayable(prev)) continue;
    return starsOf(save, prev.id) >= 1 ? 'open' : 'locked';
  }
  return 'open';
}

// The hero token sits at the furthest unlocked playable station.
export function heroStation(save) {
  let at = null;
  for (let w = 0; w < WORLDS.length; w++) {
    for (let s = 0; s < WORLDS[w].stations.length; s++) {
      if (isPlayable(WORLDS[w].stations[s]) && stationState(save, w, s) === 'open') {
        at = { w, s };
      }
    }
  }
  return at;
}
