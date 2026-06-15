# Course Loader — Plan 1: loader + EFL app (YAML-driven)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live EFL app (`english-ru.discoveryquest.app`) *driven by* its public, validated `english-ru.course.yml` instead of bespoke code, by building a generic YAML→runtime course loader and a content-injected board registry.

**Architecture:** Approach A from `docs/specs/2026-06-15-course-loader-design.md`. A subject-agnostic `@discoveryquest/course-loader` joins three things that already exist — `BOARD_META[kind].content` (which collection a board draws from), `course.content[collection]` (the authored data, band-sliced per station), and the board's React component — and binds a ready `generate()` per station. The EFL `vocab` generators are refactored from closing over a module-global array to accepting injected items. A unified `CourseQuest` host + a thin lesson host render the loaded course. English Quest stays on its existing `PhonicsQuest` path during this plan (migrated in Plan 2).

**Tech Stack:** Node 22 ESM, `node:test` + `node:assert` (zero-dep unit tests), `js-yaml`, React 18 + framer-motion, the existing `@discoveryquest/engine` / `engine-ui` / `voice-kit` / `english` packages. Verification: `node --test` → `course:check` → `npm run build` → `npm run smoke` → puppeteer drive **+ screenshot**.

**Two repos / two worktrees:**
- Open-core work (Phases A–E): `~/.config/superpowers/worktrees/discovery-quest/efl-port` (branch `efl-port`).
- Platform work (Phases F–G): a **new** platform worktree under `platform/.worktrees/` (two-sessions rule), FF-merged to `main`.

**Scope guard:** Do **not** refactor the phonics/grammar generators or retire `PhonicsQuest` in this plan — only the `vocab` generators (`genPictureMatch`, `genVocabListen`) change. English Quest must stay green throughout.

---

## File Structure

**Create (open core):**
- `packages/course-loader/package.json` — new subject-agnostic package.
- `packages/course-loader/src/loadCourse.js` — the pure data-join.
- `packages/course-loader/src/index.js` — re-export.
- `packages/course-loader/test/loadCourse.test.js` — `node:test` unit tests.
- `packages/english/src/boardRegistry.js` — `{ [kind]: { generate, board, content } }`.
- `packages/english/src/CourseQuest.jsx` — unified quest host (EFL uses it now).
- `packages/english/src/CourseLesson.jsx` — thin lesson host (walks sections→beats).
- `packages/content-english/test/vocab.test.js` — generator-contract tests.

**Modify (open core):**
- `packages/content-english/src/vocab.js:27-130` — refactor `genPictureMatch` + `genVocabListen` to `(items, ctx)`; update the `pictureMatch` / `vocabListen` topic exports.
- `packages/english/src/PhonicsQuest.jsx:29` — bind the built-in `VOCAB` into the two vocab topics so English Quest stays green with the new signature.
- `scripts/gen-schema.mjs:102-104` — add optional `lowercase` / `ui` / `reactions` course-meta fields.
- `docs/specs/course-format/english-ru.course.yml` — add `lowercase: true`, `ui:`, `reactions:`.
- `docs/specs/course-format/course.schema.json` — regenerated artifact (do not hand-edit).

**Create / modify (platform, Phase F).** Note the bespoke EFL runtime lives in
`platform/packages/english-ru/src/` (the app `apps/english-ru/src/` only has `main.jsx`,
which imports `App from '@discoveryquest/english-ru'`):
- New platform worktree; vendor `course-loader`; propagate the open-core changes into platform's `packages/english` + `content-english`; copy the course YAML into the `english-ru` package; **gut `packages/english-ru/src/App.jsx` into the thin loader shell** (keep `main.jsx`'s import intact).
- **Delete the bespoke runtime:** `platform/packages/content-english-ru` (whole package) and `platform/packages/english-ru/src/{curriculum.js,QuestHost.jsx,lessons.jsx,lessons/,voiceLines.js}`. Keep `packages/english-ru` as the thin shell (App.jsx + an adapted MapScreen.jsx).

---

## Phase A — `@discoveryquest/course-loader` package

### Task A1: Scaffold the package

**Files:**
- Create: `packages/course-loader/package.json`

- [ ] **Step 1: Write the package manifest**

```json
{
  "name": "@discoveryquest/course-loader",
  "version": "1.0.0",
  "type": "module",
  "description": "Subject-agnostic YAML→runtime course loader: joins a validated course doc + a board registry into a runnable course.",
  "main": "src/index.js",
  "exports": { ".": "./src/index.js" },
  "scripts": { "test": "node --test" }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/course-loader/package.json
git commit -m "feat(course-loader): scaffold package"
```

### Task A2: `loadCourse` — the data-join (TDD)

**Files:**
- Create: `packages/course-loader/src/loadCourse.js`
- Test: `packages/course-loader/test/loadCourse.test.js`

- [ ] **Step 1: Write the failing tests**

```js
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
  // band 1 station gets the food slice
  assert.deepEqual(course.stationsById.get('s1').generate().items.map((v) => v.word), ['apple']);
});

test('untagged collections pass through whole; unknown board throws', () => {
  const flatDoc = structuredClone(doc);
  flatDoc.course.content.vocab = [{ word: 'x', emoji: '❓' }, { word: 'y', emoji: '❓' }];
  const course = loadCourse(flatDoc, registry);
  assert.equal(course.stationsById.get('s0').generate().items.length, 2);
  assert.throws(() => loadCourse({ course: { worlds: [{ id: 'w', stations: [{ id: 'z', board: 'nope' }] }] } }, registry), /no registry entry/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test packages/course-loader/test/loadCourse.test.js`
Expected: FAIL — "Cannot find module '../src/loadCourse.js'".

- [ ] **Step 3: Implement `loadCourse`**

```js
// Subject-agnostic YAML→runtime loader. Input: a parsed, course:check-valid course doc
// + a board registry { [kind]: { generate, board, content } }. Output: a runnable Course
// (worlds → stations with a bound generate() + Board, plus lessons/narration/meta).
// It knows nothing about phonics or vocab — only how to slice content by band and bind
// the registry's generator. Assumes the doc already passed course:check (no re-validation).

function sliceByBand(items, bands) {
  if (!Array.isArray(items)) return items; // wordbank/object collections pass through
  const tagged = items.some((it) => it && typeof it === 'object' && 'band' in it);
  if (!tagged) return items; // untagged collection → use all of it; band is difficulty-only
  const set = new Set(bands || []);
  return items.filter((it) => set.has(it.band));
}

function bindStation(s, worldId, course, content, registry) {
  const entry = registry[s.board];
  if (!entry) throw new Error(`loadCourse: no registry entry for board "${s.board}"`);
  const items = sliceByBand(entry.content ? content[entry.content] : undefined, s.bands);
  const ctx = { band: (s.bands && s.bands[0]) ?? 0, lowercase: !!course.lowercase };
  return {
    id: s.id, title: s.title, icon: s.icon, sub: s.sub, worldId,
    board: s.board, bands: s.bands || [], lessonId: s.lesson,
    Board: entry.board,
    generate: () => entry.generate(items, ctx),
  };
}

export function loadCourse(doc, registry) {
  const c = doc.course || doc;
  const content = c.content || {};
  const worlds = (c.worlds || []).map((w) => ({
    id: w.id, title: w.title, emoji: w.emoji, color: w.color, blurb: w.blurb,
    stations: (w.stations || []).map((s) => bindStation(s, w.id, c, content, registry)),
  }));
  const stationsById = new Map();
  for (const w of worlds) for (const s of w.stations) stationsById.set(s.id, s);
  return {
    meta: {
      id: c.id, title: c.title, subject: c.subject, companion: c.companion,
      voice: c.voice, lowercase: c.lowercase, ui: c.ui, reactions: c.reactions,
    },
    worlds, stationsById, lessonsById: c.lessons || {}, narration: c.narration || {},
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test packages/course-loader/test/loadCourse.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Add `index.js` + commit**

Create `packages/course-loader/src/index.js`:
```js
export { loadCourse } from './loadCourse.js';
```

```bash
git add packages/course-loader
git commit -m "feat(course-loader): loadCourse — worlds/stations/lessons + band-sliced generate() binding"
```

---

## Phase B — refactor the `vocab` generators to content-injected

### Task B1: `genPictureMatch(items, ctx)` (TDD)

**Files:**
- Modify: `packages/content-english/src/vocab.js:27-58`
- Test: `packages/content-english/test/vocab.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genPictureMatch, genVocabListen } from '../src/vocab.js';

const items = [
  { word: 'cat', emoji: '🐱', ru: 'кошка' },
  { word: 'dog', emoji: '🐶', ru: 'собака' },
  { word: 'cow', emoji: '🐮', ru: 'корова' },
  { word: 'fish', emoji: '🐟', ru: 'рыба' },
  { word: 'frog', emoji: '🐸', ru: 'лягушка' },
];

test('genPictureMatch draws from injected items, carries emoji+ru, 4 choices', () => {
  const p = genPictureMatch(items, { band: 0, lowercase: true });
  assert.ok(items.some((i) => i.word === p.word));
  assert.equal(p.emoji, items.find((i) => i.word === p.word).emoji);
  assert.equal(p.ru, items.find((i) => i.word === p.word).ru);
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].choices.includes(p.word));
  assert.equal(p.steps[0].lower, true);            // lowercase from ctx
  assert.equal(p.steps[0].expected, p.word);
});

test('lowercase falls back to band>=2 when ctx.lowercase is undefined', () => {
  assert.equal(genPictureMatch(items, { band: 0 }).steps[0].lower, false);
  assert.equal(genPictureMatch(items, { band: 2 }).steps[0].lower, true);
});

test('genVocabListen draws from injected items + has playLabel', () => {
  const p = genVocabListen(items, { band: 0, lowercase: true });
  assert.ok(items.some((i) => i.word === p.word));
  assert.equal(p.steps[0].choices.length, 4);
  assert.ok(p.steps[0].playLabel);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test packages/content-english/test/vocab.test.js`
Expected: FAIL — `genPictureMatch` still reads the module global / wrong arity.

- [ ] **Step 3: Refactor `genPictureMatch`**

Replace the body of `genPictureMatch` (currently `genPictureMatch(band = 0)` reading the module-global `VOCAB`) with:

```js
export function genPictureMatch(items, ctx = {}) {
  const band = ctx.band ?? 0;
  const lower = ctx.lowercase ?? (band >= 2);
  const target = pick(items);
  const distractors = shuffle(items.filter((v) => v.word !== target.word)).slice(0, 3);
  const choices = shuffle([target, ...distractors]).map((v) => v.word);
  return {
    kind: 'pictureMatch', word: target.word, emoji: target.emoji, ru: target.ru, result: target.word,
    steps: [{
      focus: [], targets: ['ans-0'], effects: [], preEffects: [],
      chip: { label: 'Picture Match', color: C.green },
      banner: 'Which word names this picture?', prompt: 'Tap the word that matches',
      audioPrompt: `word-${target.word}`, emoji: target.emoji, ru: target.ru,
      inputKind: 'choice', choices, lower, expected: target.word,
      hint: `That's a ${target.word}.`, sayQ: [`word-${target.word}`], sayA: [`word-${target.word}`],
    }],
  };
}
```

Update the topic export so English Quest's existing call (`topic.generate(band)`) still works by binding the built-in bank:
```js
export const pictureMatch = {
  id: 'picture-match', title: 'Picture Match', boardKind: 'pictureMatch', bands: [0],
  generate: (band) => genPictureMatch(VOCAB, { band }),
};
```

- [ ] **Step 4: Run the test (genPictureMatch portion) to verify it passes**

Run: `node --test packages/content-english/test/vocab.test.js`
Expected: the two `genPictureMatch` tests PASS; `genVocabListen` test still fails until B2.

- [ ] **Step 5: Commit**

```bash
git add packages/content-english/src/vocab.js packages/content-english/test/vocab.test.js
git commit -m "feat(content-english): genPictureMatch accepts injected items + ctx (content-injection)"
```

### Task B2: `genVocabListen(items, ctx)` + keep PhonicsQuest green

**Files:**
- Modify: `packages/content-english/src/vocab.js:62-94`, `packages/english/src/PhonicsQuest.jsx:29`

- [ ] **Step 1: Refactor `genVocabListen`** the same way (signature `(items, ctx)`, `lower = ctx.lowercase ?? (band >= 2)`, carry `emoji`/`ru`, keep `playLabel`). Update the `vocabListen` topic export to `generate: (band) => genVocabListen(VOCAB, { band })`.

- [ ] **Step 2: Run vocab tests to verify all pass**

Run: `node --test packages/content-english/test/vocab.test.js`
Expected: PASS (all 3).

- [ ] **Step 3: Verify English Quest still imports/uses these unchanged.** `PhonicsQuest.jsx:29` references the `pictureMatch` / `vocabListen` topic objects (not the raw `gen*`), and those now bind `VOCAB` internally — confirm no other call site passes a bare `band`:

Run: `grep -rn "genPictureMatch\|genVocabListen" packages --include='*.jsx' --include='*.js' | grep -v test | grep -v node_modules`
Expected: only the topic exports in `vocab.js` call them; `PhonicsQuest` uses the topic objects. If any other site calls `gen*` with a bare band, update it to pass `(VOCAB, { band })`.

- [ ] **Step 4: Commit**

```bash
git add packages/content-english/src/vocab.js
git commit -m "feat(content-english): genVocabListen accepts injected items + ctx"
```

---

## Phase C — board registry

### Task C1: `boardRegistry.js` (TDD)

**Files:**
- Create: `packages/english/src/boardRegistry.js`
- Test: `packages/english/test/boardRegistry.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_REGISTRY } from '../src/boardRegistry.js';
import { BOARD_META } from '../src/boardMeta.js';

test('registry covers the EFL board kinds and matches BOARD_META content', () => {
  for (const kind of ['pictureMatch', 'vocabListen']) {
    const e = BOARD_REGISTRY[kind];
    assert.ok(e, `missing registry entry: ${kind}`);
    assert.equal(typeof e.generate, 'function');
    assert.equal(typeof e.board, 'function');           // a React component
    assert.equal(e.content, BOARD_META[kind].content);  // single collection for vocab boards
  }
});

test('a registry generator runs against injected items', () => {
  const items = [{ word: 'cat', emoji: '🐱', ru: 'кошка' }, { word: 'dog', emoji: '🐶', ru: 'собака' }];
  const p = BOARD_REGISTRY.pictureMatch.generate(items, { band: 0, lowercase: true });
  assert.ok(items.some((i) => i.word === p.word));
});
```

- [ ] **Step 2: Run to verify it fails**, then **Step 3: implement:**

```js
// Board registry: board kind → { generate, board, content }. The loader uses this to bind
// each station's generator (with band-sliced content) and pick its React component.
// Plan 1 wires the vocab boards (EFL). The phonics/grammar boards are added in Plan 2.
import { genPictureMatch, genVocabListen } from '@discoveryquest/content-english/vocab';
import PictureMatch from './boards/PictureMatch.jsx';
import WordChoice from './boards/WordChoice.jsx';

export const BOARD_REGISTRY = {
  pictureMatch: { generate: genPictureMatch, board: PictureMatch, content: 'vocab' },
  vocabListen:  { generate: genVocabListen,  board: WordChoice,   content: 'vocab' },
};
```

- [ ] **Step 4: Run to verify PASS. Step 5: commit.**

```bash
git add packages/english/src/boardRegistry.js packages/english/test/boardRegistry.test.js
git commit -m "feat(english): BOARD_REGISTRY (vocab boards) for the course loader"
```

---

## Phase D — schema additions (`lowercase` / `ui` / `reactions`)

### Task D1: extend the course-meta schema

**Files:**
- Modify: `scripts/gen-schema.mjs` (the course `properties` block, ~lines 102–104)
- Regenerated: `docs/specs/course-format/course.schema.json`

- [ ] **Step 1: Add the optional fields.** In the `course` `properties` object (lines ~97–110, immediately after `voice: { type: 'object' }` / `engine: { type: 'string' }`), add:

```js
          lowercase: { type: 'boolean' },
          ui: { type: 'object' },
          reactions: { type: 'object' },
```

Leave `required` unchanged (all three optional).

- [ ] **Step 2: Regenerate + validate**

Run:
```bash
npm run course:schema
npm run validate
```
Expected: schema regenerates; `validate` exits 0 (both `--check` pass).

- [ ] **Step 3: Confirm both existing courses still validate**

Run:
```bash
node scripts/course-check.mjs docs/specs/course-format/english.course.yml --app packages/english
node scripts/course-check.mjs docs/specs/course-format/english-ru.course.yml --app packages/english --voice /Users/pavel/dev/discoveryquest/platform/apps/english-ru
```
Expected: both green (exit 0).

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-schema.mjs docs/specs/course-format/course.schema.json
git commit -m "feat(course-format): optional lowercase/ui/reactions course-meta fields"
```

### Task D2: add `lowercase` / `ui` / `reactions` to `english-ru.course.yml`

**Files:**
- Modify: `docs/specs/course-format/english-ru.course.yml`

- [ ] **Step 1: Add under `course:` (sibling of `companion`/`voice`).** `ui` strings are the Russian host chrome; `reactions` lists the Luna reaction-line keys. **The reaction keys must match the clip ids the platform app already has** — defer the exact key values to Phase F5 (read `voiceLines.js` + `public/voice`), but add the structure now with placeholder-but-plausible keys and the real `ui` strings:

```yaml
  lowercase: true
  ui:
    done: Молодец!
    backToMap: На карту
    score: "Ты ответил правильно {correct} из {total}!"
  reactions:
    praise: [praise-0, praise-1, praise-2]
    oops: [oops-0, oops-1]
    solved: [solved-0, solved-1]
```

- [ ] **Step 2: Re-run `course:check` (must stay green).**

Run: `node scripts/course-check.mjs docs/specs/course-format/english-ru.course.yml --app packages/english --voice /Users/pavel/dev/discoveryquest/platform/apps/english-ru`
Expected: green. **`course-check.mjs` only audio-validates narration *beat* keys, not `reactions`/`ui`** — so the placeholder reaction keys here will not fail `course:check`. Reconciling them to the real clip filenames is purely a Phase F5 runtime concern.

- [ ] **Step 3: Commit**

```bash
git add docs/specs/course-format/english-ru.course.yml
git commit -m "feat(english-ru): lowercase + Russian ui/reactions in the course YAML"
```

---

## Phase E — `CourseQuest` host + `CourseLesson` host

> These are React UI; `node:test` can't drive them. Implement by adapting the two
> existing hosts, keep `npm run build` green, and verify behavior in Phase G (puppeteer
> + screenshot). The EFL `QuestHost.jsx` is the closest template (Russian reveal w/
> emoji+en+ru); `PhonicsQuest.jsx` is the open-core sibling.

### Task E1: `CourseQuest.jsx`

**Files:**
- Create: `packages/english/src/CourseQuest.jsx`

- [ ] **Step 1: Implement.** Start from `platform/packages/english-ru/src/QuestHost.jsx` and change these things only:
  - Signature `CourseQuest({ station, course, onExit })`.
  - Build the quest from the station's bound generator: `const quest = useMemo(() => Array.from({ length: QUEST_LEN }, () => station.generate()), [station]);`
  - Render the station's board directly (no `problem.kind` lookup): `const Board = station.Board;`.
  - Reveal reads `problem.emoji` / `problem.ru` (already on the problem from Phase B).
  - Localized chrome from the course: done heading `course.meta.ui?.done`, back-to-map `course.meta.ui?.backToMap`, score line from `course.meta.ui?.score` with `{correct}`/`{total}` interpolated (fallbacks to the English strings).
  - Reaction lines from `course.meta.reactions` (praise/oops/solved arrays) instead of the per-app `voiceLines.js` — pick a random key from the relevant array and `speak()` it.
  - Persist stars exactly as both existing hosts do (`mutateSave` on `s.stations[station.id]`).

- [ ] **Step 2: Build to verify it compiles**

Run: `npm run build` (or the english package's build). Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/english/src/CourseQuest.jsx
git commit -m "feat(english): CourseQuest — course-driven quest host (reveal/ui/reactions from the loaded course)"
```

### Task E2: `CourseLesson.jsx`

**Files:**
- Create: `packages/english/src/CourseLesson.jsx`

- [ ] **Step 1: Implement.** A thin host that takes `{ lesson, narration, lowercase, onDone }` and walks `lesson.sections → beats`. For each beat: `speak(narration[beat.say])` and render `renderLessonView(beat.view, lowercase)` (import `renderLessonView` from `@discoveryquest/english/lessons`). **Pass `lowercase` as the second arg** — omitting it ships capitalized EFL lesson text (behavior regression). Reuse engine-ui `LessonScreen` for the surrounding chrome/advance controls if it fits; otherwise mirror the existing EFL `lessons.jsx` advance UX.

- [ ] **Step 2: `npm run build` green. Step 3: commit.**

```bash
git add packages/english/src/CourseLesson.jsx
git commit -m "feat(english): CourseLesson — YAML-driven lesson host (threads lowercase to renderLessonView)"
```

### Task E3: open-core gate

- [ ] **Step 1: Run the full open-core check**

Run:
```bash
node --test packages/course-loader packages/content-english packages/english
npm run validate
npm run build
```
Expected: all unit tests PASS, `validate` exit 0, build green. **English Quest unchanged** (still on `PhonicsQuest`).

- [ ] **Step 2: FF-merge `efl-port` → `main`** (discovery-quest is solo) once green — or hold per owner preference.

---

## Phase F — rewire the platform EFL app (new platform worktree)

### Task F1: create the platform worktree

- [ ] **Step 1:** From `platform/` main, create an isolated worktree (do NOT edit the shared main checkout — two sessions run platform):

Run:
```bash
cd /Users/pavel/dev/discoveryquest/platform
git worktree add .worktrees/efl-loader -b efl-loader
```

### Task F2: propagate open-core changes + vendor the loader

**Files (in the platform worktree):**
- Vendor: copy `discovery-quest/packages/course-loader` → `platform/packages/course-loader` (or as a vendored dir the app imports), following platform's existing duplicated-package pattern.
- Sync: apply the Phase B `vocab.js` refactor + Phase C `boardRegistry.js` + Phase E `CourseQuest.jsx` / `CourseLesson.jsx` into platform's `packages/content-english` and `packages/english` copies.
- Sync: the Phase D `gen-schema.mjs` + `course.schema.json` deltas if platform carries its own copy.

> Note: platform's `packages/content-english-ru` uses `{ en, ru, emoji }` (key `en`), but
> it is being **deleted**, not reconciled — the loader-driven generators only ever see the
> YAML-shaped `{ word, emoji, ru }` items. No `en`→`word` migration is needed.

- [ ] **Step 1:** Copy the files; `npm install` (workspaces) so `@discoveryquest/course-loader` resolves.
- [ ] **Step 2:** `cd platform && npm run build` — expect green.
- [ ] **Step 3:** Commit on the `efl-loader` branch.

### Task F3: bring the course YAML into the app + load it

**Files:**
- Create: `platform/apps/english-ru/src/course.js` (or import the `.yml` via a Vite YAML plugin / a build-time `js-yaml` parse).
- Copy: `english-ru.course.yml` → `platform/apps/english-ru/` (single source is the public repo; this is the vendored copy).

- [ ] **Step 1:** Parse the YAML to a doc object at build time (`js-yaml`), export it.
- [ ] **Step 2:** `const course = loadCourse(doc, BOARD_REGISTRY);` in `App.jsx`.

### Task F4: rewire `App.jsx` + delete the bespoke runtime

**Files:**
- Modify: `platform/packages/english-ru/src/App.jsx`, `platform/packages/english-ru/src/MapScreen.jsx`
- Delete: `platform/packages/content-english-ru` (whole package), `platform/packages/english-ru/src/{curriculum.js,QuestHost.jsx,lessons.jsx,lessons/,voiceLines.js}`
- Leave intact: `platform/apps/english-ru/src/main.jsx` (still `import App from '@discoveryquest/english-ru'` — now the thin shell)

- [ ] **Step 1:** In `packages/english-ru/src/App.jsx`, parse the YAML → `loadCourse(doc, BOARD_REGISTRY)`. Feed `course.worlds` to `MapScreen` (adapt its props from the old `WORLDS`/`isStationOpen`/`starsOf` in `curriculum.js` to the loaded shape — **preserve the same star-gating logic** verbatim), `course.stationsById.get(id)` + `course` to `CourseQuest`, and `course.lessonsById[lessonId]` + `course.narration` + `course.meta.lowercase` to `CourseLesson`.
- [ ] **Step 2:** Delete the bespoke files/package listed above. Remove `@discoveryquest/content-english-ru` from `packages/english-ru/package.json` deps.
- [ ] **Step 3:** `npm run build` green; `grep -rn "content-english-ru\|QuestHost\|curriculum\|voiceLines" platform/packages/english-ru/src` to confirm nothing still imports the deleted modules.

### Task F5: map `reactions` keys → real voice clips

**Files:**
- Read: the old `apps/english-ru/src/voiceLines.js` (the praise/oops/solved → clip-id mapping) and `apps/english-ru/public/voice/` (actual filenames).
- Modify: the `reactions:` block in the vendored `english-ru.course.yml` to use the **exact** existing clip keys, so no new voice generation is needed.

- [ ] **Step 1:** Reconcile keys; if `course:check --voice` validates them, run it and confirm green.
- [ ] **Step 2:** Commit.

---

## Phase G — verification + deploy

### Task G1: full verification gate (non-negotiable)

- [ ] **Step 1:** `cd platform && npm run build` → green.
- [ ] **Step 2:** `npm run smoke` → green (deterministic generator validators).
- [ ] **Step 3:** `course:check` green for `english-ru.course.yml` (with `--voice`).
- [ ] **Step 4:** **Puppeteer drive _and screenshot_** the EFL app: seed `localStorage`, play one picture station + one listen station + one lesson; screenshot the map, a question, the reveal (emoji + English word + Russian gloss), and a lesson beat. **Eyeball the screenshots** — confirm lowercase words, Russian chrome, and styling intact (Tailwind v4 needs `@source` for sibling workspace packages or classes get purged — check the build pulled in `@discoveryquest/english` classes).
- [ ] **Step 5:** Confirm **kid-facing behavior unchanged** vs the current live app: 3 worlds, picture + listen stations, Russian Luna instruction, authentic English word clips, Russian glosses, Russian Learn-it lessons.
- [ ] **Step 6:** Sanity-check **English Quest** still builds/plays (shared `english`/`content-english` were touched) — drive its app or run its smoke.

### Task G2: deploy (owner approval required)

- [ ] **Step 1:** FF-merge `efl-loader` → platform `main`.
- [ ] **Step 2:** **Confirm with the owner**, then deploy:

Run: `fly deploy . --config apps/english-ru/fly.toml --remote-only`
- [ ] **Step 3:** Verify live at `english-ru.discoveryquest.app`; edit a vocab entry in the YAML → rebuild → confirm the live app reflects the change (proves YAML-driven).

---

## Acceptance (Plan 1)

- Editing `english-ru.course.yml` changes the EFL app — it is genuinely YAML-driven.
- Kid-facing behavior unchanged (3 worlds, picture + listen, Russian Luna, English clips, Russian glosses, Russian lessons).
- Bespoke `packages/english-ru` + `content-english-ru` deleted; the app is a thin `loadCourse` + `CourseQuest` + `CourseLesson` shell.
- `node --test`, `validate`, `build`, `smoke`, `course:check` all green; puppeteer + screenshots verified; English Quest still works.
- Plan 2 (English Quest migration + cumulative-band design addendum) tracked as the follow-up.
