// Live player telemetry — written each frame by Player (no React re-render), read
// by the DOM Hud via its own rAF poll. Confirms movement numerically and gives
// the ground a "you are here" readout when the terrain is featureless.
// `stepping` is a coyote-smoothed "walking on the ground" flag (moving + grounded
// within the last frame or two) — steadier than raw `grounded` for gait/footsteps,
// which otherwise flicker as gentle terrain slopes briefly lift the player.
// `facingX/Z` is Luna's actual body-facing vector in third-person, written by
// Player after the eased GTA-style heading update. Interaction uses it for
// body-space holding/throwing so a camera orbit does not change the throw aim.
export const telemetry = {
  x: 0,
  y: 0,
  z: 0,
  speed: 0,
  grounded: false,
  stepping: false,
  facingX: 0,
  facingZ: -1,
  roverX: 11,
  roverY: 0,
  roverZ: -7,
  roverHeading: 0,
};
