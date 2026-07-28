// Canonical course identity catalog. Profile seeding, account sync, and app shells
// must use the same course ids and save keys so adding a quest cannot silently
// exclude it from the cross-course experience.
export const COURSE_SOURCES = Object.freeze([
  Object.freeze({ courseId: 'math', key: 'lmq-save' }),
  Object.freeze({ courseId: 'english', key: 'eq-save' }),
  Object.freeze({ courseId: 'english-ru', key: 'eru-save' }),
  Object.freeze({ courseId: 'logic', key: 'lq-save' }),
  Object.freeze({ courseId: 'space', key: 'sq-save' }),
]);

export function courseSource(courseId) {
  return COURSE_SOURCES.find((source) => source.courseId === courseId) || null;
}
