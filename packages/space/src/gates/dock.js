// Cosmic Gate: "Docking Maneuver" (spec §3, Sector 4). The child aligns the ship
// with a docking port — minimize horizontal/vertical offset and roll. Pure scoring
// — no three/React. (0,0,0) is a perfect alignment; bigger = worse.

export function scoreDock({ x = 0, y = 0, roll = 0 } = {}) {
  const dist = Math.hypot(x, y);
  const r = Math.abs(roll);
  let stars;
  if (dist <= 8 && r <= 6) stars = 3;        // crisp dock
  else if (dist <= 20 && r <= 15) stars = 2; // solid
  else if (dist <= 40 && r <= 30) stars = 1; // bumpy but docked
  else stars = 0;                            // missed
  return { dist, roll: r, stars };
}
