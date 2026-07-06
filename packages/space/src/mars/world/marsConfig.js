// The Mars WorldConfig instance. Everything world-specific lives here so a Moon
// world is a later config (moonConfig.js), not a rewrite. Validated by
// validateWorldConfig (see worldConfig.test.mjs / marsConfig.test.mjs). Asset
// paths are same-origin under /mars/… (files vendored into the deploy app's
// public/mars/ in Task 6).
export const marsConfig = {
  id: 'mars', name: 'Mars',
  gravity: 3.72, earthGravity: 9.81, // 0.38 g
  temperatureC: -60,
  // Real Mars daytime sky is a pale, hazy butterscotch/tan (not deep orange):
  // desaturated zenith brightening toward a dusty horizon.
  sky: { top: '#b79b74', horizon: '#e7cfa6', sunColor: '#fff4e6' },
  wind: { seed: 42, baseSpeed: 3, gustSpeed: 12 },
  assets: {
    panorama: '/mars/panorama.jpg',
    ground: '/mars/regolith.jpg',
    rover: '/mars/perseverance.glb',
    lander: '/mars/lander.glb',
  },
  ambientTrack: 'mars-wind',
};
