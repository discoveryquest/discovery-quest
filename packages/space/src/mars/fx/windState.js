import { marsConfig } from '../world/marsConfig.js';

// Live wind — written each frame by WindProvider, read by DustParticles and
// Pennant (inside the Canvas) and by the DOM Hud (rAF poll). A plain mutable
// object so none of those reads trigger a React re-render, exactly like
// telemetry.js. `gust` is the [0,1] profile value; `speed` swells between the
// config's baseSpeed and gustSpeed; `dir*` is a unit vector along the ground.
const d = Math.hypot(0.82, 0.57);
export const windState = {
  gust: 0,
  speed: marsConfig.wind.baseSpeed,
  dirX: 0.82 / d,
  dirZ: 0.57 / d,
};
