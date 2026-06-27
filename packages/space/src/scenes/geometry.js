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
