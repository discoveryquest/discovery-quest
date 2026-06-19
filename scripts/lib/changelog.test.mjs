import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commitsToChangelog } from './changelog.mjs';

const REPO = 'https://github.com/discoveryquest/discovery-quest';

test('strips conventional-commit prefix and maps kind', () => {
  const out = commitsToChangelog([
    { sha: 'aaa1111', date: '2026-06-14', subject: 'feat(english course): Grammar Gym world' },
    { sha: 'bbb2222', date: '2026-06-10', subject: 'fix(english): typo in Story Harbor step 2' },
  ], { repoUrl: REPO });
  assert.deepEqual(out, [
    { date: '2026-06-14', kind: 'new', text: 'Grammar Gym world', sha: 'aaa1111', url: `${REPO}/commit/aaa1111` },
    { date: '2026-06-10', kind: 'fix', text: 'typo in Story Harbor step 2', sha: 'bbb2222', url: `${REPO}/commit/bbb2222` },
  ]);
});

test('drops excluded types (chore/docs/refactor/test/build/ci/style)', () => {
  const out = commitsToChangelog([
    { sha: 'c1', date: '2026-06-14', subject: 'chore: bump dep' },
    { sha: 'c2', date: '2026-06-14', subject: 'docs(authoring): note board' },
    { sha: 'c3', date: '2026-06-14', subject: 'refactor: rename' },
    { sha: 'c4', date: '2026-06-14', subject: 'feat: real change' },
  ], { repoUrl: REPO });
  assert.equal(out.length, 1);
  assert.equal(out[0].text, 'real change');
});

test('untyped subjects are kept as kind "update", text verbatim', () => {
  const out = commitsToChangelog([
    { sha: 'd1', date: '2026-06-14', subject: 'Initial open release — engine + courses' },
  ], { repoUrl: REPO });
  assert.equal(out[0].kind, 'update');
  assert.equal(out[0].text, 'Initial open release — engine + courses');
});

test('caps at the limit, newest order preserved (input already newest-first)', () => {
  const commits = Array.from({ length: 30 }, (_, i) => ({ sha: `s${i}`, date: '2026-06-14', subject: `feat: change ${i}` }));
  const out = commitsToChangelog(commits, { repoUrl: REPO, limit: 20 });
  assert.equal(out.length, 20);
  assert.equal(out[0].text, 'change 0');
});
