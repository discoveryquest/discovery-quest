// Deterministic, seeded, bounded gust profile — pure so it's unit-testable and
// reproducible. WindProvider samples gustAt(seed, clock) each frame and drives
// dust, pennant sway, ambient-audio gain, and the HUD wind gauge.
const frac = (x) => x - Math.floor(x);

/** Gust intensity in [0,1] for a seed and time (seconds). */
export function gustAt(seed, t) {
  const p1 = frac(Math.sin(seed * 12.9898) * 43758.5453) * Math.PI * 2;
  const p2 = frac(Math.sin(seed * 78.233) * 12345.6789) * Math.PI * 2;
  const v = 0.5 * Math.sin(t * 0.6 + p1) + 0.3 * Math.sin(t * 1.7 + p2) + 0.2 * Math.sin(t * 0.23);
  return (v + 1) / 2; // -> [0,1]
}
