// Cosmic Gate: "Orbit Sort" (spec §3, Sector 2). The child orders planets from
// closest-to-the-Sun outward, teaching relative distance/scale (NGSS 5-ESS1-1,
// MS-ESS1-3). Pure scoring — no three/React — so it is unit-testable.

// Stars by how many planets land in their correct absolute position.
export function scoreOrder(correctIds, playerIds) {
  const total = correctIds.length;
  let correctCount = 0;
  for (let i = 0; i < total; i++) if (playerIds[i] === correctIds[i]) correctCount++;
  const ratio = total ? correctCount / total : 0;
  const stars = ratio >= 1 ? 3 : ratio >= 0.66 ? 2 : ratio >= 0.33 ? 1 : 0;
  return { correctCount, total, stars };
}

// Shuffle a copy (Fisher–Yates), guaranteeing the result differs from the input
// so the puzzle is never pre-solved. `rand` is injectable for deterministic tests.
export function scramble(items, rand = Math.random) {
  if (items.length < 2) return [...items];
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.every((x, i) => x === items[i])) [a[0], a[1]] = [a[1], a[0]];
  return a;
}
