// Cosmic Gate: "Event Horizon" (spec §3, Sector 3 — Black Holes). Pick an approach
// that skims the black hole close enough to get a gravity slingshot, but not so
// close you cross the event horizon. Pure scoring — no three/React.
//
// `value` is how close you skim, 0 (far) … 100 (right at the horizon). The sweet
// spot is near IDEAL: too far = no boost (drift), too close = pulled in.

export const IDEAL = 62;

export function scoreSlingshot(value, ideal = IDEAL) {
  const error = Math.abs(value - ideal);
  const stars = error <= 6 ? 3 : error <= 15 ? 2 : error <= 28 ? 1 : 0;
  const outcome = value > ideal + 28 ? 'pulled-in' : value < ideal - 28 ? 'drifted' : 'slingshot';
  return { error, stars, outcome };
}
