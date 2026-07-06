// Live player telemetry — written each frame by Player (no React re-render), read
// by the DOM Hud via its own rAF poll. Confirms movement numerically and gives
// the ground a "you are here" readout when the terrain is featureless.
export const telemetry = { x: 0, y: 0, z: 0, speed: 0, grounded: false };
