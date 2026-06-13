// Versioned save system for Luna's Math Quest (GDD §10).
// One localStorage key holds the whole save; `version` + migrate() make the
// schema safely evolvable. Legacy POC keys (nova-score/-name/-sound) are
// absorbed on first load. Storage is injectable so node smoke tests can run
// without a browser.

// One localStorage key per app. Defaults to math's ('lmq-save'); other apps on the
// shared engine call setSaveKey() once at startup (e.g. English → 'eq-save') so their
// saves never collide. Default unchanged → math behavior identical.
let SAVE_KEY = 'lmq-save';
export function setSaveKey(key) {
  if (key) SAVE_KEY = key;
}
export const SAVE_VERSION = 1;

export function defaultSave() {
  return {
    version: SAVE_VERSION,
    profile: { id: null, name: null, avatar: '🦊', age: null, startWorld: null },
    stations: {}, // stationId → { stars, bestBand, attempts }
    review: {}, // stationId → { box, lastSeen, lastQuest } (see reviewDeck.js)
    questCount: 0,
    tutorialSeen: {},
    conceptSeen: {},
    telemetry: {}, // dayKey → stationId → counters (see telemetry.js)
    score: 0,
    gems: 0,
    settings: { sound: true, music: true },
  };
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.version !== 'number') return defaultSave();
  let save = raw;
  // future: case 1 → 2 transforms go here, falling through in order
  if (save.version > SAVE_VERSION) {
    // save from a newer build — keep what we understand, never crash
    save = { ...defaultSave(), ...save, version: SAVE_VERSION };
  }
  // backfill any fields added without a version bump
  return { ...defaultSave(), ...save, profile: { ...defaultSave().profile, ...save.profile }, settings: { ...defaultSave().settings, ...save.settings } };
}

function absorbLegacy(save, storage) {
  const score = Number(storage.getItem('nova-score'));
  const name = storage.getItem('nova-name');
  const sound = storage.getItem('nova-sound');
  if (Number.isFinite(score) && score > 0) save.score = score;
  if (name) save.profile.name = name;
  if (sound) save.settings.sound = sound !== 'off';
  for (const k of ['nova-score', 'nova-name', 'nova-sound']) storage.removeItem(k);
  return save;
}

// Stable per-profile id, used as the cloud-sync key (T8.2). Assigned once.
function ensureProfileId(save, storage) {
  if (!save.profile.id) {
    save.profile.id = globalThis.crypto?.randomUUID?.() || `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    try { storage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ }
  }
  return save;
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw == null) {
      const fresh = absorbLegacy(defaultSave(), storage);
      ensureProfileId(fresh, storage);
      storage.setItem(SAVE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return ensureProfileId(migrate(JSON.parse(raw)), storage);
  } catch {
    return defaultSave(); // corrupted JSON or storage unavailable
  }
}

export function persistSave(save, storage = globalThis.localStorage) {
  try {
    save.updatedAt = Date.now(); // drives last-write-wins for preferences in sync merge
    storage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* storage full/unavailable — play on without persistence */
  }
}

// Load → mutate in place → persist. Returns the updated save.
export function mutateSave(fn, storage = globalThis.localStorage) {
  const save = loadSave(storage);
  fn(save);
  persistSave(save, storage);
  return save;
}
