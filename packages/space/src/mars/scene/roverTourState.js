// Shared channel between the Rover (which owns the exploded model + knows where
// each floating part sits) and the Player (which owns the camera). Written each
// frame by Rover during a tour, read by Player's tour-camera branch — same
// no-React-churn pattern as telemetry.js. `center` is the orbit pivot (the rover
// body, lifted); `focus` is what the camera frames (the center, or the selected
// part nudged into view); `factor` is the 0→1 explode progress for other effects.
export const roverTour = {
  centerX: 0,
  centerY: 1.4,
  centerZ: -7,
  focusX: 0,
  focusY: 1.4,
  focusZ: -7,
  factor: 0,
};
