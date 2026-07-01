// Pure scene math shared by the 2D (and future 3D) renderers — no React, unit-tested.
const RAD = Math.PI / 180;

// Position of a body on a circular orbit. angleDeg 0 = +x (right); +y is down (SVG/CSS).
export function orbitPosition({ cx, cy, radius, angleDeg }) {
  return { x: cx + radius * Math.cos(angleDeg * RAD), y: cy + radius * Math.sin(angleDeg * RAD) };
}

// Horizontal shift (px) of a moon's shadow mask for a phase fraction 0..1 across a body of
// width `w`. 0 = shadow fully left, 0.5 = centered, 1 = right.
export function phaseMaskShift(fraction, w) {
  return (fraction - 0.5) * 2 * w;
}

// ── From-Earth moon phase geometry ────────────────────────────────────────────
// The orbital angle θ maps to the fraction of the Moon's disc lit as seen from
// Earth: θ=0 new (dark), θ=90 first quarter, θ=180 full, θ=270 last quarter.
// This is the phaseLock convention too (see gates/phaseLock.js), so the practice
// mechanic and the learn-it diagram render identical shapes for the same angle.

/** Fraction of the Moon's disc lit as seen from Earth: f = (1 − cos θ) / 2 */
export function litFraction(thetaDeg) {
  return (1 - Math.cos((thetaDeg * Math.PI) / 180)) / 2;
}

/**
 * SVG `d` string for the lit area of the from-Earth phase disc, or null when the
 * Moon is fully dark (new). The shape is driven purely by the lit fraction f and
 * the waxing/waning side, so gibbous-vs-crescent follows from f>0.5 vs f<0.5
 * automatically (mirrored per side):
 *   • Lit limb = outer semicircle on the lit side (right=waxing, left=waning).
 *   • Terminator = half-ellipse, x-radius = r·|1−2f| (= r·|cos θ|), pole to pole.
 *   • GIBBOUS (f>0.5): terminator bulges toward the DARK side → large lit area.
 *   • CRESCENT (f<0.5): terminator bulges toward the LIT limb → thin sliver.
 * Waxing: semicircle sweep=1, terminator sweep = gibbous?1:0.
 * Waning: mirror image — semicircle sweep=0, terminator sweep = gibbous?0:1.
 */
export function litPath(thetaDeg, r, cx, cy) {
  const f = litFraction(thetaDeg);
  if (f < 0.001) return null; // new moon — all dark
  if (f > 0.999) {
    // Full moon — two semicircular arcs form a complete disc
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }

  const t = ((thetaDeg % 360) + 360) % 360;
  const termR = r * Math.abs(1 - 2 * f); // = r·|cos θ|; 0 at the quarters
  const gibbous = f > 0.5;
  const top = cy - r;
  const bot = cy + r;

  if (t < 180) {
    // Waxing: lit on the RIGHT
    const tSweep = gibbous ? 1 : 0;
    return `M ${cx} ${top} A ${r} ${r} 0 0 1 ${cx} ${bot} A ${termR} ${r} 0 0 ${tSweep} ${cx} ${top} Z`;
  }
  // Waning: lit on the LEFT (mirror of waxing)
  const tSweep = gibbous ? 0 : 1;
  return `M ${cx} ${top} A ${r} ${r} 0 0 0 ${cx} ${bot} A ${termR} ${r} 0 0 ${tSweep} ${cx} ${top} Z`;
}
