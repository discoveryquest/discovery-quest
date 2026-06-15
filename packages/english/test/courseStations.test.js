import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { loadCourse } from '@discoveryquest/course-loader';
import { BOARD_GENERATORS } from '../src/boardGenerators.js';

// Build a JSX-free registry from BOARD_GENERATORS (board component not needed to call generate()).
const registry = Object.fromEntries(
  Object.entries(BOARD_GENERATORS).map(([k, v]) => [k, { ...v, board: null }]),
);
const doc = yaml.load(readFileSync(new URL('../english.course.yml', import.meta.url), 'utf8'));
const course = loadCourse(doc, registry);

test('every playable station generates a valid problem from the YAML content', () => {
  for (const w of course.worlds) {
    for (const st of w.stations) {
      if (st.soon) continue;
      // run a few times — generators are random; catch shape errors deterministically
      for (let i = 0; i < 5; i++) {
        const p = st.generate();
        assert.ok(p && Array.isArray(p.steps) && p.steps.length > 0,
          `station ${st.id} (board ${st.board}) produced no steps`);
        assert.ok(p.steps[0].choices?.length >= 2 || p.steps[0].inputKind,
          `station ${st.id} (board ${st.board}) produced no choices`);
      }
    }
  }
});
