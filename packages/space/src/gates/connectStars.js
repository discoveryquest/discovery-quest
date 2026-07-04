// Cosmic Gate: "Connect the Stars" (spec §3, Sector 3). The child traces a
// constellation by tapping its stars in sequence. Pure scoring — no three/React.
// Constellation lines are undirected, so a trace counts if it draws the right
// edges regardless of direction.

const edgeKey = (a, b) => [a, b].sort().join('|');

// Set of undirected edges along a tapped/correct sequence of star ids.
export function pathEdges(order = []) {
  const set = new Set();
  for (let i = 0; i < order.length - 1; i++) {
    if (order[i] !== order[i + 1]) set.add(edgeKey(order[i], order[i + 1]));
  }
  return set;
}

// Stars by edge recall; a perfect 3 needs every correct line AND no wrong ones.
export function scoreConstellation(correctOrder, playerOrder) {
  const correct = pathEdges(correctOrder);
  const player = pathEdges(playerOrder);
  let matched = 0;
  for (const e of player) if (correct.has(e)) matched++;
  const total = correct.size;
  const wrong = player.size - matched;
  const ratio = total ? matched / total : 0;
  const stars = ratio >= 1 && wrong === 0 ? 3 : ratio >= 0.66 ? 2 : ratio >= 0.33 ? 1 : 0;
  return { matched, total, wrong, stars };
}
