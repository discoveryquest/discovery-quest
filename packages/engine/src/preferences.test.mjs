import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGISTRY_KEY } from './profiles.js';
import {
  normalizePreferences,
  resolvePreferences,
  loadResolvedPreferences,
  updatePreferences,
} from './preferences.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('normalizes invalid preference values without leaking course metadata', () => {
  assert.deepEqual(normalizePreferences({
    global: { muted: true, masterVolume: 4 },
    courses: {
      math: {
        soundEnabled: false,
        narrationVolume: -2,
        playbackRate: 3,
        musicAvailable: false,
      },
    },
  }), {
    version: 1,
    global: {
      muted: true,
      masterVolume: 1,
      reducedMotion: false,
      captions: false,
    },
    courses: {
      math: {
        soundEnabled: false,
        musicEnabled: true,
        narrationVolume: 0,
        sfxVolume: 1,
        musicVolume: 1,
        playbackRate: 2,
        voice: null,
        locale: null,
      },
    },
  });
});

test('global mute overrides playback without overwriting the course choice', () => {
  const resolved = resolvePreferences({
    courseId: 'logic',
    preferences: {
      global: { muted: true },
      courses: { logic: { soundEnabled: true, musicEnabled: true } },
    },
  });
  assert.equal(resolved.course.soundEnabled, true);
  assert.equal(resolved.course.musicEnabled, true);
  assert.equal(resolved.effective.soundEnabled, false);
  assert.equal(resolved.effective.musicEnabled, false);
  assert.equal(resolved.effective.musicVolume, 0);
});

test('stored course preferences override legacy save values and retain course defaults', () => {
  const resolved = resolvePreferences({
    courseId: 'english',
    courseDefaults: { musicAvailable: false, locale: 'en-US' },
    legacySettings: { sound: false, music: true },
    preferences: {
      courses: { english: { soundEnabled: true, musicEnabled: false } },
    },
  });
  assert.equal(resolved.course.soundEnabled, true);
  assert.equal(resolved.course.musicEnabled, false);
  assert.equal(resolved.course.musicAvailable, false);
  assert.equal(resolved.course.locale, 'en-US');
});

test('updates active profile preferences and mirrors legacy course settings', () => {
  const storage = memoryStorage({
    [REGISTRY_KEY]: JSON.stringify({
      version: 1,
      profiles: [{
        id: 'hero-1',
        name: 'Nova',
        preferences: {
          global: { captions: true },
          courses: { space: { musicVolume: 0.4 } },
        },
      }],
      lastUsedByCourse: { math: 'hero-1' },
    }),
    'lmq-save': JSON.stringify({
      version: 5,
      profile: { id: 'hero-1' },
      settings: { sound: false, music: true, hints: false },
    }),
  });

  const result = updatePreferences({
    storage,
    courseId: 'math',
    globalPatch: { muted: true },
    coursePatch: { soundEnabled: true, musicEnabled: false },
  });

  assert.equal(result.global.muted, true);
  assert.equal(result.course.soundEnabled, true);
  assert.equal(result.course.musicEnabled, false);
  const registry = JSON.parse(storage.getItem(REGISTRY_KEY));
  assert.equal(registry.profiles[0].preferences.global.captions, true);
  assert.equal(registry.profiles[0].preferences.courses.space.musicVolume, 0.4);
  assert.equal(registry.profiles[0].preferences.courses.math.soundEnabled, true);
  const save = JSON.parse(storage.getItem('lmq-save'));
  assert.deepEqual(save.settings, { sound: true, music: false, hints: false });
});

test('loads legacy settings when the active profile has no preferences yet', () => {
  const storage = memoryStorage({
    [REGISTRY_KEY]: JSON.stringify({
      version: 1,
      profiles: [{ id: 'hero-1', name: 'Nova' }],
      lastUsedByCourse: { logic: 'hero-1' },
    }),
    'lq-save': JSON.stringify({
      version: 5,
      profile: { id: 'hero-1' },
      settings: { sound: false, music: false },
    }),
  });
  const result = loadResolvedPreferences({ storage, courseId: 'logic' });
  assert.equal(result.course.soundEnabled, false);
  assert.equal(result.course.musicEnabled, false);
});
