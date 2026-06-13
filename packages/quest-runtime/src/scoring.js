// Quest progression rules — the generic "how a quest is sized, scored, and
// adapts" logic, independent of subject. Pure functions so any quest app shares
// the exact same progression (and they're trivially testable).

// A station's first quest is shorter (an intro), then longer once it's started.
export const questTotal = (stars) => (stars >= 1 ? 8 : 5);

// Stars earned at quest end from first-try accuracy. A full-length quest (>=8)
// can earn all 3; a short intro quest tops out at 2 so true mastery still
// requires a full run.
export function starsEarned(perfectCount, total) {
  const acc = total > 0 ? perfectCount / total : 0;
  if (total >= 8 && acc === 1) return 3;
  if (total >= 8 && acc >= 0.8) return 2;
  if (acc === 1) return 2; // a perfect intro quest deserves two
  if (acc >= 0.6) return 1;
  return 0;
}

// Adaptive difficulty (GDD §6): two first-try wins in a row bump the band up
// (capped at `cap`); two first-try misses in a row drop it (floored at `floor`).
// Pass the results array INCLUDING the latest first-try outcome.
export function adaptBand(band, results, floor = 0, cap = 2) {
  const n = results.length;
  if (n >= 2 && results[n - 1] && results[n - 2]) return Math.min(band + 1, cap);
  if (n >= 2 && !results[n - 1] && !results[n - 2]) return Math.max(band - 1, floor);
  return band;
}
