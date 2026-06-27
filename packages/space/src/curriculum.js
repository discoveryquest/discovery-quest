// Pure star-gating for Space Quest (mirrors english/src/curriculum.js). Worlds come
// from the loaded course and are passed in, so this stays data-driven and node-testable.
export const starsOf = (save, id) => save?.stations?.[id]?.stars || 0;

// Age → the chapter a child starts on. Younger (earlier) worlds below this are folded into
// "For younger explorers" chips on the map (collapsedBelow) — presentation + start point,
// not a hard skip (they stay accessible). Never collapse away the last two chapters.
export function startWorldForAge(age, worldCount = 4) {
  const a = typeof age === 'string' ? parseInt(age, 10) : age;
  let start = 0;
  if (Number.isFinite(a)) {
    if (a >= 10) start = 2;
    else if (a >= 8) start = 1;
  }
  return Math.min(start, Math.max(0, worldCount - 2));
}

// A chapter (world) unlocks when it's at/below the child's start chapter, OR the previous
// chapter is CLEARED — its last station earned ≥1 star. (Within-world gating means a star on
// the last station implies a star on every station before it.)
export function isWorldUnlocked(save, worlds, wIdx, startWorld = 0) {
  if (wIdx <= startWorld) return true;
  const prev = worlds[wIdx - 1];
  const last = prev?.stations[prev.stations.length - 1];
  return !!last && starsOf(save, last.id) > 0;
}

// A station opens when it's the first in its world, or its predecessor has ≥1 star.
// (World-level locking is layered on top by stateOf, which also has the world index.)
export function isStationOpen(save, world, index) {
  const st = world.stations[index];
  if (st.soon) return false;
  if (index === 0) return true;
  const prev = world.stations[index - 1];
  return !prev.soon && starsOf(save, prev.id) > 0;
}

const playableOf = (worlds) => worlds.flatMap((w) => w.stations.filter((s) => !s.soon));
export const totalStars = (save, worlds) => playableOf(worlds).reduce((n, s) => n + starsOf(save, s.id), 0);
export const maxStars = (worlds) => playableOf(worlds).length * 3;

// Where the hero token sits (and where the map scrolls on mount): the EARLIEST open,
// unmastered station at or beyond the child's start chapter, in an unlocked world. Scanning
// from startWorld keeps the hero at the child's level (not back in a collapsed younger world),
// and skipping locked worlds keeps it from jumping into a not-yet-unlocked chapter.
export function frontierStation(save, worlds, startWorld = 0) {
  for (let wIdx = Math.min(startWorld, Math.max(0, worlds.length - 1)); wIdx < worlds.length; wIdx++) {
    if (!isWorldUnlocked(save, worlds, wIdx, startWorld)) continue;
    const world = worlds[wIdx];
    for (let k = 0; k < world.stations.length; k++) {
      if (isStationOpen(save, world, k) && starsOf(save, world.stations[k].id) < 3) {
        return world.stations[k].id;
      }
    }
  }
  return null;
}
