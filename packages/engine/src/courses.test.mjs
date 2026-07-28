import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_SOURCES, courseSource } from './courses.js';

test('catalog contains every shipped course with a unique id and save key', () => {
  assert.deepEqual(
    COURSE_SOURCES.map((source) => source.courseId),
    ['math', 'english', 'english-ru', 'logic', 'space'],
  );
  assert.equal(new Set(COURSE_SOURCES.map((source) => source.courseId)).size, COURSE_SOURCES.length);
  assert.equal(new Set(COURSE_SOURCES.map((source) => source.key)).size, COURSE_SOURCES.length);
});

test('courseSource resolves known courses and rejects unknown ones', () => {
  assert.deepEqual(courseSource('logic'), { courseId: 'logic', key: 'lq-save' });
  assert.equal(courseSource('geography'), null);
});
