// Logic Quest music: which track each chapter plays. The engine itself (looping, ducking
// under Luna's voice, autoplay reconcile) is the shared @discoveryquest/voice-kit/music —
// this file just maps Space worlds → tracks and re-exports the engine so callers import from
// one place. Mirrors math/src/music.js. Tracks are optional files in public/music/<name>.mp3;
// a missing track is simply silent.
export { playMusic, pauseMusic, resumeMusic, stopMusic, setMusicEnabled, isMusicOn } from '@discoveryquest/voice-kit/music';

// The map / hub theme (plays on the TrailMap).
export const MAP_TRACK = 'logic-map';

// Per-chapter quest themes.
const TRACK_BY_WORLD = {
  'matchstick-meadow': 'logic-meadow',
};

export const trackForWorld = (worldId) => TRACK_BY_WORLD[worldId] || MAP_TRACK;
