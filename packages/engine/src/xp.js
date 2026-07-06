// Derived cross-course XP (Phase 2). Pure function of signals already stored in a
// per-course save (telemetry/stars/conceptSeen). No event counter, no migration.
// All weights centralized here for tuning. See docs/specs/2026-06-17-xp-hero-ledger-design.md.
export const XP = {
  CORRECT: 10,       // per correct answer (capped per station)
  CORRECT_CAP: 15,   // max corrects counted per station (≈ corrects to 3★; anti-farm)
  PER_STAR: 50,      // per star earned on a station (0–3)
  REVIEW: 15,        // per "blast from the past" review hit (Math-only by nature)
  STREAK: 25,        // per distinct active day
  CONCEPT: 30,       // per new concept/lesson seen
  PER_LEVEL_K: 100,  // level curve constant
};

// Sum per-station correct counts across all telemetry days → { stationId: corrects }.
function correctsByStation(save) {
  const out = {};
  for (const day of Object.values(save?.telemetry || {})) {
    for (const [sid, c] of Object.entries(day)) out[sid] = (out[sid] || 0) + (c.correct || 0);
  }
  return out;
}
function reviewHits(save) {
  let n = 0;
  for (const day of Object.values(save?.telemetry || {})) for (const c of Object.values(day)) n += c.reviewsHit || 0;
  return n;
}
const activeDays = (save) => Object.keys(save?.telemetry || {}).length;
const starCount = (save) => Object.values(save?.stations || {}).reduce((a, s) => a + (s.stars || 0), 0);
const conceptCount = (save) => Object.keys(save?.conceptSeen || {}).length;

export function computeXp(save) {
  if (!save || typeof save !== 'object') return 0;
  let xp = 0;
  for (const corrects of Object.values(correctsByStation(save))) {
    xp += Math.min(corrects, XP.CORRECT_CAP) * XP.CORRECT;
  }
  xp += starCount(save) * XP.PER_STAR;
  xp += reviewHits(save) * XP.REVIEW;
  xp += activeDays(save) * XP.STREAK;
  xp += conceptCount(save) * XP.CONCEPT;
  return xp;
}

// Per-station XP contribution (for the dashboard drill-down). Mirrors computeXp's
// per-station terms: capped corrects + stars. (Streak/concepts/reviews aren't per-station.)
export function xpByStation(save) {
  const out = {};
  const corrects = correctsByStation(save);
  const ids = new Set([...Object.keys(corrects), ...Object.keys(save?.stations || {})]);
  for (const sid of ids) {
    const c = Math.min(corrects[sid] || 0, XP.CORRECT_CAP) * XP.CORRECT;
    const st = (save?.stations?.[sid]?.stars || 0) * XP.PER_STAR;
    out[sid] = c + st;
  }
  return out;
}

// XP split by source, for the kid-facing "where did my stars come from?" sheet
// (Pavel's founding request). Sums to computeXp(save). Each field is already-XP
// (weighted), so the sheet can list them directly.
export function xpBreakdown(save) {
  if (!save || typeof save !== 'object') return { correct: 0, stars: 0, reviews: 0, streak: 0, concepts: 0, total: 0 };
  let correct = 0;
  for (const corrects of Object.values(correctsByStation(save))) correct += Math.min(corrects, XP.CORRECT_CAP) * XP.CORRECT;
  const stars = starCount(save) * XP.PER_STAR;
  const reviews = reviewHits(save) * XP.REVIEW;
  const streak = activeDays(save) * XP.STREAK;
  const concepts = conceptCount(save) * XP.CONCEPT;
  return { correct, stars, reviews, streak, concepts, total: correct + stars + reviews + streak + concepts };
}

export const totalXp = (xpByCourse) => Object.values(xpByCourse || {}).reduce((a, n) => a + (n || 0), 0);
export const heroLevel = (xp) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / XP.PER_LEVEL_K));
export function heroProgress(xp) {
  const level = heroLevel(xp);
  const at = (n) => (n - 1) ** 2 * XP.PER_LEVEL_K; // xp threshold for level n
  const into = Math.max(0, xp) - at(level);
  const span = at(level + 1) - at(level);
  return { level, into, span, pct: span ? into / span : 0 };
}
