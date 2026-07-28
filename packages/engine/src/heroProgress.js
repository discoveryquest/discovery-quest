import { courseSource } from './courses.js';
import { loadRegistry } from './profiles.js';
import { computeXp, heroProgress, totalXp } from './xp.js';

function loadCourseSave(storage, courseId) {
  const source = courseSource(courseId);
  if (!source) return null;
  try {
    return JSON.parse(storage.getItem(source.key));
  } catch {
    return null;
  }
}

// One account/local fallback contract for every course header and progress sheet.
// The current course's local XP is folded into the signed-in ledger immediately,
// so UI never regresses while a cloud sync is still completing.
export function buildHeroProgress({
  courseId,
  isSignedIn = false,
  storage = globalThis.localStorage,
} = {}) {
  const save = loadCourseSave(storage, courseId);
  const localXp = computeXp(save);
  const registry = loadRegistry(storage);
  const profileId = registry.lastUsedByCourse?.[courseId] || save?.profile?.id || null;
  const profile = registry.profiles?.find((entry) => entry.id === profileId) || null;
  const isCrossCourse = Boolean(isSignedIn && profile);
  const xpByCourse = isCrossCourse ? { ...(profile.xpByCourse || {}) } : {};

  if (courseId) {
    xpByCourse[courseId] = Math.max(xpByCourse[courseId] || 0, localXp);
  }

  const xp = isCrossCourse ? totalXp(xpByCourse) : localXp;
  return {
    courseId,
    profileId,
    isCrossCourse,
    xpByCourse,
    badgesByCourse: isCrossCourse ? { ...(profile.badgesByCourse || {}) } : {},
    xp,
    ...heroProgress(xp),
  };
}
