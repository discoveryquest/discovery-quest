import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { loadCourse } from '@discoveryquest/course-loader';
import { genQuiz, BOARD_GENERATORS } from './boardGenerators.js';

// Load + bind the real course.yml exactly as course.js does — but with a board-less
// registry (the loader only needs generate+content to bind; the .jsx board is a browser
// concern). This verifies the whole DATA → RUNTIME path: parse, band-slice, generate steps.
const doc = yaml.load(readFileSync(new URL('../space.course.yml', import.meta.url), 'utf8'));
const registry = { quiz: { ...BOARD_GENERATORS.quiz, board: null } };
const course = loadCourse(doc, registry);

test('loads 4 worlds and 20 playable stations (5 per world)', () => {
  assert.equal(course.worlds.length, 4);
  assert.equal([...course.stationsById.keys()].length, 20);
  for (const w of course.worlds) assert.equal(w.stations.length, 5, `${w.id} has 5 stations`);
});

// CourseQuest reads problem.steps[0] + problem.word — generate() must return that shape,
// NOT a bare step. (Returning a bare step is what caused the black screen on Play.)
test('every station generates a one-step problem (steps[0] valid, answer among choices)', () => {
  for (const [id, st] of course.stationsById) {
    for (let i = 0; i < 8; i++) {
      const problem = st.generate();
      assert.ok(Array.isArray(problem.steps) && problem.steps.length === 1, `${id}: problem.steps[0] exists`);
      const s = problem.steps[0];
      assert.equal(s.kind, 'quiz');
      assert.ok(s.choices.length >= 2, `${id}: ≥2 choices`);
      assert.ok(s.choices.includes(s.expected), `${id}: choices include the answer`);
      assert.equal(problem.word, s.expected, `${id}: reveal word is the answer`);
    }
  }
});

test('band slicing routes the right questions to each station', () => {
  const promptOf = (id) => course.stationsById.get(id).generate().steps[0].prompt;
  const moonQs = new Set(['What gives the Moon its light?', 'Why does the Moon look different on different nights?']);
  for (let i = 0; i < 12; i++) assert.ok(moonQs.has(promptOf('moon-phases')), 'moon-phases draws only its band-0 questions');
  const marsQs = new Set(['What is Mars like?', 'What will Mars explorers need to make or bring?']);
  for (let i = 0; i < 12; i++) assert.ok(marsQs.has(promptOf('mars-base')), 'mars-base draws only its band-11 questions');
});

test('every station resolves to a lesson the course knows', () => {
  for (const [id, st] of course.stationsById) {
    assert.ok(course.lessonsById[st.lessonId], `${id}: lesson "${st.lessonId}" exists`);
  }
});

test('genQuiz is pure: keeps the answer, shuffles only the given choices', () => {
  const { steps } = genQuiz([{ question: 'q', answer: 'a', distractors: ['b', 'c'], band: 0 }], {}, () => 0);
  assert.equal(steps[0].expected, 'a');
  assert.deepEqual([...steps[0].choices].sort(), ['a', 'b', 'c']);
});
