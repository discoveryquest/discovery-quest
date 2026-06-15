import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genFirstReaders, comprehension } from '../src/reading.js';

const stories = [
  { story: 'The cat is on the mat.', q: 'cat', d: ['mat', 'hat', 'map'] },
  { story: 'The dog can run.', q: 'dog', d: ['pig', 'bug', 'hen'] },
];

test('genFirstReaders draws from injected items, kind=storyReader, 4 choices', () => {
  for (let i = 0; i < 30; i++) {
    const p = genFirstReaders(stories, { band: 0 });
    assert.equal(p.kind, 'storyReader');
    assert.ok(stories.some((it) => it.q === p.word));
    const step = p.steps[0];
    assert.equal(step.choices.length, 4);
    assert.ok(step.choices.includes(p.word));
    assert.equal(step.expected, p.word);
    // distractors come from the chosen item
    const item = stories.find((it) => it.q === p.word);
    for (const c of step.choices) assert.ok(c === item.q || item.d.includes(c));
    // narrated word by word; audioPrompt is the target word clip
    assert.equal(step.audioPrompt, `word-${p.word}`);
    assert.ok(Array.isArray(step.words) && step.words.length > 0);
  }
});

const mainIdeaItems = [
  { story: 'The cat sat on the mat. The cat can nap.', q: 'rq-main', text: 'What is the story about?', a: 'cat', d: ['dog', 'sun', 'bus'] },
  { story: 'We can see the sun. The sun is hot.', q: 'rq-main', text: 'What is the story about?', a: 'sun', d: ['web', 'hen', 'jet'] },
];

test('comprehension(label,color) returns a content-injected (items, ctx) generator', () => {
  const gen = comprehension('Main Idea', '#F9A8D4');
  assert.equal(typeof gen, 'function');
  for (let i = 0; i < 30; i++) {
    const p = gen(mainIdeaItems, { band: 0 });
    assert.equal(p.kind, 'storyReader');
    assert.ok(mainIdeaItems.some((it) => it.a === p.word));
    const step = p.steps[0];
    assert.equal(step.choices.length, 4);
    assert.ok(step.choices.includes(p.word));
    assert.equal(step.expected, p.word);
    assert.equal(step.chip.label, 'Main Idea');
    assert.equal(step.chip.color, '#F9A8D4');
    // the spoken question is the rq-* clip key; displayed prompt is the text
    const item = mainIdeaItems.find((it) => it.a === p.word);
    assert.equal(step.audioPrompt, item.q);
    assert.equal(step.prompt, item.text);
    assert.deepEqual(step.sayQ, [item.q]);
    assert.deepEqual(step.sayA, [`word-${item.a}`]);
  }
});

const inferenceItems = [
  { story: 'The dog can run and jump.', q: 'rq-feel-dog', text: 'How does the dog feel?', a: 'happy', d: ['sad', 'mad'] },
];

test('comprehension supports 3-choice inference items (answer + 2 distractors)', () => {
  const gen = comprehension('Inference', '#E879F9');
  const p = gen(inferenceItems, { band: 0 });
  assert.equal(p.kind, 'storyReader');
  assert.equal(p.word, 'happy');
  assert.equal(p.steps[0].choices.length, 3);
  assert.ok(p.steps[0].choices.includes('happy'));
});
