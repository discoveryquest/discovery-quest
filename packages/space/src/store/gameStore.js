// Space Quest game store — the single source of truth for the 3D scene AND the
// 2D HUD. Pure state-machine transitions + a tiny framework-agnostic store, so
// the logic is unit-testable headlessly (no React/three needed). React binds to
// it via ./useGame.js (useSyncExternalStore); the 3D scene dispatches actions,
// the HUD reads state. See design spec §7.3 (state machine) and §8 (contract).

export const PHASES = {
  GALACTIC: 'GALACTIC',        // picking a sector on the star chart
  FLYING: 'FLYING',            // guided travel toward a locked beacon
  STATION_IDLE: 'STATION_IDLE',// arrived at a station; objective shown
  GATE_ACTIVE: 'GATE_ACTIVE',  // a Cosmic Gate mini-game is running
  SECTOR_COMPLETE: 'SECTOR_COMPLETE',
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function initialState() {
  return {
    phase: PHASES.GALACTIC,
    sectorId: null,
    stationOrder: [],          // ordered station ids for the active sector
    stationId: null,           // station we are currently at (STATION_IDLE/GATE_ACTIVE)
    lockedBeacon: null,        // station id the ship is steering toward
    cameraMode: 'cruise',      // 'cruise' (travel) | 'approach' (at a station)
    unlocked: {},              // { [stationId]: true }
    stars: {},                 // { [stationId]: 0..3 }
    learned: {},               // { [stationId]: true } — its facts are in the Discovery Deck
  };
}

// ---- Pure transitions (state -> state). Invalid transitions return state unchanged. ----

// Enter a sector and begin guided travel to its first beacon. Unlocked is
// re-derived from persisted stars, so revisiting a sector via the Star Chart
// keeps progress: a station is unlocked if it's first, already earned stars, or
// its predecessor did.
export function warpTo(state, { sectorId, stationOrder = [] }) {
  const unlocked = {};
  stationOrder.forEach((id, i) => {
    if (i === 0 || (state.stars[id] || 0) > 0 || (state.stars[stationOrder[i - 1]] || 0) > 0) {
      unlocked[id] = true;
    }
  });
  const first = stationOrder[0] ?? null;
  return {
    ...state,
    sectorId,
    stationOrder: [...stationOrder],
    unlocked,
    stationId: null,
    lockedBeacon: first,
    cameraMode: 'cruise',
    phase: first ? PHASES.FLYING : PHASES.GALACTIC,
  };
}

// Open the Star Chart (warp out of the current sector). Progress is retained.
export function openStarChart(state) {
  return { ...state, phase: PHASES.GALACTIC, stationId: null, lockedBeacon: null };
}

// Mark a station's facts as collected into the Discovery Deck (spec §5.3).
export function markLearned(state, stationId) {
  if (!stationId || state.learned[stationId]) return state;
  return { ...state, learned: { ...state.learned, [stationId]: true } };
}

// Child taps a beacon: steer the ship toward it (only if that station is unlocked).
export function lockBeacon(state, stationId) {
  if (!state.unlocked[stationId]) return state;
  return { ...state, lockedBeacon: stationId, stationId: null, cameraMode: 'cruise', phase: PHASES.FLYING };
}

// Proximity trigger from the 3D scene: the ship reached the locked beacon.
export function arriveStation(state, stationId) {
  if (!state.unlocked[stationId]) return state;
  return { ...state, phase: PHASES.STATION_IDLE, stationId, lockedBeacon: stationId, cameraMode: 'approach' };
}

// Begin the station's Cosmic Gate (only from an idle station).
export function startGate(state) {
  if (state.phase !== PHASES.STATION_IDLE || !state.stationId) return state;
  return { ...state, phase: PHASES.GATE_ACTIVE };
}

// Resolve the gate: record stars (best-of), unlock the next station, and either
// complete the sector or return to the idle station.
export function resolveGate(state, { stars = 0 } = {}) {
  if (state.phase !== PHASES.GATE_ACTIVE || !state.stationId) return state;
  const sid = state.stationId;
  const nextStars = { ...state.stars, [sid]: Math.max(state.stars[sid] || 0, clamp(stars, 0, 3)) };
  const idx = state.stationOrder.indexOf(sid);
  const next = state.stationOrder[idx + 1];
  const unlocked = next ? { ...state.unlocked, [next]: true } : { ...state.unlocked };
  const allDone = state.stationOrder.length > 0 && state.stationOrder.every((id) => (nextStars[id] || 0) > 0);
  return {
    ...state,
    stars: nextStars,
    unlocked,
    cameraMode: 'approach',
    phase: allDone ? PHASES.SECTOR_COMPLETE : PHASES.STATION_IDLE,
  };
}

// ---- Tiny store (subscribe / get / actions). Framework-agnostic. ----

// ENGINE SEAM: the app shell injects a persister (see ../progress.js) that writes
// stars + telemetry into the @discoveryquest/engine save so computeXp()/heroLevel()
// pick the result up. Kept as an injection so the store stays engine-free + testable.
let _persistGate = null;
export function setGatePersister(fn) { _persistGate = fn; }

// Same idea for the "Learn it" check (questions before the gate): records correct
// answers + concept-seen into the engine save. Injected so the store stays engine-free.
let _persistLesson = null;
export function setLessonPersister(fn) { _persistLesson = fn; }

export function createGameStore(initial = initialState()) {
  let state = initial;
  const listeners = new Set();
  const get = () => state;
  const set = (next) => { if (next !== state) { state = next; for (const l of listeners) l(); } };
  const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

  const actions = {
    warpTo: (p) => set(warpTo(get(), p)),
    openStarChart: () => set(openStarChart(get())),
    // Record a finished "Learn it" check (no phase change — the lesson lives in
    // the STATION_IDLE UI). Persists correct answers + concept via the seam.
    recordLesson: ({ correct = 0, concept = null } = {}) => {
      const sid = get().stationId;
      if (!sid) return;
      set(markLearned(get(), sid)); // collect its facts into the Discovery Deck
      if (_persistLesson) {
        try { _persistLesson({ stationId: sid, correct, concept }); } catch { /* never break gameplay */ }
      }
    },
    lockBeacon: (id) => set(lockBeacon(get(), id)),
    arriveStation: (id) => set(arriveStation(get(), id)),
    startGate: () => set(startGate(get())),
    resolveGate: (result = {}) => {
      const before = get();
      const next = resolveGate(before, result);
      set(next);
      // Only persist on a real resolution (resolveGate returns the same object on
      // an invalid transition). stationId comes from `before` (next may have moved on).
      if (next !== before && _persistGate && before.stationId) {
        try {
          _persistGate({
            stationId: before.stationId,
            stars: clamp(result.stars ?? 0, 0, 3),
            correct: result.correct ?? 0,
            concept: result.concept ?? null,
          });
        } catch { /* never let persistence break gameplay */ }
      }
      return next;
    },
    reset: () => set(initialState()),
  };

  return { get, set, subscribe, actions };
}

// Module-singleton store shared by the in-Canvas scene and the out-of-Canvas HUD.
export const gameStore = createGameStore();
