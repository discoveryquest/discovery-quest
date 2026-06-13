// Field-wise save merge (platform sync, T8.2). The contract: merging is
// order-independent and idempotent for PROGRESS, so neither the device nor the
// cloud can ever lose a star. Mutable PREFERENCES use last-write-wins by
// updatedAt. Pure — no IO, no DOM — so it runs identically on client + server
// and is unit-testable.

const num = (a, b) => Math.max(a || 0, b || 0);

function mergeStations(a = {}, b = {}) {
  const out = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[id] || {};
    const y = b[id] || {};
    out[id] = {
      stars: num(x.stars, y.stars),
      bestBand: num(x.bestBand, y.bestBand),
      attempts: num(x.attempts, y.attempts),
    };
  }
  return out;
}

function mergeReview(a = {}, b = {}) {
  const out = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[id];
    const y = b[id];
    if (!x) { out[id] = y; continue; }
    if (!y) { out[id] = x; continue; }
    // higher Leitner box wins; tie → more recently seen
    const keep = y.box > x.box || (y.box === x.box && (y.lastSeen || 0) > (x.lastSeen || 0)) ? y : x;
    out[id] = { ...keep, lastQuest: num(x.lastQuest, y.lastQuest) };
  }
  return out;
}

// Telemetry buckets are additive but we lack per-event ids, so a re-sync of the
// same data must not inflate counts: field-wise MAX per day/station/counter.
// This can undercount genuine same-day multi-device play; acceptable for the
// dashboard, and it can never double-count.
function mergeTelemetry(a = {}, b = {}) {
  const out = {};
  for (const day of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const da = a[day] || {};
    const db = b[day] || {};
    out[day] = {};
    for (const sid of new Set([...Object.keys(da), ...Object.keys(db)])) {
      const x = da[sid] || {};
      const y = db[sid] || {};
      const m = {};
      for (const f of new Set([...Object.keys(x), ...Object.keys(y)])) m[f] = num(x[f], y[f]);
      out[day][sid] = m;
    }
  }
  return out;
}

export function mergeSaves(a, b) {
  if (!a) return b;
  if (!b) return a;
  // newer doc wins preference fields (profile, settings)
  const newer = (b.updatedAt || 0) >= (a.updatedAt || 0) ? b : a;
  return {
    version: num(a.version, b.version),
    updatedAt: num(a.updatedAt, b.updatedAt),
    profile: { ...newer.profile },
    settings: { ...newer.settings },
    score: num(a.score, b.score),
    gems: num(a.gems, b.gems),
    questCount: num(a.questCount, b.questCount),
    stations: mergeStations(a.stations, b.stations),
    review: mergeReview(a.review, b.review),
    tutorialSeen: { ...a.tutorialSeen, ...b.tutorialSeen },
    telemetry: mergeTelemetry(a.telemetry, b.telemetry),
  };
}
