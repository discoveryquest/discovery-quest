// Shared world positions for the fixed landmarks, so the 3D props and the DOM
// FactCard (which measures the player's distance) agree on where things are.
// Player + rocks spawn around the origin (see RockField SPAWNS); landmarks sit
// out from there. Toward −z is in front of the default third-person camera.
export const ROVER_POS = [11, 0, -7];
export const LANDER_POS = [-6.5, 0, -3.5];

// How close (metres) the player must get before the rover fact card appears, and
// how far they must walk back before it re-arms.
export const FACT_NEAR = 7;
export const FACT_FAR = 12;
