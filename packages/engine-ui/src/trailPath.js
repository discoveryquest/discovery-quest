// Pure geometry for the climbable trail (no React/DOM) — unit-testable.
export const ROW = 116;                              // vertical px per station
export const zigzag = (k) => (k % 2 === 0 ? 34 : 66); // x% fallback when a world has no art
export const yOf = (k, n) => (n - 1 - k) * ROW + ROW / 2; // bottom-up: index 0 nearest bottom

// Smooth vertical S-curve through the points (each [x, y]); x in %, y in px.
export function trailPathD(pts) {
  return pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [, py] = pts[i - 1];
      const my = (py + y) / 2;
      return `C ${pts[i - 1][0]} ${my}, ${x} ${my}, ${x} ${y}`;
    })
    .join(' ');
}
