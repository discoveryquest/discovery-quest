// Hero badges (Pavel's founding design, decisions locked 2026-07-04):
//   • A course "Hero" badge = a star on EVERY playable station of that course
//     (1★ is enough — decision a). It turns GOLD when every station is 3★.
//   • "Super Hero" = a Hero badge on 3 or more courses (cross-course → needs an
//     account; decision b — the roster is the bridge).
// Pure functions of a per-course save + that course's playable station ids, so
// they're testable and shared by the in-game sheet and the parents dashboard.

export const TIER = { NONE: 0, HERO: 1, GOLD: 2 };
export const SUPER_HERO_COURSES = 3;

// One course's badge from its save + the list of station ids that count toward it
// (the course's playable stations — callers pass e.g. playableOf(worlds).map(id)).
export function courseBadge(save, stationIds = []) {
  const ids = stationIds.filter(Boolean);
  if (!ids.length) return { tier: TIER.NONE, earned: false, gold: false, starred: 0, total: 0 };
  let starred = 0;
  let allThree = true;
  for (const id of ids) {
    const stars = save?.stations?.[id]?.stars || 0;
    if (stars >= 1) starred += 1;
    if (stars < 3) allThree = false;
  }
  const earned = starred === ids.length;
  const gold = earned && allThree;
  return { tier: gold ? TIER.GOLD : earned ? TIER.HERO : TIER.NONE, earned, gold, starred, total: ids.length };
}

// Super Hero from a map of already-computed course badges ({ courseId: badge }).
// Cross-course, so the host builds this from the signed-in roster.
export function superHero(badgesByCourse = {}) {
  const heroCount = Object.values(badgesByCourse).filter((b) => b?.earned).length;
  const goldCount = Object.values(badgesByCourse).filter((b) => b?.gold).length;
  return { earned: heroCount >= SUPER_HERO_COURSES, gold: goldCount >= SUPER_HERO_COURSES, heroCount, goldCount };
}
