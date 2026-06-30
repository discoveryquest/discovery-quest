import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { loadCourse } from '@discoveryquest/course-loader';
import { genPractice, genQuiz, BOARD_GENERATORS } from './boardGenerators.js';

// Load + bind the real course.yml exactly as course.js does — but with a board-less
// registry (the loader only needs generate+content to bind; the .jsx board is a browser
// concern). This verifies the whole DATA → RUNTIME path: parse, band-slice, generate steps.
const doc = yaml.load(readFileSync(new URL('../space.course.yml', import.meta.url), 'utf8'));
const registry = {
  quiz: { ...BOARD_GENERATORS.quiz, board: null },
  practice: { ...BOARD_GENERATORS.practice, board: null },
};
const course = loadCourse(doc, registry);

test('loads 4 worlds and 20 playable stations (5 per world)', () => {
  assert.equal(course.worlds.length, 4);
  assert.equal([...course.stationsById.keys()].length, 20);
  for (const w of course.worlds) assert.equal(w.stations.length, 5, `${w.id} has 5 stations`);
});

// CourseQuest reads problem.steps[0] + problem.word — generate() must return that shape,
// NOT a bare step. (Returning a bare step is what caused the black screen on Play.)
test('every station generates valid board steps', () => {
  for (const [id, st] of course.stationsById) {
    for (let i = 0; i < 8; i++) {
      const problem = st.generate();
      assert.ok(Array.isArray(problem.steps) && problem.steps.length >= 1, `${id}: problem.steps exists`);
      const s = problem.steps[0];
      if (st.board === 'quiz') {
        assert.equal(s.kind, 'quiz');
        assert.equal(problem.steps.length, 1, `${id}: quiz returns one problem`);
        assert.ok(s.choices.length >= 2, `${id}: ≥2 choices`);
        assert.ok(s.choices.includes(s.expected), `${id}: choices include the answer`);
        assert.equal(problem.word, s.expected, `${id}: reveal word is the answer`);
      } else if (st.board === 'practice') {
        assert.ok(s.kind && s.say && s.prompt && s.target, `${id}: practice step has mechanic, narration, prompt, target`);
      } else {
        assert.fail(`${id}: unexpected board ${st.board}`);
      }
    }
  }
});

test('band slicing routes the right questions to each station', () => {
  const promptOf = (id) => course.stationsById.get(id).generate().steps[0].prompt;
  assert.equal(promptOf('moon-phases'), 'Move the Moon to make a Full Moon.', 'moon-phases draws its band-0 ordered practice mission');
  assert.equal(promptOf('mars-base'), 'Sort what a Mars base must make or bring.', 'mars-base draws its band-19 ordered practice mission');
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

test('genPractice returns authored items as an ordered mission sequence', () => {
  const { steps } = genPractice([
    { kind: 'moon-position', say: 'a', prompt: 'A', target: { phase: 'full' }, band: 0 },
    { kind: 'moon-position', say: 'b', prompt: 'B', target: { phase: 'first-quarter' }, band: 0 },
  ]);
  assert.deepEqual(steps.map((s) => s.say), ['a', 'b']);
  assert.equal(steps[0].target.phase, 'full');
});
