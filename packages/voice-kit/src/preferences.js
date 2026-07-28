import { courseIdForSaveKey } from '@discoveryquest/engine/courses';
import {
  loadResolvedPreferences,
  updatePreferences,
} from '@discoveryquest/engine/preferences';
import { getSaveKey } from '@discoveryquest/engine/save';

export const PREFERENCES_CHANGED_EVENT = 'dq:preferences-changed';

let configuredCourseId = null;
let configuredDefaults = {};

export function configureAudioPreferences({ courseId, defaults = {} } = {}) {
  configuredCourseId = courseId || configuredCourseId;
  configuredDefaults = { ...defaults };
  return getAudioPreferences();
}

function currentCourseId() {
  return configuredCourseId || courseIdForSaveKey(getSaveKey()) || 'math';
}

export function getAudioPreferences() {
  const courseId = currentCourseId();
  return {
    courseId,
    ...loadResolvedPreferences({
      courseId,
      courseDefaults: configuredDefaults,
    }),
  };
}

function notify(result) {
  if (
    typeof window !== 'undefined'
    && typeof window.dispatchEvent === 'function'
    && typeof CustomEvent === 'function'
  ) {
    window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED_EVENT, {
      detail: { courseId: result.courseId, preferences: result },
    }));
  }
  return result;
}

export function setGlobalAudioPreferences(globalPatch) {
  const courseId = currentCourseId();
  return notify({
    courseId,
    ...updatePreferences({
      courseId,
      globalPatch,
      courseDefaults: configuredDefaults,
    }),
  });
}

export function setCourseAudioPreferences(coursePatch) {
  const courseId = currentCourseId();
  return notify({
    courseId,
    ...updatePreferences({
      courseId,
      coursePatch,
      courseDefaults: configuredDefaults,
    }),
  });
}
