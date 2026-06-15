// Subject-agnostic YAML→runtime loader. Input: a parsed, course:check-valid course doc
// + a board registry { [kind]: { generate, board, content } }. Output: a runnable Course
// (worlds → stations with a bound generate() + Board, plus lessons/narration/meta).
// It knows nothing about phonics or vocab — only how to slice content by band and bind
// the registry's generator. Assumes the doc already passed course:check (no re-validation).

function sliceByBand(items, bands) {
  if (!Array.isArray(items)) return items; // wordbank/object collections pass through
  // A collection is "tagged" if ANY item carries `band`. Within a tagged collection every
  // item must carry `band` — an item missing it is dropped here (Set.has(undefined) is
  // false). course:check guarantees this (a band-tagged collection is uniformly tagged), so
  // we don't guard for mixed collections; if you add an item, give it a band.
  const tagged = items.some((it) => it && typeof it === 'object' && 'band' in it);
  if (!tagged) return items; // untagged collection → use all of it; band is difficulty-only
  const set = new Set(bands || []);
  return items.filter((it) => set.has(it.band));
}

function bindStation(s, worldId, course, content, registry) {
  const entry = registry[s.board];
  if (!entry) throw new Error(`loadCourse: no registry entry for board "${s.board}"`);
  const items = sliceByBand(entry.content ? content[entry.content] : undefined, s.bands);
  const ctx = { band: (s.bands && s.bands[0]) ?? 0, lowercase: !!course.lowercase };
  return {
    id: s.id, title: s.title, icon: s.icon, sub: s.sub, worldId,
    board: s.board, bands: s.bands || [], lessonId: s.lesson,
    Board: entry.board,
    generate: () => entry.generate(items, ctx),
  };
}

export function loadCourse(doc, registry) {
  // Accepts either a wrapped `{ course: {...} }` doc (what js-yaml produces from a
  // <id>.course.yml — the normal caller) or a bare course object (convenience for tests).
  const c = doc.course || doc;
  const content = c.content || {};
  const worlds = (c.worlds || []).map((w) => ({
    id: w.id, title: w.title, emoji: w.emoji, color: w.color, blurb: w.blurb,
    stations: (w.stations || []).map((s) => bindStation(s, w.id, c, content, registry)),
  }));
  const stationsById = new Map();
  for (const w of worlds) for (const s of w.stations) stationsById.set(s.id, s);
  return {
    meta: {
      id: c.id, title: c.title, subject: c.subject, companion: c.companion,
      voice: c.voice, lowercase: c.lowercase, ui: c.ui, reactions: c.reactions,
    },
    worlds, stationsById, lessonsById: c.lessons || {}, narration: c.narration || {},
  };
}
