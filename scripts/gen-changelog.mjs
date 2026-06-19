// scripts/gen-changelog.mjs
// Reads git history of each course YAML and writes <id>.changelog.json beside it.
// Run: node scripts/gen-changelog.mjs   (from repo root, inside a git checkout)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commitsToChangelog } from './lib/changelog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const REPO_URL = 'https://github.com/discoveryquest/discovery-quest';
// Courses that have public /courses/<id> pages (mirrors COURSES in the platform's
// gen-courses.mjs). english-ru has no course page yet, so it gets no changelog.
const COURSES = ['math', 'english'];
const ymlPath = (id) => `docs/specs/course-format/${id}.course.yml`;
const changelogPath = (id) => path.join(REPO, `docs/specs/course-format/${id}.changelog.json`);

function gitLog(relPath) {
  // tab-separated: shortsha \t YYYY-MM-DD \t subject
  const raw = execFileSync(
    'git',
    ['log', '--follow', '--date=short', '--format=%h%x09%ad%x09%s', '--', relPath],
    { cwd: REPO, encoding: 'utf8' },
  );
  return raw.split('\n').filter(Boolean).map((line) => {
    const [sha, date, ...rest] = line.split('\t');
    return { sha, date, subject: rest.join('\t') };
  });
}

for (const id of COURSES) {
  const rel = ymlPath(id);
  let commits = [];
  try { commits = gitLog(rel); }
  catch (e) { console.warn(`warn: git log failed for ${id} (${rel}): ${e.message}`); commits = []; }
  const entries = commitsToChangelog(commits, { repoUrl: REPO_URL });
  const outPath = changelogPath(id);
  writeFileSync(outPath, JSON.stringify(entries, null, 2) + '\n');
  console.log(`${id}: ${entries.length} entries -> ${path.relative(REPO, outPath)}`);
}
