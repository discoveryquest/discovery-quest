import { courseSource } from './courses.js';
import { loadRegistry, persistRegistry } from './profiles.js';

export const PREFERENCES_VERSION = 1;
export const DEFAULT_GLOBAL_PREFERENCES = Object.freeze({
  muted: false,
  masterVolume: 1,
  reducedMotion: false,
  captions: false,
});
export const DEFAULT_COURSE_AUDIO_PREFERENCES = Object.freeze({
  soundEnabled: true,
  musicEnabled: true,
  narrationVolume: 1,
  sfxVolume: 1,
  musicVolume: 1,
  playbackRate: 1,
  voice: null,
  locale: null,
});

const clamp = (value, fallback, min = 0, max = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};
const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

function normalizeCourseOverrides(course = {}) {
  const normalized = {};
  if (typeof course.soundEnabled === 'boolean') normalized.soundEnabled = course.soundEnabled;
  if (typeof course.musicEnabled === 'boolean') normalized.musicEnabled = course.musicEnabled;
  if ('narrationVolume' in course) normalized.narrationVolume = clamp(course.narrationVolume, 1);
  if ('sfxVolume' in course) normalized.sfxVolume = clamp(course.sfxVolume, 1);
  if ('musicVolume' in course) normalized.musicVolume = clamp(course.musicVolume, 1);
  if ('playbackRate' in course) normalized.playbackRate = clamp(course.playbackRate, 1, 0.5, 2);
  if ('voice' in course) normalized.voice = typeof course.voice === 'string' ? course.voice : null;
  if ('locale' in course) normalized.locale = typeof course.locale === 'string' ? course.locale : null;
  return normalized;
}

export function normalizePreferences(preferences = {}) {
  const global = preferences.global || {};
  const courses = {};
  for (const [courseId, course = {}] of Object.entries(preferences.courses || {})) {
    courses[courseId] = {
      ...DEFAULT_COURSE_AUDIO_PREFERENCES,
      ...normalizeCourseOverrides(course),
    };
  }
  return {
    version: PREFERENCES_VERSION,
    global: {
      muted: bool(global.muted, DEFAULT_GLOBAL_PREFERENCES.muted),
      masterVolume: clamp(global.masterVolume, DEFAULT_GLOBAL_PREFERENCES.masterVolume),
      reducedMotion: bool(global.reducedMotion, DEFAULT_GLOBAL_PREFERENCES.reducedMotion),
      captions: bool(global.captions, DEFAULT_GLOBAL_PREFERENCES.captions),
    },
    courses,
  };
}

export function resolvePreferences({
  preferences,
  courseId,
  courseDefaults = {},
  legacySettings = {},
} = {}) {
  const normalized = normalizePreferences(preferences);
  const stored = normalizeCourseOverrides(preferences?.courses?.[courseId]);
  const course = {
    ...DEFAULT_COURSE_AUDIO_PREFERENCES,
    ...courseDefaults,
    ...(typeof legacySettings.sound === 'boolean' ? { soundEnabled: legacySettings.sound } : {}),
    ...(typeof legacySettings.music === 'boolean' ? { musicEnabled: legacySettings.music } : {}),
    ...stored,
  };
  course.soundEnabled = bool(course.soundEnabled, true);
  course.musicEnabled = bool(course.musicEnabled, true);
  course.narrationVolume = clamp(course.narrationVolume, 1);
  course.sfxVolume = clamp(course.sfxVolume, 1);
  course.musicVolume = clamp(course.musicVolume, 1);
  course.playbackRate = clamp(course.playbackRate, 1, 0.5, 2);
  const audible = !normalized.global.muted && normalized.global.masterVolume > 0;
  return {
    preferences: normalized,
    global: normalized.global,
    course,
    effective: {
      soundEnabled: audible && course.soundEnabled,
      musicEnabled: audible && course.musicEnabled,
      narrationVolume: audible && course.soundEnabled
        ? normalized.global.masterVolume * course.narrationVolume
        : 0,
      sfxVolume: audible && course.soundEnabled
        ? normalized.global.masterVolume * course.sfxVolume
        : 0,
      musicVolume: audible && course.musicEnabled
        ? normalized.global.masterVolume * course.musicVolume
        : 0,
      playbackRate: course.playbackRate,
      reducedMotion: normalized.global.reducedMotion,
      captions: normalized.global.captions,
      voice: course.voice,
      locale: course.locale,
    },
  };
}

function readSave(storage, saveKey) {
  try {
    return JSON.parse(storage.getItem(saveKey)) || {};
  } catch {
    return {};
  }
}

function writeSave(storage, saveKey, save) {
  try {
    save.updatedAt = Date.now();
    storage.setItem(saveKey, JSON.stringify(save));
  } catch {
    // Preferences still remain in the registry when course-save persistence fails.
  }
}

export function loadResolvedPreferences({
  courseId,
  courseDefaults,
  storage = globalThis.localStorage,
} = {}) {
  const source = courseSource(courseId);
  const save = source ? readSave(storage, source.key) : {};
  const registry = loadRegistry(storage);
  const profileId = registry.lastUsedByCourse?.[courseId] || save.profile?.id || null;
  const profile = registry.profiles?.find((entry) => entry.id === profileId) || null;
  return {
    profileId,
    ...resolvePreferences({
      preferences: profile?.preferences,
      courseId,
      courseDefaults,
      legacySettings: save.settings,
    }),
  };
}

export function updatePreferences({
  courseId,
  globalPatch,
  coursePatch,
  courseDefaults,
  storage = globalThis.localStorage,
} = {}) {
  const source = courseSource(courseId);
  const save = source ? readSave(storage, source.key) : {};
  const registry = loadRegistry(storage);
  const profileId = registry.lastUsedByCourse?.[courseId] || save.profile?.id || null;
  const profile = registry.profiles?.find((entry) => entry.id === profileId) || null;
  const current = resolvePreferences({
    preferences: profile?.preferences,
    courseId,
    courseDefaults,
    legacySettings: save.settings,
  });
  const preferences = normalizePreferences({
    ...current.preferences,
    global: { ...current.global, ...(globalPatch || {}) },
    courses: {
      ...current.preferences.courses,
      [courseId]: { ...current.course, ...(coursePatch || {}) },
    },
  });

  if (profile) {
    profile.preferences = preferences;
    profile.updatedAt = Math.max(Date.now(), (profile.updatedAt || 0) + 1);
    persistRegistry(registry, storage);
  }
  if (source) {
    const course = preferences.courses[courseId];
    save.settings = {
      ...(save.settings || {}),
      sound: course.soundEnabled,
      music: course.musicEnabled,
    };
    writeSave(storage, source.key, save);
  }
  return loadResolvedPreferences({ courseId, courseDefaults, storage });
}
