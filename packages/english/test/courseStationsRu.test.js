import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { loadCourse } from '@discoveryquest/course-loader';
import { BOARD_GENERATORS } from '../src/boardGenerators.js';

// Build a JSX-free registry from BOARD_GENERATORS (board component not needed to call generate()).
const registry = Object.fromEntries(
  Object.entries(BOARD_GENERATORS).map(([k, v]) => [k, { ...v, board: null }]),
);
const ymlPath = resolve(new URL('.', import.meta.url).pathname, '../../..', 'docs/specs/course-format/english-ru.course.yml');
const doc = yaml.load(readFileSync(ymlPath, 'utf8'));
const course = loadCourse(doc, registry);

test('every EFL (english-ru) station generates a valid problem', () => {
  for (const w of course.worlds) {
    for (const st of w.stations) {
      if (st.soon) continue;
      // run a few times — generators are random; catch shape errors deterministically
      for (let i = 0; i < 5; i++) {
        const p = st.generate();
        assert.ok(p && Array.isArray(p.steps) && p.steps.length > 0,
          `station ${st.id} (board ${st.board}) produced no steps`);
        // sentenceRu uses inputKind:'build' (no choices); other boards use choices
        assert.ok(p.steps[0].inputKind || p.steps[0].choices?.length >= 2,
          `station ${st.id} (board ${st.board}) produced no choices and no inputKind`);
      }
    }
  }
});
