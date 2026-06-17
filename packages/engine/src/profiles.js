// Device-wide profile registry (shared identity across courses). One localStorage
// key holds the canonical roster + the device-local "last used" pointer per course.
// Canonical for name/avatar/age; course saves keep profile.id as the join key and
// mirror identity for back-compat. Storage injectable for node tests (like save.js).
import { SAVE_VERSION } from './save.js'; // value-only import (not the SAVE_KEY-bound fns)

export const REGISTRY_KEY = 'dq-profiles';
export const REGISTRY_VERSION = 1;

export function defaultRegistry() {
  return { version: REGISTRY_VERSION, profiles: [], lastUsedByCourse: {}, updatedAt: 0 };
}

export function loadRegistry(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(REGISTRY_KEY);
    if (raw == null) return defaultRegistry();
    const r = JSON.parse(raw);
    if (!r || typeof r !== 'object') return defaultRegistry();
    return { ...defaultRegistry(), ...r };
  } catch { return defaultRegistry(); }
}

export function persistRegistry(reg, storage = globalThis.localStorage) {
  try { reg.updatedAt = Date.now(); storage.setItem(REGISTRY_KEY, JSON.stringify(reg)); } catch { /* ignore */ }
}

// Build a registry from whatever per-course saves already exist on the device.
// `sources` = [{ key, courseId }]. Dedup profiles by id; set lastUsedByCourse.
export function seedFromSaves(storage = globalThis.localStorage, sources = []) {
  const reg = defaultRegistry();
  const byId = new Map();
  for (const { key, courseId } of sources) {
    let save;
    try { save = JSON.parse(storage.getItem(key)); } catch { save = null; }
    const p = save?.profile;
    // Only seed profiles that represent a real, onboarded child — i.e. one with
    // a chosen name. loadSave() eagerly mints a profile.id on a fresh save, so an
    // id alone is not evidence of a real profile; seeding those would spawn
    // nameless phantom profiles. This also means legacy English/EFL saves (which
    // never collected a name) correctly fall through to the new onboarding.
    if (!p?.id || !(p.name && String(p.name).trim())) continue;
    if (!byId.has(p.id)) {
      byId.set(p.id, { id: p.id, name: p.name, avatar: p.avatar ?? '🦊', age: p.age ?? null, createdAt: Date.now(), updatedAt: Date.now() });
    }
    reg.lastUsedByCourse[courseId] = p.id;
  }
  reg.profiles = [...byId.values()];
  return reg;
}

const newId = () => globalThis.crypto?.randomUUID?.() || `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;

// Pure gate: given a courseId and the current registry, decide the screen.
export function resolveActiveProfile(courseId, reg) {
  if (!reg.profiles?.length) return { mode: 'setup' };
  const pid = reg.lastUsedByCourse?.[courseId];
  if (pid && reg.profiles.some((p) => p.id === pid)) return { mode: 'game', profileId: pid };
  return { mode: 'picker' };
}

// Mirror canonical identity into a course save (id + name/avatar/age) without
// touching progress. Reads/writes raw save JSON directly so this stays
// key-agnostic and storage-injectable (do NOT use loadSave/persistSave here).
function mirrorIntoSave(storage, saveKey, profile) {
  let save;
  try { save = JSON.parse(storage.getItem(saveKey)); } catch { save = null; }
  save = save && typeof save === 'object' ? save : {};
  // Stamp a version so migrate() treats this as a valid save. Without it, a mirror
  // that is the FIRST writer of a course save (no prior loadSave) would be seen as
  // versionless and reset to defaultSave() on the next load — silently dropping the
  // mirrored identity and any progress written after.
  save.version = save.version || SAVE_VERSION;
  save.profile = { ...(save.profile || {}), id: profile.id, name: profile.name, avatar: profile.avatar, age: profile.age };
  save.updatedAt = Date.now();
  try { storage.setItem(saveKey, JSON.stringify(save)); } catch { /* ignore */ }
}

export function createProfile(storage = globalThis.localStorage, { courseId, saveKey, fields }) {
  const reg = loadRegistry(storage);
  const profile = { id: newId(), name: fields.name ?? null, avatar: fields.avatar ?? '🦊', age: fields.age ?? null, createdAt: Date.now(), updatedAt: Date.now() };
  reg.profiles.push(profile);
  reg.lastUsedByCourse[courseId] = profile.id;
  persistRegistry(reg, storage);
  mirrorIntoSave(storage, saveKey, profile);
  return { reg, profile };
}

export function setActiveProfile(storage = globalThis.localStorage, { reg, courseId, saveKey, profileId }) {
  const profile = reg.profiles.find((p) => p.id === profileId);
  if (!profile) return reg;
  reg.lastUsedByCourse[courseId] = profileId;
  persistRegistry(reg, storage);
  mirrorIntoSave(storage, saveKey, profile);
  return reg;
}

export function editProfile(storage = globalThis.localStorage, { reg, saveKey, profileId, fields }) {
  const profile = reg.profiles.find((p) => p.id === profileId);
  if (!profile) return reg;
  Object.assign(profile, fields, { updatedAt: Date.now() });
  persistRegistry(reg, storage);
  if (saveKey) mirrorIntoSave(storage, saveKey, profile);
  return reg;
}

// Load registry; on a first run with no registry but existing saves, seed it.
export function ensureRegistry(storage = globalThis.localStorage, sources = []) {
  const raw = (() => { try { return storage.getItem(REGISTRY_KEY); } catch { return null; } })();
  if (raw != null) return loadRegistry(storage);
  const seeded = seedFromSaves(storage, sources);
  persistRegistry(seeded, storage);
  return seeded;
}

function mergeXpByCourse(a = {}, b = {}) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = Math.max(a[k] || 0, b[k] || 0);
  return out;
}

// Pure roster merge for sync (runs identically on client + server). Union by id;
// per-field last-write-wins by updatedAt. lastUsedByCourse is device-local and
// intentionally dropped from the merged result (never synced).
export function mergeRoster(a, b) {
  const ap = (a && a.profiles) || [];
  const bp = (b && b.profiles) || [];
  const byId = new Map();
  for (const p of [...ap, ...bp]) {
    const cur = byId.get(p.id);
    if (!cur) { byId.set(p.id, { ...p }); continue; }
    const winner = (p.updatedAt || 0) >= (cur.updatedAt || 0) ? { ...cur, ...p } : { ...p, ...cur };
    const xp = mergeXpByCourse(cur.xpByCourse, p.xpByCourse);
    if (Object.keys(xp).length) winner.xpByCourse = xp; else delete winner.xpByCourse;
    byId.set(p.id, winner);
  }
  return { version: REGISTRY_VERSION, profiles: [...byId.values()], updatedAt: Math.max(a?.updatedAt || 0, b?.updatedAt || 0) };
}
