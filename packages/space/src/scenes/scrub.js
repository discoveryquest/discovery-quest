// Pure math for the interactive `scrub` scene (drag through N ordered states). No React.
export const clampIndex = (i, n) => Math.max(0, Math.min(n - 1, Math.round(i)));

// Map a 0..1 drag fraction to a state index (even buckets, endpoints inclusive).
export const indexFromFraction = (f, n) => clampIndex(Math.round(Math.max(0, Math.min(1, f)) * (n - 1)), n);

// Position (0..1) of a state index's handle.
export const fractionFromIndex = (i, n) => (n <= 1 ? 0 : clampIndex(i, n) / (n - 1));
