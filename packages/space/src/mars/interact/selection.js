// Pure rock-selection logic (no three/rapier), so it's unit-testable. Held rocks
// carry pos === null and are ignored. Used by InteractionController each frame.
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;

/** id of the nearest rock whose center is within maxDist of player, else null. */
export function pickNearestInRange(player, rocks, maxDist) {
  const max2 = maxDist * maxDist;
  let best = null, bestD = Infinity;
  for (const r of rocks) {
    if (!r.pos) continue;
    const dd = d2(player, r.pos);
    if (dd <= max2 && dd < bestD) { bestD = dd; best = r.id; }
  }
  return best;
}
