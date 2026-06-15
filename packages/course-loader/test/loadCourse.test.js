import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCourse } from '../src/loadCourse.js';

// A fake registry: one board kind 'pic' drawing from the 'vocab' collection.
// Its generator just echoes what it was handed, so we can assert the binding.
const Board = () => null;
const registry = {
  pic: { content: 'vocab', board: Board, generate: (items, ctx) => ({ items, ctx }) },
};

const doc = {
  course: {
    id: 'demo', title: 'Demo', subject: 'English', companion: 'luna',
    lowercase: true,
    worlds: [{
      id: 'w1', title: 'World 1', emoji: '🐾', color: '#fff', blurb: 'b',
      stations: [
        { id: 's0', title: 'A', icon: '🖼️', sub: 'x', board: 'pic', bands: [0], lesson: 'L0' },
        { id: 's1', title: 'B', icon: '🖼️', sub: 'y', board: 'pic', bands: [1], lesson: 'L1' },
      ],
    }],
    lessons: { L0: { title: 'L0', sections: [] } },
    narration: { 'n-1': 'hi' },
    content: {
      vocab: [
        { word: 'cat', emoji: '🐱', band: 0 },
        { word: 'dog', emoji: '🐶', band: 0 },
        { word: 'apple', emoji: '🍎', band: 1 },
      ],
    },
  },
};

test('maps worlds/stations and exposes meta + lessons + narration', () => {
  const course = loadCourse(doc, registry);
  assert.equal(course.meta.id, 'demo');
  assert.equal(course.meta.lowercase, true);
  assert.equal(course.worlds.length, 1);
  assert.equal(course.worlds[0].stations.length, 2);
  assert.equal(course.narration['n-1'], 'hi');
  assert.equal(course.lessonsById.L0.title, 'L0');
  assert.equal(course.stationsById.get('s1').lessonId, 'L1');
});

test('binds Board component + a generate() that gets band-sliced items', () => {
  const course = loadCourse(doc, registry);
  const s0 = course.stationsById.get('s0');
  assert.equal(s0.Board, Board);
  const out = s0.generate();
  assert.deepEqual(out.items.map((v) => v.word), ['cat', 'dog']); // band 0 only
  assert.equal(out.ctx.band, 0);
  assert.equal(out.ctx.lowercase, true);
  assert.deepEqual(course.stationsById.get('s1').generate().items.map((v) => v.word), ['apple']);
});

test('untagged collections pass through whole; unknown board throws', () => {
  const flatDoc = structuredClone(doc);
  flatDoc.course.content.vocab = [{ word: 'x', emoji: '❓' }, { word: 'y', emoji: '❓' }];
  const course = loadCourse(flatDoc, registry);
  assert.equal(course.stationsById.get('s0').generate().items.length, 2);
  assert.throws(() => loadCourse({ course: { worlds: [{ id: 'w', stations: [{ id: 'z', board: 'nope' }] }] } }, registry), /no registry entry/);
});

test('difficulty hint uses max(bands), not bands[0]', () => {
  const reg = { b: { content: 'vocab', board: () => null, generate: (items, ctx) => ctx } };
  const doc = { course: { worlds: [{ id: 'w', stations: [{ id: 's', board: 'b', bands: [0, 1, 2] }] }],
    content: { vocab: [{ word: 'a', band: 0 }, { word: 'b', band: 2 }] } } };
  assert.equal(loadCourse(doc, reg).stationsById.get('s').generate().band, 2);
});
test('array content injects an object of sliced collections', () => {
  const reg = { b: { content: ['syn', 'ant'], board: () => null, generate: (items) => items } };
  const doc = { course: { worlds: [{ id: 'w', stations: [{ id: 's', board: 'b', bands: [0] }] }],
    content: { syn: [{ word: 'big', match: 'large' }], ant: [{ word: 'hot', match: 'cold' }] } } };
  const out = loadCourse(doc, reg).stationsById.get('s').generate();
  assert.deepEqual(Object.keys(out), ['syn', 'ant']);
  assert.equal(out.syn[0].match, 'large');
});
