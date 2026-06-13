// Math-quest's music content: which track each world plays. The engine itself
// (loops, ducking under the voice, autoplay reconcile) lives in the shared
// @discoveryquest/voice-kit/music — this file just maps math worlds → moods and re-exports
// the engine so callers keep importing from one place.

export { playMusic, pauseMusic, resumeMusic, stopMusic, setMusicEnabled, isMusicOn } from '@discoveryquest/voice-kit/music';

const MOOD_BY_WORLD = {
  'number-meadow': 'mood-sunny', 'place-value-peaks': 'mood-sunny', 'fraction-forest': 'mood-sunny',
  'carry-canyon': 'mood-adventure', 'times-table-trail': 'mood-adventure', 'multiplication-mountain': 'mood-adventure',
  'decimal-docks': 'mood-mystic', 'measure-marsh': 'mood-mystic', 'geometry-galaxy': 'mood-mystic',
  'word-problem-wilds': 'mood-finale',
};
export const trackForWorld = (worldId) => MOOD_BY_WORLD[worldId] || 'mood-sunny';
