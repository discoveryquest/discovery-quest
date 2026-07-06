// Shape-counting geometry for Shape Shore (Logic Quest design spec §3.2).
// Pure + node-testable. A figure is integer-coordinate `vertices` plus direct
// `edges` (index pairs). The classic puzzles hide composite shapes whose sides
// span several collinear edges (a triangle's side may pass THROUGH a point),
// so the core primitive is straight-connectivity: P and Q are straight-
// connected when every consecutive pair of figure points lying on segment PQ
// is a direct edge. Shapes are DERIVED here — never authored — so the game
// can't ship a wrong answer key.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const collinear3 = (a, b, c) => cross(sub(b, a), sub(c, a)) === 0;
// c strictly between a and b (collinear assumed)
const between = (a, b, c) =>
  collinear3(a, b, c) && dot(sub(c, a), sub(c, b)) < 0;

export function straightConnected(vertices, edgeSet, i, j) {
  const A = vertices[i];
  const B = vertices[j];
  // every figure point strictly inside segment AB, ordered along it
  const on = vertices
    .map((p, k) => ({ p, k }))
    .filter(({ p }) => between(A, B, p))
    .sort((u, v) => dot(sub(u.p, A), sub(B, A)) - dot(sub(v.p, A), sub(B, A)));
  const chain = [i, ...on.map(({ k }) => k), j];
  for (let s = 0; s < chain.length - 1; s++) {
    const a = Math.min(chain[s], chain[s + 1]);
    const b = Math.max(chain[s], chain[s + 1]);
    if (!edgeSet.has(`${a}-${b}`)) return false;
  }
  return true;
}

const edgeSetOf = (edges) =>
  new Set(edges.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));

// All triangles: non-collinear triples with three straight-connected sides.
export function findTriangles(vertices, edges) {
  const es = edgeSetOf(edges);
  const out = [];
  const n = vertices.length;
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++) {
        if (collinear3(vertices[a], vertices[b], vertices[c])) continue;
        if (
          straightConnected(vertices, es, a, b) &&
          straightConnected(vertices, es, b, c) &&
          straightConnected(vertices, es, a, c)
        )
          out.push([a, b, c]);
      }
  return out;
}

// All rectangles (squares included): 4-point sets with right angles and four
// straight-connected sides. Returned in perimeter order.
export function findRectangles(vertices, edges, squaresOnly = false) {
  const es = edgeSetOf(edges);
  const out = [];
  const n = vertices.length;
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++)
        for (let d = c + 1; d < n; d++) {
          const idx = [a, b, c, d];
          // try the three distinct perimeter orderings of 4 points
          for (const ord of [
            [a, b, c, d],
            [a, b, d, c],
            [a, c, b, d],
          ]) {
            const P = ord.map((i) => vertices[i]);
            const v01 = sub(P[1], P[0]);
            const v12 = sub(P[2], P[1]);
            const v23 = sub(P[3], P[2]);
            const v30 = sub(P[0], P[3]);
            const isRect =
              dot(v01, v12) === 0 &&
              dot(v12, v23) === 0 &&
              dot(v23, v30) === 0 &&
              v01[0] === -v23[0] && v01[1] === -v23[1]; // opposite sides equal
            if (!isRect) continue;
            if (squaresOnly && dot(v01, v01) !== dot(v12, v12)) continue;
            const sides = [
              [ord[0], ord[1]],
              [ord[1], ord[2]],
              [ord[2], ord[3]],
              [ord[3], ord[0]],
            ];
            if (sides.every(([i, j]) => straightConnected(vertices, es, i, j))) {
              out.push(ord);
              break; // one ordering per point-set
            }
          }
          void idx;
        }
  return out;
}

export function findShapes(vertices, edges, find) {
  if (find === 'triangles') return findTriangles(vertices, edges);
  if (find === 'squares') return findRectangles(vertices, edges, true);
  return findRectangles(vertices, edges, false); // 'rectangles' (squares count too)
}
